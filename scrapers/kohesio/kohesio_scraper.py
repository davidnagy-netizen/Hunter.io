#!/usr/bin/env python3
"""
Kohesio EU Project Raw Data Scraper & Enricher
==============================================
Production-grade crawler, scraper, and data enricher targeting the internal API
of the European Commission's Kohesio platform (Knowledge Graph / Wikibase).
Extracts 100% untouched raw JSON data into NDJSON (JSON Lines) format.

Key Features & Hunter.io Integration:
    - Smart Country Resolver: Auto-resolves country codes ('HU', 'hungary' -> Q3).
    - Programming Period Filter: Supports '2021-2027' (ongoing) and '2014-2020' (closed).
    - Date / Active Filter: Option to filter out expired projects (--active-only).
    - True Resume with Metadata Checkpoint: Tracks last offset and query parameters
      in a .meta.json file, preventing filter mismatches and missed offsets.
    - Strict Deduplication: Maintains in-memory set of seen project item IDs (QIDs).
    - Deep Enrichment / Update Mode (--enrich): Enriches existing shallow batch records
      with nested project entities (beneficiaries, funds, NUTS, programs).
    - Resilient network handling: Retry loop with exponential backoff & jitter
      for HTTP 429 (rate limits) and 5xx (server errors/gateway timeouts).
    - Stream writing with atomic disk flushing.
"""

import argparse
import datetime
import json
import logging
import os
import random
import sys
import time
from typing import Any, Dict, List, Optional, Set, Tuple

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("KohesioScraper")

# Static entity lookups for EU & Cohesion Policy
KNOWN_COUNTRIES = {
    "HU": "https://linkedopendata.eu/entity/Q3",
    "HUNGARY": "https://linkedopendata.eu/entity/Q3",
    "RO": "https://linkedopendata.eu/entity/Q28",
    "ROMANIA": "https://linkedopendata.eu/entity/Q28",
    "PL": "https://linkedopendata.eu/entity/Q12",
    "POLAND": "https://linkedopendata.eu/entity/Q12",
    "DE": "https://linkedopendata.eu/entity/Q2",
    "GERMANY": "https://linkedopendata.eu/entity/Q2",
    "FR": "https://linkedopendata.eu/entity/Q1",
    "FRANCE": "https://linkedopendata.eu/entity/Q1",
    "IT": "https://linkedopendata.eu/entity/Q15",
    "ITALY": "https://linkedopendata.eu/entity/Q15",
    "ES": "https://linkedopendata.eu/entity/Q23",
    "SPAIN": "https://linkedopendata.eu/entity/Q23",
    "SK": "https://linkedopendata.eu/entity/Q25",
    "SLOVAKIA": "https://linkedopendata.eu/entity/Q25",
    "CZ": "https://linkedopendata.eu/entity/Q24",
    "CZECHIA": "https://linkedopendata.eu/entity/Q24",
    "AT": "https://linkedopendata.eu/entity/Q16",
    "AUSTRIA": "https://linkedopendata.eu/entity/Q16",
    "HR": "https://linkedopendata.eu/entity/Q30",
    "CROATIA": "https://linkedopendata.eu/entity/Q30",
    "BG": "https://linkedopendata.eu/entity/Q29",
    "BULGARIA": "https://linkedopendata.eu/entity/Q29",
}

PROGRAMMING_PERIODS = {
    "2021-2027": "https://linkedopendata.eu/entity/Q7333082",
    "2014-2020": "https://linkedopendata.eu/entity/Q7333084",
}


