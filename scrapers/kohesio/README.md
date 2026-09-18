# Kohesio EU Project Raw Data Scraper

Production-grade Python scraper untuk mengekstrak seluruh data mentah (*raw data*) proyek dan program *funding* dari portal resmi **Kohesio European Commission** ([https://kohesio.ec.europa.eu/en/](https://kohesio.ec.europa.eu/en/)).

Dirancang oleh **Senior Data/Scraping Engineer** dengan standar industri:
- Menargetkan langsung **API Internal SPA** (Fetch/XHR) tanpa parsing HTML DOM.
- Menyimpan data mentah 100% utuh dalam format **NDJSON / JSON Lines (`.jsonl`)** tanpa flattening atau modifikasi skema.
- Mendukung dua mode ekstraksi: **Fast Batch List** (throughput tinggi) dan **Deep Full Details** (termasuk *beneficiaries*, *funds*, *program*, *NUTS codes*, dsb).
- Resilien terhadap *rate-limiting* (`HTTP 429`), *gateway timeout* (`HTTP 504`), dan *server error* (`5xx`) dengan mekanisme *exponential backoff & jitter*.
- Mendukung fitur **Resume** otomatis jika koneksi terputus di tengah jalan.

---

## 1. Arsitektur & Endpoint API Kohesio

Kohesio dibangun di atas arsitektur Single Page Application (SPA) berbasis Wikibase / Knowledge Graph (`linkedopendata.eu`). Dua endpoint API internal utama yang digunakan:

### A. Endpoint Batch List (Pencarian & Pagination)
- **URL**: `https://kohesio.ec.europa.eu/api/projects`
- **Metode**: `GET`
- **Parameter Kunci**:
  - `language`: `en` (atau bahasa EU lainnya)
  - `limit`: Jumlah record per batch (contoh: `50` atau `100`)
  - `offset`: Nilai awal pergeseran indeks (contoh: `0`, `50`, `100`, ...)
- **Karakteristik Respons**: Mengembalikan payload JSON berupa `{"list": [...], "numberResults": 2269971}`.
- **Batas Penting**: Menembus batas total `offset >= numberResults` akan memicu *504 Gateway Timeout* dari server Elasticsearch/Knowledge Graph Kohesio. Script secara proaktif mencegah request yang melampaui batas ini.

### B. Endpoint Project Detail (Deep Extraction)
- **URL**: `https://kohesio.ec.europa.eu/api/projects/{item_id}`
- **Parameter Kunci**: `id=https://linkedopendata.eu/entity/{item_id}&language=en`
- **Target Atribut**:
  - `beneficiaries`: Daftar penerima manfaat proyek (*beneficiary label, link, website*).
  - `funds`: Rincian dana (*CF, ERDF, ESF+*, dll).
  - `program`: Program operasional (*operational program*, periode pembiayaan).
  - `budget` & `euBudget`: Total anggaran proyek dan kontribusi Uni Eropa.
  - `cofinancingRate`: Persentase *co-financing*.
  - `region`, `regionText`, `regionUpper1`, `regionUpper2`, `regionUpper3`: Hirarki kode wilayah NUTS.
  - `specificObjectives`, `themeLabels`, `categoryLabels`, `managingAuthorityLabel`, dll.

---

## 2. Instalasi & Prasyarat

Pastikan Python 3.8+ terpasang di sistem.

```bash
# Masuk ke direktori proyek
cd "d:/project/scraping data"

# Pasang dependensi
pip install -r requirements.txt
```

---

## 3. Panduan Eksekusi & Test Run

### A. Quick Test Run (Dry-run 10 Data List)
Untuk memverifikasi koneksi dan kelancaran pipeline penarikan batch dasar:

```bash
python kohesio_scraper.py --limit 5 --max-records 10 --output test_batch.jsonl
```

### B. Test Run Deep Details (3 Data Proyek Lengkap)
Untuk memverifikasi penarikan field mendalam (*beneficiaries, funds, program, NUTS hierarchy*):

```bash
python kohesio_scraper.py --limit 3 --max-records 3 --fetch-details --output test_details.jsonl
```

### C. Eksekusi Skala Penuh (Full Batch Run)
Menjalankan ekstraksi batch list secara kontinyu:

```bash
python kohesio_scraper.py --limit 100 --delay 1.0 --output kohesio_all_projects.jsonl
```

### D. Melanjutkan Proses yang Terhenti (Resume Capability)
### D. Melanjutkan Proses yang Terhenti (Smart Resume Capability)
Jika scraping terhenti karena listrik mati atau koneksi putus, tambahkan flag `--resume`. Script membaca checkpoint state dari `.meta.json` dan memverifikasi set project ID yang sudah tersimpan untuk mencegah data terlewat atau duplikasi:

```bash
python kohesio_scraper.py --country HU --period 2021-2027 --limit 50 --output kohesio_hungary_projects.jsonl --resume
```

### E. Mode Pengayaan Data Mendalam (Deep Enrichment / Update Mode)
Jika Anda sudah memiliki file hasil batch cepat (shallow list) dan ingin memperkaya seluruh data dengan rincian mendalam (*beneficiaries, funds, operational program, category labels*) tanpa membuat duplikasi:

```bash
python kohesio_scraper.py --output kohesio_hungary_projects.jsonl --enrich
```

---

## 4. Opsi Perintah Lengkap (CLI Arguments)

| Argumen | Tipe | Default | Penjelasan |
| :--- | :--- | :--- | :--- |
| `-o`, `--output` | `str` | `kohesio_projects.jsonl` | Path file target berformat NDJSON (.jsonl). |
| `-l`, `--limit` | `int` | `50` | Jumlah record per request batch (rekomendasi: 50–100). |
| `--offset` | `int` | `0` | Nilai offset awal penarikan data. |
| `-m`, `--max-records` | `int` | `None` | Batas maksimum record yang diambil (cocok untuk testing). |
| `-d`, `--fetch-details`| `flag`| `False` | Tarik seluruh detail proyek (termasuk *beneficiaries*, *funds*, dll) secara inline. |
| `--delay` | `float` | `1.0` | Jeda (detik) antar request batch untuk menghindari IP ban. |
| `--detail-delay` | `float` | `0.2` | Jeda (detik) antar request detail saat `--fetch-details` aktif. |
| `--language` | `str` | `en` | Kode bahasa data (default `en`). |
| `--country` | `str` | `None` | Filter negara. Mendukung kode ISO (`HU`, `RO`, `PL`), nama negara (`hungary`), atau URI entitas (`https://linkedopendata.eu/entity/Q3`). |
| `--period` | `str` | `None` | Filter periode pemrograman: `2021-2027` (aktif/ongoing) atau `2014-2020` (arsip). |
| `--active-only` | `flag`| `False` | Hanya simpan proyek yang tanggal selesainya belum lewat (aktif/berjalan). |
| `--min-end-date` | `str` | `None` | Batas minimal tanggal selesai proyek (format `YYYY-MM-DD`). |
| `--resume` | `flag`| `False` | Melanjutkan scraping secara cerdas menggunakan `.meta.json` dan index ID unik. |
| `--enrich` | `flag`| `False` | Memperkaya file `.jsonl` yang ada dengan deep detail secara in-place. |


---

## 5. Struktur & Validasi Output NDJSON

Setiap baris di dalam file `.jsonl` adalah satu JSON string mandiri (`json.dumps(item, ensure_ascii=False)`).

Untuk membaca dan memverifikasi data di Python:

```python
import json

with open("kohesio_projects.jsonl", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        project = json.loads(line)
        print(f"[{i+1}] {project.get('item')} - {project.get('label') or project.get('labels')}")
        if i >= 4:
            break
```
