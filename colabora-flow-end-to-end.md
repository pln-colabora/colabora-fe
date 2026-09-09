# COLABORA — Flow End-to-End (Permohonan PB/PD)

Status: terbaru per 2026-09-08. 17 aktivitas dikelompok jadi 7 stage UI. Role Stage 1–2 berbeda per jenis sambungan (JTR/JTM vs PLG TM); stage lain sama.

## Aktor & Role

| Lane | Role (`fn`) | Tugas utama |
|---|---|---|
| ULP | `pelayanan-pelanggan` | Buka permohonan (JTR/JTM), tutup permohonan (PDL/AIL) |
| ULP | `teknik` | Survei & RAB/KKO/KKF (JTR/JTM), Energize jaringan (JTR/JTM) |
| UP3 | `perencanaan` | Survei & RAB/KKO/KKF (PLG TM), Kebutuhan Tiang (PLG TM), WO Vendor Tiang |
| UP3 | `konstruksi` | WO Vendor Konstruksi, PK Vendor, WO PDKB (jika perlu) |
| UP3 | `transaksi-energi` | WO Vendor APP, reservasi material, perakitan & tera APP |
| UP3 | `jaringan` | Energize jaringan (PLG TM) |
| UP3 | `nps` | Buat permohonan (PLG TM), Permohonan Perluasan, Delegasi Perintah Kerja |
| UP3 | `pdkb` | Dokumentasi pasca-konstruksi (foto + BAPL), jika PDKB dibutuhkan |
| Vendor | `vendor-tiang` | Pemasangan tiang |
| Vendor | `vendor-konstruksi` | Konstruksi jaringan (semua jenis); SR/APP & penyalaan (PLG TM) |
| Vendor | `vendor-sr-app` | SR/APP & penyalaan (JTR/JTM) |

---

## Stage 1 — Permohonan PB/PD

| Jenis | Role | Form | SLA |
|---|---|---|---|
| JTR / JTM | `pelayanan-pelanggan` | `forms/01-permohonan-pbpd.html` | H |
| PLG TM | `nps` | `forms/01-permohonan-pbpd.html` (opsi jenis dibatasi otomatis per role login — tidak ada dropdown campuran) | G |

Output: status *Survey*.

## Stage 2 — Survei Perluasan Jaringan

| Jenis | Role | Form | SLA |
|---|---|---|---|
| JTR / JTM | `teknik` | `forms/02-survei.html` (default) | H+2 |
| PLG TM | `perencanaan` | `forms/02-survei.html?jenis=plgtm` | G+2 |

Output: status *Permohonan Perluasan Jaringan*.

## Stage 3 — Perencanaan Perluasan

Co-owner: `teknik` / `perencanaan` / `nps`. Narrow per permohonan via `CURRENT_STAGE_OWNERS`.

| # | Kegiatan | Role | Form |
|---|---|---|---|
| 3 | RAB, KKO & KKF | `teknik` (JTR/JTM) / `perencanaan` (PLG TM) | `forms/04-rab-kko-kkf.html?jenis=jtr\|plgtm` |
| 3b | Kebutuhan Tiang? *(decision)* | sama dengan #3 | dalam form 04 |
| 4 | Permohonan Perluasan | `nps` | `forms/03-permohonan-perluasan.html` |
| 5 | Delegasi Perintah Kerja NPS *(wajib semua permohonan — bukan approval permohonan pelanggan)* | `nps` | dalam form 03 |

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
| 8 | WO Vendor APP | `transaksi-energi` → Vendor SR APP | `forms/05-wo-vendor.html` (varian APP) |
| 9 | Reservasi Material | `transaksi-energi` | `forms/06-reservasi-material.html` |
| 10 | Perakitan & Tera APP | `transaksi-energi` | `forms/06-reservasi-material.html` |

## Stage 5 — Pelaksanaan Konstruksi (paralel)

