# Audit kebutuhan Fundor — 23 September 2026

Basis: AGENTS.md dan kode `main` pada commit `0c8d5dd`. Audit implementasi lokal, bukan sertifikasi hukum, audit keamanan menyeluruh, atau pengujian deployment produksi. Tidak ada perubahan fitur dalam audit ini.

**Keputusan yang disarankan: belum menerima implementasi sebagai pemenuhan penuh CR-01–CR-03.** Migrasi Laravel + React TypeScript sudah berjalan, tetapi beberapa aturan hanya tersedia sebagai helper/test dan belum ditegakkan pada jalur aplikasi sebenarnya.

## Temuan dan tugas penerimaan

| Prioritas | Kebutuhan dan bukti | Dampak | Kriteria selesai |
| --- | --- | --- | --- |
| P0 | NAV: `app/Services/Nav/NavTaxpayerService.php:120` memanggil fallback dummy tanpa pengecekan environment. Tanpa konfigurasi NAV, nomor berformat valid dapat menghasilkan perusahaan buatan dengan status VALID. Request saat ini berupa GET JSON; belum ada bukti integrasi langsung produksi NAV dalam audit ini. | Konfirmasi perusahaan dapat terlihat resmi meskipun datanya dummy. | Produksi menolak lookup bila integrasi tidak tersedia; dummy hanya pada test/demo eksplisit; verifikasi integrasi resmi end-to-end dan uji respons gagal/tidak valid. |
| P0 | Registrasi: `app/Http/Controllers/Api/AuthController.php:24` mewajibkan username, membuat email opsional, tidak memvalidasi/mengikat nomor pajak dan hasil NAV, lalu langsung membuat sesi. | Panggilan API langsung dapat melewati konfirmasi perusahaan di UI. | Server mewajibkan email, password, nomor pajak tervalidasi dan hasil NAV yang terikat ke registrasi; jangan percaya nama perusahaan kiriman klien sebagai bukti NAV. |
| P0 | Pemisahan pinjaman: `app/Services/Api/Catalog.php:12` tidak menyalin kolom model `instrument_type` ke payload; `rows()` memasukkan seluruh opportunity terbuka ke scorer. Guard `app/Services/Api/Scoring.php:52` hanya bekerja jika atribut tersebut ada dalam array. | Loan dengan tipe tersimpan pada kolom database tetapi tidak pada `api_extra` dapat masuk perhitungan hibah. Unit test sekarang hanya mengirim array langsung ke scorer. | Uji integrasi model database → catalog → scoring harus membuktikan loan/guarantee tidak mendapat grant score. Pertahankan blokir rekomendasi Kavosz sesuai persyaratan sampai persetujuan yang diperlukan tersedia. |
| P0 | Persetujuan: `frontend/src/features/authentication/components/RegisterForm.tsx:161` hanya memiliki terms dan marketing; privacy tidak terpisah. Payload registrasi pada baris 76 tidak membawa consent maupun marketing opt-in. | UI tidak memenuhi checkbox terpisah; pilihan pengguna tidak tersimpan lewat registrasi. | Terms dan privacy independen, tidak tercentang otomatis; marketing opsional; server menyimpan bukti persetujuan dan memvalidasi kewajiban terms/privacy. |
| P0 | Verifikasi email dan hak akun: `routes/api.php`, `app/Models/User.php`, dan alur registrasi tidak menyediakan alur verifikasi email wajib, endpoint ekspor data pribadi, atau penghapusan akun. Ekspor CSV CRM bukan pengganti ekspor data milik pengguna. | Kebutuhan akses setelah verifikasi serta ekspor/penghapusan akun belum terpenuhi. | Implementasikan notifikasi verifikasi Laravel, pembatasan akses sebelum verifikasi, ekspor dan erasure akun dengan pengujian batas kepemilikan data. |
| P1 | Omzet: `database/migrations/2026_01_01_000002_create_company_profiles_table.php:24` menyimpan revenue band sebagai string; `resources/data/reference.json:231` menyediakan 5 band lama. `Profiles::normalize()` menerima teks; exact revenue belum menjadi field decimal terstruktur. Helper `evaluateRevenueThreshold()` tidak dipanggil jalur scoring aplikasi. | Input dan evaluasi tidak mengikuti enam band 1–6 dalam spesifikasi. | Migrasi data ke integer 1–6, exact revenue decimal opsional, UI band sesuai spesifikasi, dan uji API scoring yang membuktikan INSUFFICIENT_DATA saat dibutuhkan. |
| P1 | TEÁOR: `app/Services/Api/Profiles.php` menerima kode string maksimal 10 karakter dan demo menggunakan `28`; UI mengambil kode divisi dari reference. `TeaorClassificationService::resolveTeaor08To25()` berisi contoh mapping dan fallback identitas, tanpa pemanggilan dari alur profil. | Tidak menjamin kode TEÁOR'25 empat digit atau konversi historis yang disyaratkan. | Validasi server terhadap tabel TEÁOR'25/KSH yang diverifikasi; integrasikan konversi dan penanganan mapping ambigu; migrasi data divisi lama. |
| P1 | Profil dan konteks proyek: wizard mengumpulkan sebagian informasi perusahaan/proyek, tetapi tipe organisasi SME/research/dll bukan legal form. Riwayat alokasi de minimis belum dikumpulkan sebagai histori nominal/tanggal per evaluasi; boolean `de_minimis_ok` tidak cukup. Implementasi lookup e-beszamolo tidak ditemukan pada services/routes. | CR-03 tahap 2 dan 3 belum lengkap. | Lengkapi legal form, lookup keuangan on-demand, serta histori de minimis dan konteks per evaluasi; uji persistensi dan pemisahan antar evaluasi. |
| P1 | Pembatasan NAV: endpoint lookup publik; cache memakai `nav_taxpayer_{baseTax}` secara global, bukan organisasi terautentikasi. | Pembatasan cache hanya untuk organisasi sendiri belum ditegakkan. | Ikat lookup ke alur registrasi yang terbatas, terapkan kontrol anti-harvesting, dan batasi cache sesuai kepemilikan organisasi. |
| P1 | Detail loan: migration provenance menyediakan kolom nullable tanpa aturan wajib khusus loan; catalog belum memiliki alur terpisah untuk biaya modal/interest subsidy. Disclaimer yang ditemukan berada di detail opportunity, bukan disclaimer kredit global. | Keberadaan enum/kolom belum menjamin pemenuhan CR-02. | Wajibkan provenance saat menerima loan; uji akses gratis hanya counts/badges; tampilkan disclaimer yang disyaratkan tanpa paywall. Pengembangan rekomendasi tetap mengikuti regulatory gate. |
| P1 | Quality gates: package frontend memakai npm dan oxlint; tidak tersedia konfigurasi pnpm/turbo atau script typecheck sesuai instruksi. `tsconfig.app.json` dan `tsconfig.node.json` tidak menyatakan strict/noImplicitAny/strictNullChecks secara eksplisit. | Workflow validasi belum sama dengan kontrak proyek. Opsi efektif compiler belum boleh diasumsikan hanya dari tidak adanya flag. | Selaraskan workflow resmi dan nyatakan ketiga flag secara eksplisit; jalankan seluruh check yang disepakati. |
| P2 | Rebranding/deployment: branding UI utama sudah Fundor/Fundor Plus; referensi lama masih ada di cookie dan komentar. `config/mail.php:114` default sender masih hello@example.com. Redirect legacy 301 dan HTTPS produksi belum diverifikasi. | CR-01 belum bisa ditutup hanya berdasarkan frontend. | Bersihkan referensi lama sesuai scope, konfigurasi sender @fundor.hu, dan buktikan redirect/HTTPS pada deployment sebenarnya. |
| P2 | Batas tooling: masih ada generator CLI standalone `tests/Fixtures/scoring/generate.mjs` dan `frontend/scripts/generate-api-fixtures.php`. | Belum mengikuti ketentuan tugas CLI melalui Artisan/Queued Job. | Pindahkan generator yang diperlukan ke Artisan atau sepakati perubahan persyaratan secara eksplisit. |