def resolve_country_entity(country_input: Optional[str], session: Optional[requests.Session] = None) -> Optional[str]:
    """
    Resolve country input (e.g., 'HU', 'Hungary', 'Q3', or full URL) to full entity URI.
    """
    if not country_input:
        return None
    cleaned = country_input.strip()
    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        return cleaned
    upper = cleaned.upper()
    if upper in KNOWN_COUNTRIES:
        return KNOWN_COUNTRIES[upper]

    # Try dynamic lookup via Kohesio API
    try:
        s = session or requests.Session()
        res = s.get("https://kohesio.ec.europa.eu/api/queries/countries", params={"language": "en"}, timeout=10)
        if res.status_code == 200:
            for item in res.json():
                label = item.get("instanceLabel", "").upper()
                inst = item.get("instance", "")
                if upper == label or upper in inst:
                    return inst
    except Exception as e:
        logger.warning(f"Could not dynamically resolve country '{country_input}': {e}")

    # Fallback to appending entity base if user provided 'Q...'
    if cleaned.startswith("Q") and cleaned[1:].isdigit():
        return f"https://linkedopendata.eu/entity/{cleaned}"

    return country_input


def resolve_period_entity(period_input: Optional[str]) -> Optional[str]:
    """
    Resolve programming period input ('2021-2027', '2014-2020', or full URL).
    """
    if not period_input:
        return None
    cleaned = period_input.strip()
    if cleaned in PROGRAMMING_PERIODS:
        return PROGRAMMING_PERIODS[cleaned]
    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        return cleaned
    return cleaned


