# EU Funding & Tenders Opportunities Raw Data Scraper

Production-grade Python scraper untuk mengekstrak seluruh data mentah (*raw data*) peluang hibah (*Calls for Proposals / Grants*) dan pengadaan publik (*Calls for Tenders / Procurement*) dari portal resmi **European Commission Funding & Tenders Opportunities** ([https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home)).

Dibangun dengan arsitektur standar industri oleh **Senior Data & Scraping Engineer**:
- **Zero DOM Parsing**: Berkomunikasi langsung dengan REST API SEDIA (*Single Electronic Data Interchange Area*) internal Komisi Eropa.
- **100% Untouched Raw Data**: Seluruh skema asli JSON tersimpan utuh dalam format **NDJSON / JSON Lines (`.jsonl`)** tanpa flattening maupun kehilangan field nested.
- **Dukungan Tipe Penuh**: Mengekstrak peluang hibah riset & inovasi (Horizon Europe, Erasmus+, Creative Europe, dll.) maupun tender pengadaan barang dan jasa publik Eropa.
- **Resiliensi Jaringan Tinggi**: Dilengkapi *connection pooling*, *exponential backoff & jitter* otomatis untuk menangani limitasi rate (`HTTP 429`) dan server timeout (`5xx`).
- **Checkpoint & True Resume**: Menyimpan state pagination di file `.meta.json` sehingga proses penarikan puluhan ribu data dapat dihentikan dan dilanjutkan kapan saja tanpa duplikasi.
- **Atomic Disk Flushing**: Menggunakan `flush()` dan `os.fsync()` pada setiap batch untuk menjamin integritas data saat terjadi gangguan daya listrik atau interupsi sistem.

---

## 1. Arsitektur & Endpoint API Portal

Portal EU Funding & Tenders ditenagai oleh layanan API pencarian korporat Komisi Eropa:

### A. Endpoint REST Search API
- **URL**: `https://api.tech.ec.europa.eu/search-api/prod/rest/search`
- **Parameter URL**: `apiKey=SEDIA`
- **Metode**: `POST`
- **Header & Payload**: Menggunakan multipart form-data yang memuat parameter:
  - `query`: Kueri Elasticsearch boolean (`bool.must`) untuk memfilter berdasarkan tipe, status, periode program, atau kata kunci.
  - `languages`: Array bahasa dokumen (misal: `["en"]`).
  - `sort`: Urutan hasil (default: `{"field": "sortStatus", "order": "ASC"}`).
  - `pageSize`: Jumlah item per batch (mendukung hingga `100` data per request).
  - `pageNumber`: Nomor indeks halaman (1, 2, 3, ...).

### B. Endpoint REST Facet API
- **URL**: `https://api.tech.ec.europa.eu/search-api/prod/rest/facet?apiKey=SEDIA`
- **Fungsi**: Mentranslasikan kode numerik internal (misal kode status atau kode tipe kontrak) menjadi teks deskriptif manusia.

---

## 2. Kamus Lengkap Field Raw Data (Field Dictionary)

Berdasarkan analisis langsung terhadap respon JSON dari portal SEDIA, setiap record terdiri atas dua bagian utama: **Top-Level Attributes** dan **Metadata Attributes**.

### A. Top-Level JSON Attributes (Root Level)

| Nama Field | Tipe | Contoh Nilai | Penjelasan |
| :--- | :--- | :--- | :--- |
| `apiVersion` | `str` | `"2.154"` | Versi arsitektur API SEDIA. |
| `reference` | `str` | `"365ed700-c573-4c7e-91fc-14fe77eff6cc-CN"` | ID referensi unik internal dokumen. |
| `url` | `str` | `"https://ec.europa.eu/.../tender-details/..."` | Tautan langsung menuju halaman web resmi portal. |
| `summary` | `str` | `"Post-Earthquake Transport Recovery..."` | Ringkasan judul peluang atau topik. |
| `content` | `str` | Teks judul atau cuplikan konten proposal/tender. |
| `language` | `str` | `"en"` | Kode bahasa dokumen resmi. |
| `databaseLabel` | `str` | `"SEDIA"` | Label basis data Komisi Eropa. |
| `database` | `str` | `"SEDIA"` | Nama database backend. |
| `accessRestriction`| `bool`| `false` | Status hak akses publik data. |
| `checksum` | `str` | `"D18A0FF9CFC2..."` | Hash verifikasi integritas data SHA-256. |
| `metadata` | `dict` | `{ ... }` | Kontainer utama seluruh detail operasional proyek. |
| `enrichedMetadata`| `dict`| `{}` | Metadata pengayaan tambahan dari sistem backend. |