## Bagian yang sudah tersedia

- Backend Laravel dan frontend React TypeScript/Vite; SPA dilayani Laravel.
- Branding utama Fundor/Fundor Plus dan terjemahan HU/EN pada frontend.
- UI lookup perusahaan read-only serta validasi CDV frontend/backend dan FormRequest lookup. Kelulusan unit test tidak membuktikan kesesuaian algoritma dengan sumber resmi; verifikasi eksternal tidak termasuk audit ini.
- Enum instrument, kolom provenance, helper klasifikasi/omzet, dan guard unit scoring tersedia, dengan celah integrasi di atas.
- Pengujian API untuk otorisasi, paywall, data per akun, CRM, NAV dengan Http::fake(), dan scoring.

## Validasi

- `php artisan test`: **147 passed, 6010 assertions**.
- `php vendor/bin/pint --test`: **gagal pada 15 file**, termasuk line ending dan beberapa aturan formatting lainnya.
- Dependency frontend dipasang dengan `npm ci --ignore-scripts` berdasarkan lockfile yang tersedia.
- `npm run build`: **lulus**, termasuk `tsc -b`; Vite memberi peringatan bundle JavaScript sekitar 934 kB sebelum gzip.
- `npm run lint`: **exit 0**, satu peringatan `react(incompatible-library)` pada `OnboardingWizard.tsx:55`. Ini oxlint, bukan ESLint yang disebut di AGENTS.md.
- `npm test`: **belum terverifikasi**. Vitest mulai tetapi tidak mengeluarkan hasil pengujian; percobaan default, satu worker, dan satu worker di luar sandbox tidak menyelesaikan masalah. Proses dihentikan, tidak dihitung sebagai pass atau kegagalan assertion.
- `tsc --showConfig -p tsconfig.app.json`: tidak menampilkan flag strict/noImplicitAny/strictNullChecks. Build yang berhasil belum menjadi bukti pemenuhan konfigurasi eksplisit yang diminta.
- Setelah pull, branch `feat/frontend-rewrite` sudah termasuk dalam histori `main`. Perubahan lokal `lang/en.json` dipertahankan; delapan perubahan penghalang pull dibuang sesuai persetujuan. Selain laporan ini, audit tidak mengubah file kode tracked.

## Urutan pekerjaan untuk PM

1. Sprint pertama: hentikan data NAV dummy di produksi; perbaiki kontrak registrasi dan consent; tutup jalur loan menuju grant scoring.
2. Lengkapi verifikasi email, ekspor dan penghapusan akun sebelum menerima persyaratan akses/data pengguna.
3. Sprint berikutnya: migrasi profil/omzet/TEÁOR, konteks proyek dan de minimis, lookup keuangan, serta pembatasan NAV.
4. Sebelum penerimaan akhir: jalankan tes berbasis kebutuhan end-to-end, semua quality gate, lalu verifikasi konfigurasi mail, HTTPS dan redirect deployment.

Tes yang lulus saat ini menguji perilaku yang sudah dibuat; hasilnya tidak menghapus perbedaan perilaku tersebut terhadap AGENTS.md.
