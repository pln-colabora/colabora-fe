# COLABORA — Flow End-to-End (Permohonan PB/PD)

Status: dicocokkan dengan implementasi branch `dev` pada 2026-10-26. Tujuh tahap UI tetap; node/izin dan aksi berasal dari backend. Nomor aktivitas historis tetap dipakai untuk referensi SLA, bukan urutan transisi.
Diagram lengkap tersedia di backend melalui `/docs/architecture` atau
[Markdown flowchart branch dev](https://github.com/pln-colabora/colabora-be/tree/dev/docs/architecture).
Nama `forms/*.html` di bawah adalah referensi prototipe lama, bukan URL frontend aktif;
implementasi frontend ada di `src/app/permohonan` dan `src/lib/workflow.ts`.

## Aktor & Role

| Lane | Role (`fn`) | Tugas utama |
|---|---|---|
| ULP | `pelayanan-pelanggan` | Buka permohonan (JTR/JTM), tutup permohonan (PDL/AIL) |
| ULP | `teknik` | Survei & RAB/KKO/KKF (JTR/JTM), Energize jaringan (JTR/JTM) |
| UP3 | `perencanaan` | Survei & RAB/KKO/KKF (PLG TM), Kebutuhan Tiang (PLG TM), Verifikasi Prioritas (semua jenis), WO Vendor Tiang |
| UP3 | `konstruksi` | WO Vendor Konstruksi, PK Vendor, WO PDKB (jika perlu) |
| UP3 | `transaksi-energi` | Perakitan & tera APP, pemasangan SR/APP & penyalaan (semua jenis) |
| UP3 | `jaringan` | Energize jaringan (PLG TM) |
| UP3 | `nps` | Buat permohonan (PLG TM), Permohonan Perluasan, Delegasi Perintah Kerja |
| UP3 | `pdkb` | Dokumentasi pasca-konstruksi (foto + BAPL), jika PDKB dibutuhkan |
| Vendor | `vendor-tiang` | Pemasangan tiang |
| Vendor | `vendor-konstruksi` | Reservasi material dan konstruksi jaringan (semua jenis) |
| Vendor | `vendor-sr-app` | Akun historis; tidak menerima pekerjaan baru |

---

## Stage 1 — Permohonan PB/PD

| Jenis | Role | Form | SLA |
|---|---|---|---|
| JTR / JTM | `pelayanan-pelanggan` | `forms/01-permohonan-pbpd.html` | H |
| PLG TM | `nps` | `forms/01-permohonan-pbpd.html` (opsi jenis dibatasi otomatis per role login — tidak ada dropdown campuran) | G |

Tanggal pembayaran dan nominal pembayaran wajib diisi. SLA baru menggunakan tanggal
pembayaran, bukan tanggal pembuatan permohonan. Setelah disimpan, node permohonan
completed dan survei tersedia bagi pemiliknya.

## Stage 2 — Survei Perluasan Jaringan

| Jenis | Role | Form | SLA |
|---|---|---|---|
| JTR / JTM | `teknik` | `forms/02-survei.html` (default) | H+2 |
| PLG TM | `perencanaan` | `forms/02-survei.html?jenis=plgtm` | G+2 |

Setelah survei selesai, RAB/KKO/KKF tersedia. Survei tetap dapat direvisi oleh
role/unit pemilik tanpa mengubah waktu completion atau SLA.

## Stage 3 — Perencanaan Perluasan

Owner aksi ditentukan per node/jenis sambungan oleh backend: `teknik`, `perencanaan`, atau `nps`.

| # | Kegiatan | Role | Form |
|---|---|---|---|
| 3 | RAB, KKO & KKF | `teknik` (JTR/JTM) / `perencanaan` (PLG TM) | `forms/04-rab-kko-kkf.html?jenis=jtr\|plgtm` |
| 3b | Kebutuhan Tiang? *(decision)* | sama dengan #3 | dalam form 04 |
| — | Verifikasi Prioritas Pekerjaan (setelah RAB/keputusan tiang, sebelum NPS) | `perencanaan` semua jenis | Konfirmasi, catatan opsional |
| 4 | Permohonan Perluasan | `nps` | `forms/03-permohonan-perluasan.html` |
| 5 | Delegasi Perintah Kerja NPS *(wajib semua permohonan — bukan approval permohonan pelanggan)* | `nps` | dalam form 03 |

Verifikasi prioritas wajib untuk semua jenis setelah RAB dan keputusan tiang;
konfirmasi ini tidak menambah keputusan penolakan.

Decision #3b — Ya: WO Tiang ikut terbit di Stage 4. Tidak: skip WO Tiang.
Decision #5 — NPS **mendelegasikan** PK Pekerjaan ke bagian tujuan (Perencanaan/Konstruksi/Transaksi Energi); bukan menyetujui/menolak permohonan pelanggan itu sendiri. Outcome: **Didelegasikan** → lanjut ke Stage 4. **Dikembalikan** → proses berhenti.

## Stage 4 — Pra Pelaksanaan Konstruksi

Co-owner: `perencanaan` / `konstruksi` / `transaksi-energi`.

| # | Kegiatan | Role | Form |
|---|---|---|---|
| 6 | WO Vendor Tiang | `perencanaan` → Vendor Tiang | `forms/05-wo-vendor.html` (varian Tiang) |
| 7 | WO Vendor Konstruksi | `konstruksi` → Vendor Konstruksi | `forms/05-wo-vendor.html` (varian Konstruksi) |
| — | Perlu PDKB? *(decision)* | `konstruksi` | dalam `forms/07-pk-vendor-pelaksana.html` |
| — | WO PDKB *(jika Ya)* | `konstruksi` | `forms/07b-wo-pdkb.html` |
| 9 | Reservasi Material | `vendor-konstruksi` | `forms/06-reservasi-material.html` |
| 10 | Perakitan & Tera APP | `transaksi-energi` | `forms/06-reservasi-material.html` |

Tera APP tersedia langsung setelah delegasi NPS, paralel dengan cabang WO Tiang
(jika perlu) dan WO Konstruksi. Reservasi material menunggu WO Konstruksi. Bila
perlu PDKB, `tanggal_pdkb` wajib kosong pada kalender satu tim/satu hari dan dibooking
atomik bersama WO Konstruksi; bentrok menghasilkan 409. Estimasi selesai konstruksi
adalah tanggal terpisah. PDKB mengelola kegiatan manual; booking WO terkunci.

## Stage 5 — Pelaksanaan Konstruksi (paralel)

Co-owner: `vendor-tiang` / `vendor-konstruksi` / `pdkb`. Konstruksi UP3 tidak
menyelesaikan node Stage 5–6; revisi lampiran upload WO Konstruksi tetap diizinkan
setelah penerbitan, termasuk setelah closing/returned.

| # | Kegiatan | Role | Form |
|---|---|---|---|
| 11 | Pemasangan Tiang | `vendor-tiang` | `forms/08-pelaksanaan-konstruksi.html` |
| 12 | Pelaksanaan Konstruksi | `vendor-konstruksi` | `forms/08-pelaksanaan-konstruksi.html` |
| — | Dokumentasi PDKB *(jika Perlu PDKB = Ya)* | `pdkb` | `forms/08b-pdkb-dokumentasi.html` |

Pelaksanaan konstruksi menunggu WO Konstruksi, reservasi material, dan WO PDKB
selesai atau skipped yang sah bila tidak perlu PDKB. Pemasangan tiang menunggu WO
Tiang dan skipped bila tidak perlu tiang. Dokumentasi PDKB menunggu konstruksi.

## Stage 6 — Energize Jaringan (paralel)

Co-owner: `teknik` / `jaringan` / `transaksi-energi`.

| # | Kegiatan | Jenis | Role | Form |
|---|---|---|---|---|
| 13 | Pengoperasian Jaringan Listrik | JTR/JTM | `teknik` | `forms/09-energize-jaringan.html` |
| 13 | Pengoperasian Jaringan Listrik | PLG TM | `jaringan` | `forms/09-energize-jaringan.html` |
| 14 | Pemasangan SR/APP & Penyalaan | JTR/JTM | `transaksi-energi` | `forms/12-pemasangan-sr-app.html` |
| 14 | Pemasangan SR/APP & Penyalaan | PLG TM | `transaksi-energi` | `forms/12-pemasangan-sr-app.html` |

SR/APP oleh Transaksi Energi hanya menunggu Tera APP. Energize jaringan menunggu
konstruksi, pemasangan tiang, dan dokumentasi PDKB yang applicable. Pilihan nyala
sementara (`temporary`) atau tetap (`permanent`) melekat pada hasil energize;
keduanya boleh menuju closing dan tidak menjadi status aggregate tersendiri.

## Stage 7 — Penutupan / Selesai

| # | Kegiatan | Role | Form |
|---|---|---|---|
| 15 | Entri & Mutasi PDL | `pelayanan-pelanggan` | `forms/11-closing.html` |
| 16 | Arsip AIL – Updating DIJ | `pelayanan-pelanggan` | dalam form 11 |
| 17 | Selesai | — | status akhir |

---

Closing menunggu **energize jaringan dan SR/APP**. Satu submission menyelesaikan
PDL, AIL, dan Selesai secara atomik. Status aggregate menjadi `completed`; NPS
`returned` tetap terminal dan bukan loop perencanaan.

## SLA per jenis sambungan (H/G + offset hari kerja untuk permohonan baru)

| # | Kegiatan | JTR | JTM/Gardu | PLG TM <5 GWNG | PLG TM >5 GWNG |
|---|---|---|---|---|---|
| 1 | Permohonan PB/PD | H | H | G | G |
| 2 | Survei Perluasan Jaringan | H+2 | H+2 | G+2 | G+2 |
| 3 | RAB, KKO & KKF | H+2 | H+2 | G+2 | G+2 |
| — | Verifikasi Prioritas (mengikuti RAB) | H+2 | H+2 | G+2 | G+2 |
| 4 | Permohonan Perluasan | H+2 | H+2 | H | H |
| 6–7 | WO Vendor (Tiang/Konstruksi) | H+2 | H+2 | H+1 | H+1 |
| 9 | Reservasi Material | H+2 | H+2 | H+2 | H+2 |
| 10 | Perakitan & Tera APP | H+3 | H+3 | H+2 | H+2 |
| 11 | Pelaksanaan Pemasangan Tiang | H+6 | H+8 | H+8 | H+12 |
| 12 | Pelaksanaan Konstruksi | H+8 | H+12 | H+19 | H+49 |
| 13 | Pengoperasian Jaringan Listrik | H+9 | H+13 | H+20 | H+50 |
| 14 | Pemasangan SR/APP & Penyalaan | H+10 | H+14 | H+20 | H+50 |
| 15 | Entri & Mutasi PDL | H+10 | H+10 | H+20 | H+50 |
| 16–17 | Arsip AIL & Selesai | H+10 | H+14 | H+20 | H+50 |

---

## Titik keputusan (ringkas)

1. **Kebutuhan Tiang?** — Stage 3, dalam form 04. Diputuskan Teknik (JTR/JTM) atau Perencanaan (PLG TM). Ya → WO Vendor Tiang terbit di Stage 4.
2. **Delegasi Perintah Kerja NPS** — Stage 3, wajib untuk semua permohonan (bukan kondisional). NPS meneruskan PK ke bagian tujuan, bukan approval permohonan pelanggan. Dikembalikan → proses berhenti (STOP).
3. **Perlu PDKB?** — Stage 4, dalam form 07. Diputuskan Konstruksi. Ya → WO PDKB (Stage 4) + Dokumentasi PDKB (Stage 5).

---

## Perubahan terbaru (relatif terhadap versi lama)

- Stage 1 PLG TM: dibuat oleh **NPS**, bukan Pelayanan Pelanggan.
- Stage 2 PLG TM: disurvei oleh **Perencanaan UP3**, bukan Teknik ULP.
- `forms/01-permohonan-pbpd.html`: dropdown jenis sambungan otomatis dibatasi sesuai role login (NPS → hanya PLG TM; Pelayanan Pelanggan → hanya JTR/JTM) — tidak ada pilihan campuran.
- `forms/02-survei.html`: jadi jenis-aware via query param `?jenis=jtr|plgtm`, guard role menyesuaikan (mirror pola form 04).
- Dashboard: tombol **"+ Permohonan Baru"** kini tampil untuk role `pelayanan-pelanggan` **dan** `nps`.
- Wording keputusan NPS (Stage 3, aktivitas #5) diubah dari **"Persetujuan NPS"** menjadi **"Delegasi Perintah Kerja NPS"** — NPS tidak menyetujui/menolak permohonan pelanggan, hanya mendelegasikan PK Pekerjaan ke bagian tujuan. Edge diagram: `Disetujui/Ditolak` → `Didelegasikan/Dikembalikan`.
- Diagram implementasi terkini ada di backend `docs/architecture/diagrams`; path `workflow/*.html` adalah referensi prototipe historis.

## Ketentuan revisi 24 Oktober 2026

- Tera APP tersedia langsung setelah delegasi NPS; WO APP dihapus dari alur aktif. Riwayat lama tetap terbaca.
- SR/APP hanya menunggu Tera APP, independen dari konstruksi/energize. Closing tetap menunggu keduanya.
- Pengoperasian jaringan memilih nyala sementara atau tetap. Keduanya boleh dilanjutkan sampai closing.
- Survei dapat diedit setelah selesai, termasuk closed/returned, oleh role/unit pemilik. Lampiran WO konstruksi dapat direvisi kapan saja oleh Konstruksi UP3. Riwayat tersimpan; completion dan SLA tetap.
- PDKB mengelola kegiatan manual melalui kalender satu tim/satu tanggal. Konstruksi memilih tanggal kosong saat perlu PDKB. Booking WO terkunci dan divalidasi atomik di backend.
- SLA baru dimulai dari tanggal pembayaran dalam WIB, Senin–Jumat, mengecualikan libur nasional 2026–2027. Cuti bersama tetap dihitung. Pembayaran hari libur bergeser ke hari kerja berikutnya. Deadline lama tetap. Di luar cakupan kalender tidak memakai fallback kalender.
- Sisa hari/status SLA dari backend dipakai pada tampilan dan ekspor.
- Batas file 30 MB; PDF/gambar/XLS/XLSX tetap diterima. Kategori izin tanah/desa pada survei tetap opsional.
- Perincian katalog daya ditunda sesuai keputusan; dropdown daya tidak diubah.

## Referensi

- [Flowchart JTR/JTM](https://github.com/pln-colabora/colabora-be/blob/dev/docs/architecture/diagrams/01-workflow-jtr-jtm.md).
- [Flowchart PLG TM](https://github.com/pln-colabora/colabora-be/blob/dev/docs/architecture/diagrams/02-workflow-plg-tm.md).
- [SLA dan dependency](https://github.com/pln-colabora/colabora-be/blob/dev/docs/architecture/diagrams/10-sla-critical-path.md).
- Backend: `pkg/workflow/definition.go`, `pkg/rbac`, `pkg/businessday`,
  `modules/permohonan/routes.go`, `docs/WORKFLOW_UPDATES_2026-10.md`.
- Frontend: `src/lib/workflow.ts`; izin dan `available_actions` tetap berasal dari backend.

Dokumen ini menggambarkan kode dev, bukan jaminan versi backend yang sedang online.
Perincian katalog daya tetap ditunda; tidak digambarkan sebagai fitur selesai.