---

### B. Metadata Attributes (`record["metadata"]`)

Objek `metadata` memuat lebih dari 60 field spesifik tergantung pada jenis peluangnya:

#### 1. Field Umum (Ada pada Grants maupun Tenders)
- `title` (*list of str*): Judul lengkap pengadaan atau panggilan proposal.
- `description` / `descriptionByte` (*list of str*): Deskripsi teknis, latar belakang, dan cakupan proyek (mendukung tag HTML deskripsi resmi).
- `identifier` (*list of str*): Nomor identifikasi resmi dokumen (misal kode topik atau nomor UUID pengadaan).
- `callIdentifier` (*list of str*): Kode induk panggilan tender atau kelompok proposal (misal: `HORIZON-CL5-2026-09`).
- `type` (*list of str*):
  - `"0"`: **Tenders / Procurement** (Kontrak pengadaan barang & jasa publik).
  - `"1"`: **Grants / Calls for Proposals** (Hibah riset & inovasi).
- `status` (*list of str*):
  - `"31094502"`: **Open** (Sedang dibuka untuk pengajuan).
  - `"31094501"`: **Forthcoming** (Akan datang).
  - `"31094503"`: **Closed** (Telah ditutup).
- `startDate` (*list of str*): Tanggal resmi pembukaan pengajuan (`YYYY-MM-DDTHH:MM:SS`).
- `deadlineDate` / `closingDate` (*list of str*): Batas waktu akhir penyerahan proposal/penawaran tender.
- `programmePeriod` (*list of str*): Periode kerangka anggaran Uni Eropa (misal: `["2021 - 2027"]` atau `["2014 - 2020"]`).
- `programmeDivision` (*list of str*): Kode pembagian hierarki program kerja Komisi Eropa.

#### 2. Field Spesifik Grants / Calls for Proposals (`type = 1`)
- `frameworkProgramme` (*list of str*): ID kerangka program induk (misal `43108390` untuk Horizon Europe).
- `callTitle` (*list of str*): Judul payung tema panggilan proposal (misal: `"BATTERIES and ENERGY"`).
- `actions` & `typesOfAction` (*list of str*): Jenis tindakan hibah (misal: *HORIZON Innovation Actions*, *Research and Innovation Actions*, *Coordination and Support Actions*).
- `budgetOverview` (*list of str/JSON string*): Struktur anggaran rinci berdasarkan tahun dan distribusi topik aksi.
- `crossCuttingPriorities` (*list of str*): Prioritas tematik lintas sektor (misal: `RePowerEU`, `AI`, `DigitalAgenda`, `Green Deal`).
- `deadlineModel` (*list of str*): Model evaluasi pengajuan (*single-stage* atau *two-stage*).
- `topicConditions` (*list of str*): Syarat kelayakan umum, aturan legal, dan dokumen evaluasi.
- `supportInfo` (*list of str*): Informasi dukungan helpdesk, manual pengajuan, dan panduan pelamar.
- `keywords` (*list of str*): Kata kunci klasifikasi topik.
- `latestInfos` (*list of str/JSON string*): Berita terbaru atau pengumuman pembukaan sesi sistem penyerahan.

#### 3. Field Spesifik Tenders / Procurement (`type = 0`)
- `caName` (*list of str*): Nama instansi / otoritas pengadaan (*Contracting Authority*).
- `cftLeadContractingAuthorityCode` (*list of str/JSON string*): Rincian institusi atau kementerian yang memimpin proses lelang beserta alamatnya.
- `contractType` (*list of str*): Kode jenis kontrak:
  - `31095498`: Services (Jasa)
  - `31095499`: Supplies (Pengadaan barang/perbekalan)
  - `31095501`: Works (Pekerjaan konstruksi/sipil)
