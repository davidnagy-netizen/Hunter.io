#!/usr/bin/env python3
"""
EU Funding & Tenders Opportunities Portal Raw Data Scraper
==========================================================
Production-grade crawler and raw data extractor targeting the centralized
REST Search API of the European Commission's Funding & Tenders Portal (SEDIA).
Extracts 100% untouched raw JSON data into NDJSON (JSON Lines) format.

Target Portal:
    https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home

Target API Endpoint:
    https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA

Key Capabilities:
    - Zero DOM Parsing: Communicates directly with the official SEDIA REST API.
    - 100% Untouched Raw Data: Preserves the original JSON response structures
      without lossy transformations or flattening.
    - Multi-Type Support: Extracts both Calls for Proposals (Grants) and Calls for
      Tenders (Procurement).
    - Granular Filtering: Supports filtering by opportunity type, status (open,
      forthcoming, closed), programme period (2021-2027, 2014-2020), and keywords.
    - Smart Resume & State Checkpoints: Tracks pagination state, seen references,
      and filter criteria in a companion `.meta.json` checkpoint file.
    - Strict Deduplication: Deduplicates records by unique reference/identifier.
    - Network Resilience: Exponential backoff & random jitter for rate limits (HTTP 429)
      and gateway/server errors (5xx).
    - Stream Writing: Immediate atomic disk flushing for zero data loss upon interruption.
    - Built-in Schema Inspector: Automatically aggregates and displays all discovered
      top-level and metadata fields.
"""

import argparse
import datetime
import json
import logging
import os
import random
import sys
import time
from collections import Counter
from typing import Any, Dict, List, Optional, Set, Tuple

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("FundingTendersScraper")

# Constants & API Configuration
SEDIA_SEARCH_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/search"
SEDIA_FACET_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/facet"
DEFAULT_API_KEY = "SEDIA"
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/128.0.0.0 Safari/537.36"
)

# Known SEDIA Type Codes
TYPE_MAPPING = {
    "all": ["0", "1"],        # Both tenders and grants
    "tenders": ["0"],         # Calls for tender (procurement)
    "tender": ["0"],
    "grants": ["1"],          # Calls for proposals (grants)
    "grant": ["1"],
    "other": ["2", "6", "8"], # Joint undertakings, cascades, others
}

# Known SEDIA Status Codes
STATUS_MAPPING = {
    "all": [],                # No status filter
    "open": ["31094502"],     # Currently open for submission
    "forthcoming": ["31094501"], # Upcoming opportunities
    "closed": ["31094503"],   # Submissions closed / archived
}

# Known Programme Periods
PERIOD_MAPPING = {
    "all": [],
    "2021-2027": ["2021 - 2027"],
    "2014-2020": ["2014 - 2020"],
}