class KohesioScraper:
    """
    Production Scraper & Enricher Engine for Kohesio EU Project Data.
    """

    BASE_URL = "https://kohesio.ec.europa.eu"
    PROJECTS_ENDPOINT = "https://kohesio.ec.europa.eu/api/projects"
    ENTITY_BASE_URL = "https://linkedopendata.eu/entity/"

    DEFAULT_HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://kohesio.ec.europa.eu/en/projects",
        "Origin": "https://kohesio.ec.europa.eu",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
    }

    def __init__(
        self,
        output_file: str = "kohesio_projects.jsonl",
        limit: int = 50,
        start_offset: int = 0,
        max_records: Optional[int] = None,
        fetch_details: bool = False,
        language: str = "en",
        delay: float = 1.0,
        detail_delay: float = 0.2,
        timeout: float = 30.0,
        max_retries: int = 5,
        backoff_factor: float = 2.0,
        country: Optional[str] = None,
        programming_period: Optional[str] = None,
        active_only: bool = False,
        min_end_date: Optional[str] = None,
    ):
        self.output_file = output_file
        self.limit = max(1, min(limit, 200))
        self.start_offset = max(0, start_offset)
        self.max_records = max_records
        self.fetch_details = fetch_details
        self.language = language
        self.delay = delay
        self.detail_delay = detail_delay
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.active_only = active_only
        self.min_end_date = min_end_date

        self.session = self._create_resilient_session()
        self.country_filter = resolve_country_entity(country, self.session)
        self.period_filter = resolve_period_entity(programming_period)
        self.is_interrupted = False

        # In-memory deduplication set
        self.seen_ids: Set[str] = set()

    def _create_resilient_session(self) -> requests.Session:
        session = requests.Session()
        session.headers.update(self.DEFAULT_HEADERS)
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=self.backoff_factor,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "HEAD"],
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=10)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        return session

    def _request_with_backoff(
        self, url: str, params: Optional[Dict[str, Any]] = None
    ) -> Optional[requests.Response]:
        attempt = 0
        while attempt < self.max_retries and not self.is_interrupted:
            attempt += 1
            try:
                response = self.session.get(url, params=params, timeout=self.timeout)
                if response.status_code == 200:
                    return response

                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    sleep_time = float(retry_after) if retry_after else (self.backoff_factor ** attempt) + random.uniform(0.5, 1.5)
                    logger.warning(
                        f"[Rate Limit 429] Received 429 on {url}. Backing off for {sleep_time:.2f}s (Attempt {attempt}/{self.max_retries})"
                    )
                    time.sleep(sleep_time)
                    continue

                if response.status_code in [500, 502, 503, 504]:
                    sleep_time = (self.backoff_factor ** attempt) + random.uniform(1.0, 3.0)
                    logger.warning(
                        f"[Server Error {response.status_code}] on {url}. Retrying in {sleep_time:.2f}s (Attempt {attempt}/{self.max_retries})"
                    )
                    time.sleep(sleep_time)
                    continue

                logger.error(f"[HTTP {response.status_code}] Unexpected status for {url}: {response.text[:200]}")
                return None

            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as net_err:
                sleep_time = (self.backoff_factor ** attempt) + random.uniform(1.0, 2.0)
                logger.warning(
                    f"[Network Exception] {net_err.__class__.__name__} on {url}: {net_err}. "
                    f"Retrying in {sleep_time:.2f}s (Attempt {attempt}/{self.max_retries})"
                )
                time.sleep(sleep_time)
            except Exception as exc:
                logger.error(f"[Fatal Request Error] Unexpected exception on {url}: {exc}")
                return None

        logger.error(f"[Max Retries Exceeded] Failed to fetch {url} after {self.max_retries} attempts.")
        return None

    def fetch_projects_batch(self, offset: int, limit: int) -> Tuple[List[Dict[str, Any]], Optional[int]]:
        params = {
            "language": self.language,
            "limit": limit,
            "offset": offset,
        }
        if self.country_filter:
            params["country"] = self.country_filter
        if self.period_filter:
            params["programmingPeriod"] = self.period_filter

        response = self._request_with_backoff(self.PROJECTS_ENDPOINT, params=params)
        if response is None:
            return [], None

        try:
            data = response.json()
            if not isinstance(data, dict):
                logger.error(f"[Invalid Payload] Expected JSON object, got {type(data)}")
                return [], None

            items = data.get("list", [])
            number_results = data.get("numberResults")
            return items, number_results

        except json.JSONDecodeError as decode_err:
            logger.error(f"[JSON Decode Error] Failed to parse response from {response.url}: {decode_err}")
            return [], None

    def fetch_project_detail(self, item_id: str) -> Optional[Dict[str, Any]]:
        detail_url = f"{self.PROJECTS_ENDPOINT}/{item_id}"
        params = {
            "id": f"{self.ENTITY_BASE_URL}{item_id}",
            "language": self.language,
        }
        response = self._request_with_backoff(detail_url, params=params)
        if response is None:
            return None

        try:
            return response.json()
        except json.JSONDecodeError as err:
            logger.error(f"[Detail JSON Error] Failed to decode project detail {item_id}: {err}")
            return None

    def _is_active_project(self, item: Dict[str, Any]) -> bool:
        """
        Check whether project is active / within valid date threshold.
        """
        today_str = datetime.date.today().isoformat()
        min_date = self.min_end_date or (today_str if self.active_only else None)
        if not min_date:
            return True

        # Check endTimes or endTime
        end_times = item.get("endTimes") or []
        if isinstance(end_times, list) and end_times:
            # If any end date is >= min_date, consider active
            for et in end_times:
                if et and str(et) >= min_date:
                    return True
            return False
        elif item.get("endTime"):
            return str(item.get("endTime")) >= min_date

        return True

    def get_meta_filepath(self) -> str:
        return f"{self.output_file}.meta.json"

    def load_existing_state(self) -> Tuple[int, Set[str]]:
        """
        Load seen IDs and existing checkpoint from disk.
        """
        seen_ids = set()
        last_offset = 0

        # 1. Read existing lines to build deduplication index
        if os.path.exists(self.output_file):
            try:
                with open(self.output_file, "r", encoding="utf-8") as f:
                    for line_num, line in enumerate(f, 1):
                        line_str = line.strip()
                        if not line_str:
                            continue
                        try:
                            record = json.loads(line_str)
                            item_id = record.get("item")
                            if item_id:
                                seen_ids.add(item_id)
                        except json.JSONDecodeError:
                            logger.warning(f"Malformed JSON at line {line_num} in {self.output_file}")
                logger.info(f"[Index Loaded] Found {len(seen_ids):,} unique project IDs in {self.output_file}.")
            except Exception as e:
                logger.warning(f"Failed to scan existing IDs: {e}")

        # 2. Check metadata checkpoint
        meta_path = self.get_meta_filepath()
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as mf:
                    meta = json.load(mf)
                    saved_country = meta.get("country")
                    saved_period = meta.get("programming_period")
                    # Check if filters match
                    if saved_country == self.country_filter and saved_period == self.period_filter:
                        last_offset = meta.get("last_offset", 0)
                        logger.info(f"[Checkpoint Found] Resuming from offset {last_offset:,} (filter matched).")
                    else:
                        logger.warning(
                            f"[Checkpoint Filter Mismatch] Saved filters ({saved_country}, {saved_period}) "
                            f"differ from current ({self.country_filter}, {self.period_filter}). Starting offset at 0."
                        )
            except Exception as e:
                logger.warning(f"Could not parse checkpoint {meta_path}: {e}")
        elif len(seen_ids) > 0 and self.country_filter is None:
            # Fallback only when no specific filter is given
            last_offset = len(seen_ids)

        return last_offset, seen_ids

    def save_checkpoint(self, current_offset: int, total_saved: int) -> None:
        """
        Persist scraping checkpoint atomically.
        """
        meta_path = self.get_meta_filepath()
        meta = {
            "last_offset": current_offset,
            "total_saved": total_saved,
            "unique_seen_ids": len(self.seen_ids),
            "country": self.country_filter,
            "programming_period": self.period_filter,
            "active_only": self.active_only,
            "min_end_date": self.min_end_date,
            "updated_at": datetime.datetime.now().isoformat(),
        }
        try:
            temp_path = f"{meta_path}.tmp"
            with open(temp_path, "w", encoding="utf-8") as mf:
                json.dump(meta, mf, indent=2)
            os.replace(temp_path, meta_path)
        except Exception as e:
            logger.warning(f"Failed to write metadata checkpoint: {e}")

    def run(self, resume: bool = False) -> int:
        """
        Execute the extraction pipeline with deduplication and state tracking.
        """
        logger.info("=" * 70)
        logger.info("Starting Kohesio EU Project Scraper & Intelligence Feeder")
        logger.info(f"Target Output     : {self.output_file}")
        logger.info(f"Country Filter    : {self.country_filter or 'All EU Countries'}")
        logger.info(f"Period Filter     : {self.period_filter or 'All Programming Periods'}")
        logger.info(f"Active Only       : {self.active_only} (min_end_date: {self.min_end_date or 'None'})")
        logger.info(f"Batch Limit       : {self.limit}")
        logger.info(f"Fetch Full Details: {self.fetch_details}")
        logger.info(f"Language          : {self.language}")
        logger.info("=" * 70)

        current_offset = self.start_offset
        if resume:
            last_offset, loaded_seen = self.load_existing_state()
            self.seen_ids.update(loaded_seen)
            if self.start_offset == 0 and last_offset > 0:
                current_offset = last_offset
        elif os.path.exists(self.output_file):
            _, loaded_seen = self.load_existing_state()
            self.seen_ids.update(loaded_seen)

        total_saved = 0
        total_available = None
        start_time = time.time()

        os.makedirs(os.path.dirname(os.path.abspath(self.output_file)), exist_ok=True)

        try:
            with open(self.output_file, "a", encoding="utf-8") as outfile:
                while not self.is_interrupted:
                    if self.max_records is not None and total_saved >= self.max_records:
                        logger.info(f"[Limit Reached] Collected desired max_records ({self.max_records}).")
                        break

                    if total_available is not None and current_offset >= total_available:
                        logger.info(
                            f"[Complete] Offset ({current_offset:,}) reached total available ({total_available:,})."
                        )
                        break

                    current_limit = self.limit
                    if self.max_records is not None:
                        remaining = self.max_records - total_saved
                        if remaining < current_limit:
                            current_limit = remaining

                    logger.info(f"[Request] Fetching batch at offset={current_offset:,}, limit={current_limit}...")
                    items, reported_total = self.fetch_projects_batch(current_offset, current_limit)

                    if reported_total is not None and total_available is None:
                        total_available = reported_total
                        logger.info(f"[Total Found] Portal reports {total_available:,} total matching projects.")

                    if not items:
                        logger.info(f"[Empty Batch] No items returned at offset={current_offset}. Stopping pagination.")
                        break

                    batch_saved = 0
                    batch_skipped_dup = 0
                    batch_skipped_expired = 0

                    for raw_item in items:
                        if self.max_records is not None and total_saved >= self.max_records:
                            break

                        item_id = raw_item.get("item")
                        if not item_id:
                            continue

                        # Deduplication check
                        if item_id in self.seen_ids:
                            batch_skipped_dup += 1
                            continue

                        # Active / Date check
                        if (self.active_only or self.min_end_date) and not self._is_active_project(raw_item):
                            batch_skipped_expired += 1
                            continue

                        item_to_save = raw_item

                        # Optional Deep Detail Fetch
                        if self.fetch_details:
                            detail_record = self.fetch_project_detail(item_id)
                            if detail_record:
                                item_to_save = detail_record
                            if self.detail_delay > 0:
                                time.sleep(self.detail_delay)

                        # Write to NDJSON
                        line = json.dumps(item_to_save, ensure_ascii=False)
                        outfile.write(line + "\n")
                        self.seen_ids.add(item_id)
                        total_saved += 1
                        batch_saved += 1

                    outfile.flush()
                    current_offset += len(items)

                    # Update Checkpoint
                    self.save_checkpoint(current_offset, total_saved)

                    elapsed = time.time() - start_time
                    rate = total_saved / elapsed if elapsed > 0 else 0.0
                    progress_pct = (
                        f" ({(current_offset) / total_available * 100:.2f}%)"
                        if total_available
                        else ""
                    )

                    logger.info(
                        f"[Batch Saved] +{batch_saved} saved | {batch_skipped_dup} dupes | "
                        f"{batch_skipped_expired} expired | Offset: {current_offset:,} | "
                        f"Total Saved: {total_saved:,}{progress_pct} | Speed: {rate:.1f} rec/s"
                    )

                    if self.delay > 0 and not self.is_interrupted:
                        time.sleep(self.delay)

        except KeyboardInterrupt:
            logger.warning("\n[Interrupted] KeyboardInterrupt received. Safely stopping...")
            self.is_interrupted = True
        except Exception as err:
            logger.critical(f"[Unexpected Error] Pipeline crashed: {err}", exc_info=True)
        finally:
            self.save_checkpoint(current_offset, total_saved)
            elapsed = time.time() - start_time
            logger.info("=" * 70)
            logger.info("Execution Summary")
            logger.info(f"Records Saved   : {total_saved:,}")
            logger.info(f"Total In File   : {len(self.seen_ids):,}")
            logger.info(f"Last Offset     : {current_offset:,}")
            logger.info(f"Total Time      : {elapsed:.2f} seconds")
            logger.info(f"Output File     : {os.path.abspath(self.output_file)}")
            if os.path.exists(self.output_file):
                file_size_mb = os.path.getsize(self.output_file) / (1024 * 1024)
                logger.info(f"File Size       : {file_size_mb:.2f} MB")
            logger.info("=" * 70)

        return total_saved

    def enrich_existing_file(self) -> int:
        """
        Deep detail enrichment mode:
        Iterates over an existing NDJSON file and fetches deep details (beneficiaries, funds,
        programs, descriptions) for any record that only has basic batch-level fields.
        Rewrites the file safely without data loss.
        """
        if not os.path.exists(self.output_file):
            logger.error(f"[Enrich Error] Target file {self.output_file} does not exist.")
            return 0

        logger.info("=" * 70)
        logger.info(f"Starting Deep Enrichment for {self.output_file}")
        logger.info("=" * 70)

        temp_output = f"{self.output_file}.enriched.tmp"
        total_enriched = 0
        total_already_detailed = 0
        total_processed = 0

        with open(self.output_file, "r", encoding="utf-8") as infile, \
             open(temp_output, "w", encoding="utf-8") as outfile:
            for line_idx, line in enumerate(infile, 1):
                if self.is_interrupted:
                    break
                line_str = line.strip()
                if not line_str:
                    continue
                total_processed += 1
                try:
                    record = json.loads(line_str)
                    item_id = record.get("item")

                    # Check if already has deep details
                    has_details = "beneficiaries" in record or "funds" in record or "description_raw" in record
                    if has_details or not item_id:
                        outfile.write(json.dumps(record, ensure_ascii=False) + "\n")
                        total_already_detailed += 1
                        continue

                    # Fetch detail
                    logger.info(f"[Enriching {line_idx}] Fetching detail for {item_id}...")
                    detail = self.fetch_project_detail(item_id)
                    record_to_write = detail if detail else record
                    outfile.write(json.dumps(record_to_write, ensure_ascii=False) + "\n")
                    total_enriched += 1

                    if self.detail_delay > 0:
                        time.sleep(self.detail_delay)

                    if total_enriched % 20 == 0:
                        outfile.flush()
                        logger.info(f"[Enrich Progress] {total_enriched} items enriched so far.")

                except Exception as e:
                    logger.error(f"Error enriching line {line_idx}: {e}")
                    outfile.write(line_str + "\n")

        # Replace original file atomically
        if not self.is_interrupted:
            os.replace(temp_output, self.output_file)
            logger.info(f"[Enrich Complete] Total records processed: {total_processed}, Enriched: {total_enriched}")
        else:
            logger.warning(f"[Enrich Interrupted] Partial enriched output saved at {temp_output}")

        return total_enriched


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Kohesio EU Project Raw Data Scraper & Enricher (Hunter.io Intelligence)",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "-o", "--output",
        default="kohesio_projects.jsonl",
        help="Path to output NDJSON (.jsonl) file.",
    )
    parser.add_argument(
        "-l", "--limit",
        type=int,
        default=50,
        help="Number of records per pagination batch request.",
    )
    parser.add_argument(
        "--offset",
        type=int,
        default=0,
        help="Starting offset for pagination.",
    )
    parser.add_argument(
        "-m", "--max-records",
        type=int,
        default=None,
        help="Maximum total records to extract (recommended for testing).",
    )
    parser.add_argument(
        "-d", "--fetch-details",
        action="store_true",
        help="Fetch deep project details (beneficiaries, funds, programs, NUTS) per item.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Delay in seconds between batch requests.",
    )
    parser.add_argument(
        "--detail-delay",
        type=float,
        default=0.2,
        help="Delay in seconds between detail requests.",
    )
    parser.add_argument(
        "--language",
        default="en",
        help="Language code parameter for API requests.",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume scraping automatically using checkpoint .meta.json and seen ID index.",
    )
    parser.add_argument(
        "--country",
        default=None,
        help="Country ISO code (e.g. HU, RO, PL) or entity URI (e.g. https://linkedopendata.eu/entity/Q3).",
    )
    parser.add_argument(
        "--period",
        default=None,
        help="Programming period: '2021-2027' or '2014-2020'.",
    )
    parser.add_argument(
        "--active-only",
        action="store_true",
        help="Filter out projects with end dates in the past (only active/ongoing projects).",
    )
    parser.add_argument(
        "--min-end-date",
        default=None,
        help="Minimum project end date (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--enrich",
        action="store_true",
        help="Enrich existing .jsonl file by fetching deep details for shallow records.",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    scraper = KohesioScraper(
        output_file=args.output,
        limit=args.limit,
        start_offset=args.offset,
        max_records=args.max_records,
        fetch_details=args.fetch_details,
        language=args.language,
        delay=args.delay,
        detail_delay=args.detail_delay,
        country=args.country,
        programming_period=args.period,
        active_only=args.active_only,
        min_end_date=args.min_end_date,
    )

    if args.enrich:
        scraper.enrich_existing_file()
    else:
        scraper.run(resume=args.resume)


if __name__ == "__main__":
    main()