Co-owner: `vendor-tiang` / `vendor-konstruksi` / `pdkb`. Konstruksi UP3 **tidak** punya wewenang di Stage 5–6 — perannya selesai di Stage 4 (penerbitan WO).

| # | Kegiatan | Role | Form |
|---|---|---|---|
| 11 | Pemasangan Tiang | `vendor-tiang` | `forms/08-pelaksanaan-konstruksi.html` |
| 12 | Pelaksanaan Konstruksi | `vendor-konstruksi` | `forms/08-pelaksanaan-konstruksi.html` |
| — | Dokumentasi PDKB *(jika Perlu PDKB = Ya)* | `pdkb` | `forms/08b-pdkb-dokumentasi.html` |

## Stage 6 — Energize Jaringan (paralel)

Co-owner: `teknik` / `jaringan` / `vendor-sr-app` / `vendor-konstruksi`.

| # | Kegiatan | Jenis | Role | Form |
|---|---|---|---|---|
| 13 | Pengoperasian Jaringan Listrik | JTR/JTM | `teknik` | `forms/09-energize-jaringan.html` |
| 13 | Pengoperasian Jaringan Listrik | PLG TM | `jaringan` | `forms/09-energize-jaringan.html` |
| 14 | Pemasangan SR/APP & Penyalaan | JTR/JTM | `vendor-sr-app` | `forms/12-pemasangan-sr-app.html` |
| 14 | Pemasangan SR/APP & Penyalaan | PLG TM | `vendor-konstruksi` | `forms/12-pemasangan-sr-app.html` |

## Stage 7 — Penutupan / Selesai

| # | Kegiatan | Role | Form |
|---|---|---|---|
| 15 | Entri & Mutasi PDL | `pelayanan-pelanggan` | `forms/11-closing.html` |
| 16 | Arsip AIL – Updating DIJ | `pelayanan-pelanggan` | dalam form 11 |
| 17 | Selesai | — | status akhir |

---

## SLA per jenis sambungan (H/G + offset kalender)

| # | Kegiatan | JTR | JTM/Gardu | PLG TM <5 GWNG | PLG TM >5 GWNG |
|---|---|---|---|---|---|
| 1 | Permohonan PB/PD | H | H | G | G |
| 2 | Survei Perluasan Jaringan | H+2 | H+2 | G+2 | G+2 |
| 3 | RAB, KKO & KKF | H+2 | H+2 | G+2 | G+2 |
| 4 | Permohonan Perluasan | H+2 | H+2 | H | H |
| 6–8 | WO Vendor (Tiang/Konstruksi/APP) | H+2 | H+2 | H+1 | H+1 |
| 9 | Reservasi Material | H+2 | H+2 | H+2 | H+2 |
| 10 | Perakitan & Tera APP | H+3 | H+3 | H+2 | H+2 |
| 11 | Pelaksanaan Pemasangan Tiang | H+6 | H+8 | H+8 | H+12 |
| 12 | Pelaksanaan Konstruksi | H+8 | H+12 | H+19 | H+49 |
| 13 | Pengoperasian Jaringan Listrik | H+9 | H+13 | H+20 | H+50 |
| 14 | Pemasangan SR/APP & Penyalaan | H+10 | H+14 | H+20 | H+50 |
| 15–17 | Penutupan (PDL, AIL, Selesai) | H+10 | H+14 | H+20 | H+50 |

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
- Diagram alur publik (`workflow/jtr-jtm.html`, `workflow/plg-tm.html`) disinkronkan dengan semua perubahan di atas.

## Referensi

- Spec domain lengkap: `DEVELOPMENT.md` (§2 role, §3 tabel 17 aktivitas, §5 screen inventory, §6 RBAC).
- Diagram visual: `workflow/jtr-jtm.html`, `workflow/plg-tm.html`.
- Source RBAC: `assets/rbac.js` (`COLABORA_STAGE_OWNERS`, `COLABORA_ROLES`).