class CheckpointManager:
    """Manages persistent checkpoint metadata for crash resilience and resuming."""

    def __init__(self, output_path: str):
        self.output_path = output_path
        self.meta_path = f"{output_path}.meta.json"

    def load(self) -> Dict[str, Any]:
        """Loads existing checkpoint if valid, otherwise returns default structure."""
        if os.path.exists(self.meta_path):
            try:
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    logger.info(
                        "Loaded checkpoint from '%s': last_page=%d, records_saved=%d",
                        self.meta_path,
                        data.get("last_page", 0),
                        data.get("records_saved", 0)
                    )
                    return data
            except Exception as e:
                logger.warning("Could not read checkpoint file '%s': %s", self.meta_path, e)
        return {
            "last_page": 0,
            "records_saved": 0,
            "seen_references": [],
            "query_config": {},
            "last_updated": None
        }

    def save(self, page_number: int, records_saved: int, seen_references: Set[str], query_config: Dict[str, Any]) -> None:
        """Atomically saves checkpoint to disk."""
        data = {
            "last_page": page_number,
            "records_saved": records_saved,
            "seen_references": list(seen_references),
            "query_config": query_config,
            "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        temp_path = f"{self.meta_path}.tmp"
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.replace(temp_path, self.meta_path)
        except Exception as e:
            logger.error("Failed to write checkpoint file '%s': %s", self.meta_path, e)


class FundingTendersScraper:
    """
    Scraper and raw data extractor for the EU Funding & Tenders Opportunities Portal.
    """

    def __init__(
        self,
        output_file: str = "contoh_100_opportunities.jsonl",
        opportunity_type: str = "all",
        status: str = "all",
        period: str = "all",
        keywords: Optional[str] = None,
        page_size: int = 50,
        max_records: int = 100,
        request_delay: float = 0.5,
        max_retries: int = 5,
        resume: bool = False,
    ):
        self.output_file = output_file
        self.opportunity_type = opportunity_type.lower()
        self.status = status.lower()
        self.period = period
        self.keywords = keywords
        self.page_size = min(max(1, page_size), 100)  # Clamp between 1 and 100
        self.max_records = max_records
        self.request_delay = request_delay
        self.max_retries = max_retries
        self.resume = resume

        self.checkpoint = CheckpointManager(output_file)
        self.session = self._init_session()
        self.seen_references: Set[str] = set()

    def _init_session(self) -> requests.Session:
        """Initializes a resilient HTTP session with retry logic and pooling."""
        session = requests.Session()
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=1.0,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST", "GET"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=20)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        session.headers.update({
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
        })
        return session

    def _build_elasticsearch_query(self) -> Dict[str, Any]:
        """
        Constructs the Elasticsearch boolean query payload based on active filters.
        """
        must_clauses: List[Dict[str, Any]] = []

        # Type filter (Grants, Tenders, etc.)
        type_codes = TYPE_MAPPING.get(self.opportunity_type, TYPE_MAPPING["all"])
        if type_codes:
            must_clauses.append({"terms": {"type": type_codes}})

        # Status filter (Open, Forthcoming, Closed)
        status_codes = STATUS_MAPPING.get(self.status, [])
        if status_codes:
            must_clauses.append({"terms": {"status": status_codes}})

        # Programme Period filter (2021-2027, 2014-2020)
        periods = PERIOD_MAPPING.get(self.period, [])
        if periods:
            must_clauses.append({"terms": {"programmePeriod": periods}})

        # Free text search if specified
        if self.keywords:
            must_clauses.append({
                "multi_match": {
                    "query": self.keywords,
                    "fields": ["title^2", "summary^2", "description", "keywords", "identifier"]
                }
            })

        return {"bool": {"must": must_clauses}} if must_clauses else {"match_all": {}}

    def fetch_page(self, page_number: int) -> Optional[Dict[str, Any]]:
        """
        Fetches a single page of results from the SEDIA Search API with backoff retry.
        """
        params = {
            "apiKey": DEFAULT_API_KEY,
            "text": "***" if not self.keywords else self.keywords,
            "pageSize": str(self.page_size),
            "pageNumber": str(page_number)
        }
        query_payload = self._build_elasticsearch_query()
        languages_payload = ["en"]
        sort_payload = {"field": "sortStatus", "order": "ASC"}

        files = {
            "query": (None, json.dumps(query_payload), "application/json"),
            "languages": (None, json.dumps(languages_payload), "application/json"),
            "sort": (None, json.dumps(sort_payload), "application/json"),
        }

        for attempt in range(1, self.max_retries + 1):
            try:
                response = self.session.post(
                    SEDIA_SEARCH_URL,
                    params=params,
                    files=files,
                    timeout=45
                )

                if response.status_code == 200:
                    return response.json()

                if response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 2 ** attempt))
                    jitter = random.uniform(0.5, 1.5)
                    wait_time = retry_after + jitter
                    logger.warning("HTTP 429 Rate Limit hit. Backing off for %.2fs...", wait_time)
                    time.sleep(wait_time)
                    continue

                if response.status_code in (500, 502, 503, 504):
                    backoff = (2 ** attempt) + random.uniform(0.1, 1.0)
                    logger.warning(
                        "Server error HTTP %d (attempt %d/%d). Retrying in %.2fs...",
                        response.status_code, attempt, self.max_retries, backoff
                    )
                    time.sleep(backoff)
                    continue

                logger.error("Unexpected HTTP response %d: %s", response.status_code, response.text[:200])
                return None

            except requests.RequestException as e:
                backoff = (2 ** attempt) + random.uniform(0.5, 1.5)
                logger.warning(
                    "Network error during fetch (attempt %d/%d): %s. Retrying in %.2fs...",
                    attempt, self.max_retries, e, backoff
                )
                time.sleep(backoff)

        logger.error("Failed to fetch page %d after %d attempts.", page_number, self.max_retries)
        return None

    def run(self) -> int:
        """
        Executes the scraping pipeline with pagination, deduplication, stream writing,
        and checkpoint tracking.
        """
        start_page = 1
        total_saved = 0

        # Create target directory if needed
        output_dir = os.path.dirname(os.path.abspath(self.output_file))
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        # Handle resume
        file_mode = "w"
        if self.resume:
            state = self.checkpoint.load()
            start_page = state.get("last_page", 0) + 1
            total_saved = state.get("records_saved", 0)
            self.seen_references = set(state.get("seen_references", []))
            file_mode = "a"
            logger.info("Resuming scraping from page %d (already saved: %d records)", start_page, total_saved)
        else:
            # Overwrite or fresh start
            if os.path.exists(self.output_file):
                logger.info("Starting fresh run; existing file '%s' will be overwritten.", self.output_file)

        logger.info(
            "Starting scraper: type=%s, status=%s, period=%s, page_size=%d, max_records=%d",
            self.opportunity_type, self.status, self.period, self.page_size, self.max_records
        )

        current_page = start_page
        query_config = {
            "type": self.opportunity_type,
            "status": self.status,
            "period": self.period,
            "keywords": self.keywords
        }

        with open(self.output_file, file_mode, encoding="utf-8") as out_f:
            while total_saved < self.max_records:
                logger.info("Fetching page %d...", current_page)
                data = self.fetch_page(current_page)

                if not data:
                    logger.error("No data returned for page %d. Terminating batch.", current_page)
                    break

                results = data.get("results", [])
                total_results_available = data.get("totalResults", 0)

                if not results:
                    logger.info("Reached end of available results (page %d returned 0 items).", current_page)
                    break

                page_new_saved = 0
                for item in results:
                    ref = item.get("reference") or item.get("url")
                    if ref and ref in self.seen_references:
                        continue

                    # Write untouched raw JSON record as one line
                    json_line = json.dumps(item, ensure_ascii=False)
                    out_f.write(json_line + "\n")

                    if ref:
                        self.seen_references.add(ref)

                    total_saved += 1
                    page_new_saved += 1

                    if total_saved >= self.max_records:
                        break

                # Atomic disk flush
                out_f.flush()
                os.fsync(out_f.fileno())

                logger.info(
                    "Page %d complete: +%d records added (Total saved: %d / %d, Total in portal: %d)",
                    current_page, page_new_saved, total_saved, self.max_records, total_results_available
                )

                # Save checkpoint state
                self.checkpoint.save(current_page, total_saved, self.seen_references, query_config)

                if total_saved >= self.max_records:
                    logger.info("Target goal of %d records successfully reached.", self.max_records)
                    break

                current_page += 1
                if self.request_delay > 0:
                    time.sleep(self.request_delay)

        logger.info("Scraping completed. Total records saved: %d -> '%s'", total_saved, self.output_file)
        return total_saved

    @staticmethod
    def inspect_file_fields(filepath: str) -> None:
        """
        Reads an NDJSON file and outputs a detailed breakdown of all top-level
        and metadata fields present in the raw data.
        """
        if not os.path.exists(filepath):
            logger.error("File not found: %s", filepath)
            return

        top_counter = Counter()
        meta_counter = Counter()
        sample_meta: Dict[str, Any] = {}
        type_counter = Counter()
        total_records = 0

        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue

                total_records += 1
                for k in record.keys():
                    top_counter[k] += 1

                meta = record.get("metadata", {})
                for mk, mv in meta.items():
                    meta_counter[mk] += 1
                    if mk not in sample_meta and mv:
                        sample_meta[mk] = mv

                types = meta.get("type", [])
                if types:
                    for t in types:
                        type_label = "Tender (Procurement)" if t == "0" else "Grant (Call for proposals)" if t == "1" else f"Type {t}"
                        type_counter[type_label] += 1

        print("\n" + "=" * 75)
        print(f"RAW DATA FIELD INVENTORY & INSPECTION REPORT")
        print(f"File: {filepath}")
        print(f"Total Processed Records: {total_records}")
        print("=" * 75)

        print("\n[1] OPPORTUNITY TYPES IN DATASET:")
        for t_label, count in type_counter.most_common():
            pct = (count / total_records) * 100 if total_records else 0
            print(f"  • {t_label}: {count} records ({pct:.1f}%)")

        print("\n[2] TOP-LEVEL JSON KEYS:")
        for k, count in top_counter.most_common():
            pct = (count / total_records) * 100 if total_records else 0
            print(f"  • {k:22} : {count:4d}/{total_records} records ({pct:5.1f}%)")

        print("\n[3] METADATA FIELDS (Inside record['metadata']):")
        print(f"Total Unique Metadata Fields Discovered: {len(meta_counter)}")
        for mk, count in meta_counter.most_common():
            pct = (count / total_records) * 100 if total_records else 0
            sample_val = str(sample_meta.get(mk, []))[:55].replace("\n", " ")
            print(f"  • {mk:35} : {count:4d}/{total_records} ({pct:5.1f}%) | Sample: {sample_val}")

        print("=" * 75 + "\n")