- `procedureType` (*list of str*): Jenis prosedur lelang (terbuka, restricted, negosiasi terakselerasi).
- `awardMethod` (*list of str*): Metode penentuan pemenang (misal: `4` = *Best price-quality ratio*, `2` = *Lowest price*).
- `cftEstimatedTotalProcedureValue` (*list of str*): Estimasi total nilai kontrak beserta mata uang (contoh: `1200000000 EUR`).
- `mainCpv` & `mainCpvCode` (*list of str*): Kode klasifikasi pengadaan barang dan jasa Uni Eropa (*Common Procurement Vocabulary*).
- `lots` (*list of str/JSON string*): Rincian pembagian paket lelang (*procurement lots*), kuota lot, dan kriteria kualifikasi tenderer.
- `cftDocuments` (*list of str/JSON string*): Metadata dokumen lampiran spesifikasi teknis dan berkas pengadaan resmi.
- `cftSubmissionMethodCode` (*list of str*): Metode pengiriman dokumen penawaran (`ESUBMISSION` atau `PAPER_COPY`).
- `cftBuyerProfileUrl` (*list of str*): Tautan menuju profil pembeli resmi otoritas terkait.

---

## 3. Instalasi & Prasyarat

Pastikan Python 3.8+ telah terpasang.

```bash
# 1. Masuk ke direktori scraper
cd "d:/project/scraping data/scrapping data from ec.europa.eu funding-tenders"

# 2. Pasang dependensi
pip install -r requirements.txt
```

---

## 4. Panduan Eksekusi & Contoh Penggunaan

### A. Menarik 100 Data Sampel Default (Campuran / Tenders & Grants)
```bash
python funding_tenders_scraper.py --max-records 100 --output contoh_100_opportunities.jsonl
```

### B. Menarik 100 Peluang Hibah Riset (Calls for Proposals / Grants Only)
```bash
python funding_tenders_scraper.py --type grants --max-records 100 --output contoh_100_grants.jsonl
```

### C. Menarik 100 Kontrak Pengadaan Publik (Tenders Only)
```bash
python funding_tenders_scraper.py --type tenders --max-records 100 --output contoh_100_tenders.jsonl
```

### D. Filter Peluang yang Sedang Terbuka (Status: Open)
```bash
python funding_tenders_scraper.py --status open --max-records 100 --output open_opportunities.jsonl
```

### E. Filter Berdasarkan Periode Kerangka Kerja 2021-2027 & Kata Kunci
```bash
python funding_tenders_scraper.py --period 2021-2027 --keywords "artificial intelligence" --max-records 50 --output ai_funding.jsonl
```

### F. Melanjutkan Proses yang Terhenti (Smart Resume)
Jika scraping skala besar terputus karena jaringan terputus atau komputer dimatikan, tambahkan parameter `--resume`. Skrip akan membaca state dari `.meta.json` dan melanjutkan dari halaman terakhir:
```bash
python funding_tenders_scraper.py --max-records 1000 --output eu_all_tenders.jsonl --resume
```

### G. Inspeksi Lapangan / Analisis Field File yang Sudah Disimpan
Untuk melihat statistik kelengkapan field dari file `.jsonl` tanpa melakukan scraping ulang:
```bash
python funding_tenders_scraper.py --output contoh_100_opportunities.jsonl --inspect-fields
```

### H. Ekspor Beberapa Data Sampel ke Format JSON Rapi (Human-Readable)
Untuk mengekspor 3 data pertama ke dalam file `.json` dengan indentasi rapi agar mudah dibaca di teks editor:
```bash
python funding_tenders_scraper.py --output contoh_100_opportunities.jsonl --export-sample-json 3
```

---

## 5. Ringkasan File di Folder Ini

- `funding_tenders_scraper.py`: Program scraper utama berbasis CLI.
- `requirements.txt`: Spesifikasi library Python (`requests`, `urllib3`).
- `README.md`: Dokumentasi teknis dan kamus data.
- `contoh_100_opportunities.jsonl`: File hasil scraping 100 data mentah peluang tender.
- `contoh_100_grants.jsonl`: File hasil scraping 100 data mentah peluang hibah riset.
- `contoh_100_opportunities_sample_3.json`: Sampel 3 data tender terformat rapi untuk inspeksi visual.
- `contoh_100_grants_sample_3.json`: Sampel 3 data hibah terformat rapi untuk inspeksi visual.