def main() -> None:
    """CLI Entry Point."""
    parser = argparse.ArgumentParser(
        description="EU Funding & Tenders Opportunities Portal Raw Data Scraper (Production-grade)",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    parser.add_argument(
        "-o", "--output",
        default="contoh_100_opportunities.jsonl",
        help="Target output filepath (.jsonl / NDJSON format)"
    )
    parser.add_argument(
        "-m", "--max-records",
        type=int,
        default=100,
        help="Maximum number of raw records to extract"
    )
    parser.add_argument(
        "-p", "--page-size",
        type=int,
        default=50,
        help="Number of records requested per batch (1-100)"
    )
    parser.add_argument(
        "-t", "--type",
        choices=["all", "grants", "tenders", "grant", "tender", "other"],
        default="all",
        help="Filter by opportunity type (grants, tenders, or all)"
    )
    parser.add_argument(
        "-s", "--status",
        choices=["all", "open", "forthcoming", "closed"],
        default="all",
        help="Filter by opportunity status"
    )
    parser.add_argument(
        "--period",
        choices=["all", "2021-2027", "2014-2020"],
        default="all",
        help="Filter by EU programming period"
    )
    parser.add_argument(
        "-k", "--keywords",
        default=None,
        help="Optional free-text search keywords (e.g., 'energy', 'artificial intelligence')"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.5,
        help="Rate-limiting delay in seconds between pagination requests"
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume scraping from the last saved state checkpoint (.meta.json)"
    )
    parser.add_argument(
        "--inspect-fields",
        action="store_true",
        help="Inspect fields of an existing output file instead of scraping"
    )
    parser.add_argument(
        "--export-sample-json",
        type=int,
        default=0,
        metavar="N",
        help="Export first N records from .jsonl as formatted .json for easy human reading"
    )

    args = parser.parse_args()

    # Field inspection only
    if args.inspect_fields:
        FundingTendersScraper.inspect_file_fields(args.output)
        return

    # Export sample JSON if requested
    if args.export_sample_json > 0 and os.path.exists(args.output):
        sample_path = args.output.replace(".jsonl", f"_sample_{args.export_sample_json}.json")
        samples = []
        with open(args.output, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if i >= args.export_sample_json:
                    break
                if line.strip():
                    samples.append(json.loads(line))
        with open(sample_path, "w", encoding="utf-8") as out:
            json.dump(samples, out, indent=2, ensure_ascii=False)
        logger.info("Exported %d sample records to '%s'", len(samples), sample_path)
        return

    scraper = FundingTendersScraper(
        output_file=args.output,
        opportunity_type=args.type,
        status=args.status,
        period=args.period,
        keywords=args.keywords,
        page_size=args.page_size,
        max_records=args.max_records,
        request_delay=args.delay,
        resume=args.resume,
    )

    count = scraper.run()

    # Automatically inspect fields upon successful scraping run
    if count > 0:
        FundingTendersScraper.inspect_file_fields(args.output)


if __name__ == "__main__":
    main()
