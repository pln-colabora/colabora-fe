# Integrasi API COLABORA

Implementasi mengikuti API Reference dan Architecture / API Action Map yang dibaca pada 9 September 2026:

- https://api-colabora.anargya.fun/docs
- https://api-colabora.anargya.fun/docs/architecture#api-actions
- https://api-colabora.anargya.fun/docs/openapi.yaml

## Alur request

Halaman memakai state React lokal. `api.ts` menangani base URL, JSON/multipart, bearer token, refresh, dan error. `auth.ts` memuat profil dari server. `applications.ts` berisi fungsi endpoint dan pemetaan response ke model UI. `workflow.ts` hanya menyimpan metadata presentasi; tidak menghitung transisi, percabangan, atau izin submit.

`available_actions` menentukan tindakan yang dapat dipilih, termasuk aktivitas paralel. `workflow_nodes` menentukan status setiap aktivitas dan SLA. Label PIC mengikuti tabel ownership resmi; scope unit dan assignment tetap diputuskan backend. Tidak ada next-action engine atau authorization berbasis pilihan peran browser.

## API mapping

Prefix `P` pada tabel berarti `/api/permohonan/{id}` (ID UUID dari backend).

| UI / action | Method dan endpoint | Request penting |
| --- | --- | --- |
| Login | POST `/api/auth/login` | `email`, `password` |
| Profil / role / unit | GET `/api/user/me` | Bearer token |
| Refresh token | POST `/api/auth/refresh` | `refresh_token` |
| Logout | POST `/api/auth/logout` | Bearer token |
| Dashboard / list | GET `/api/permohonan?page=...&per_page=100` | Seluruh halaman diambil untuk total/filter yang konsisten; tidak ada detail per baris |
| Detail | GET `P` | UUID permohonan |
| Action 1 / create | POST `/api/permohonan` | `jenis_permohonan`, `jenis_sambungan`, `pelanggan_nama`, `pelanggan_alamat`, `pelanggan_no_hp`; `ulp_unit` hanya PLG TM |
| Action 2 | POST `P/survei` | `surveyed_at`, `document_ids`, optional `notes` |
| Action 3 + kebutuhan tiang | POST `P/rab-kko-kkf` | `kebutuhan_tiang`, `document_ids`, optional `notes` |
| Action 4 + 5 | POST `P/permohonan-perluasan` | `nps_delegation_status`, `document_ids`, optional `notes` |
| Action 6 | POST `P/wo-vendor/tiang` | `document_ids`, optional `notes` |
| Action 7 | POST `P/wo-vendor/konstruksi` | `perlu_pdkb`, `document_ids`, optional `notes` |
| Action 7b | POST `P/wo-pdkb` | `document_ids`, optional `notes` |
| PK vendor | POST `P/pk-vendor` | `document_ids`, optional `notes` |
| Action 8 | POST `P/wo-vendor/app` | `document_ids`, optional `notes` |
| Action 9 + 10 | POST `P/reservasi-material` | `document_ids`, optional `reservation_notes`, `tera_notes` |
| Action 11 / 12 | POST `P/pelaksanaan-konstruksi` | `workflow_node` = `pemasangan_tiang` / `pelaksanaan_konstruksi`, `document_ids`, optional `notes` |
| Action 12b | POST `P/pdkb-dokumentasi` | `document_ids`, optional `notes` |
| Action 13 | POST `P/energize-jaringan` | `operation_result`, `document_ids`, optional `notes` |
| Action 14 | POST `P/pemasangan-sr-app` | `document_ids`, optional `notes` |
| Action 15 + 16 + 17 | POST `P/closing` | `document_ids`, optional `notes` |
| Upload evidence | POST `/api/documents` | Multipart `file`, `type=evidence` |
| Dokumen | GET `P/documents` | Response metadata dokumen yang sudah terikat |
| Preview dokumen | GET `/api/documents/{doc_id}/preview` | Bearer token; bytes dokumen untuk dibuka di browser |
| Unduh dokumen | GET `P/documents/{doc_id}` | Bearer token; response mengikuti redirect presigned URL |
| Riwayat | GET `P/logs` | Judul aktivitas dipetakan dari `workflow_node`; `detail` ditampilkan terpisah |
| Daftar akun vendor | GET `/api/user?page=...&per_page=100` | Filter role dari response; hanya dimuat saat disclosure penugasan dibuka |
| Penugasan vendor | POST `P/vendor-assignments` | `vendor_id`, `vendor_role` |

Submit memakai path dan method dari `available_actions` yang diterima server, dengan batas path permohonan yang sama. Tidak ada endpoint terpisah untuk aksi UI yang memang digabung backend. Response mutation langsung ditampilkan, kemudian detail, dokumen, dan riwayat dimuat ulang. Kegagalan refresh setelah mutation tidak meminta pengguna mengulang mutation yang sudah sukses.

Evidence diunggah sebagai bytes multipart, lalu ID backend diikat oleh submit aktivitas. ID upload yang berhasil dipertahankan selama form terbuka agar retry tidak mengunggah ulang file yang sama. File yang sudah ter-upload tetapi submit gagal tetap belum terikat; lifecycle backend mengelolanya.

## Field mapping dan perbedaan dokumentasi

| UI | API |
| --- | --- |
| Nama pelanggan / lokasi / telepon | `pelanggan_nama` / `pelanggan_alamat` / `pelanggan_no_hp` |
| Nomor tampil / ID route | `no_permohonan` / `id` |
| Pasang baru / Perubahan daya | `Pasang Baru (PB)` / `Perubahan Daya (PD)` |
| JTM / Gardu | `JTM/Gardu` |
| Unit permohonan | `ulp_unit` |
| Ya / Tidak | Boolean `true` / `false`, termasuk false eksplisit |
| Didelegasikan / Dikembalikan | `delegated` / `returned` |
| Status permohonan | `in_progress` / `returned` / `completed` diterjemahkan untuk tampilan |
| SLA | `sla_status` dari node aktif; tidak dihitung ulang memakai tanggal frontend |

Create tidak menerima ID pelanggan, daya, catatan, atau evidence. Field input tersebut dihapus dari create. Daya dan waktu update yang tidak disediakan backend ditampilkan sebagai tanda kosong pada detail; tidak dibuat data pengganti. JTR/JTM tidak mengirim `ulp_unit`: backend mengambil unit caller. PLG TM mengirim unit target sesuai contract.

`GET /api/user/me` secara nyata mengembalikan `unit` untuk akun development; schema `UserResponse` pada OpenAPI saat verifikasi belum mencantumkannya. Tipe frontend mempertahankan `unit` optional berdasarkan response nyata. Dokumen flow lokal lama menjelaskan beberapa transisi serial dan tidak menyebut node PK vendor terpisah; runtime sekarang mengikuti API Action Map (21 node dan aktivitas paralel).

## Login development

`NEXT_PUBLIC_API_BASE_URL` merupakan satu-satunya konfigurasi URL API. Token access/refresh disimpan di `sessionStorage`; profil, nama, role, dan unit selalu diperoleh dari `/api/user/me`. Role tidak disimpan sebagai sumber authorization.

Daftar 15 akun yang diberikan disimpan di `.env.local` yang diabaikan Git, melalui `COLABORA_DEV_ACCOUNTS`. Variabel ini hanya untuk mengisi dropdown development dan diperlukan agar password tidak di-hardcode dalam source. Isinya berupa JSON array objek `name`, `email`, `password`. Halaman production tidak meneruskan daftar akun tersebut ke client. Akun belum dianggap berhasil masuk sampai login API dan pemuatan profil berhasil. Password tidak ditampilkan di ruang kerja.

## File dan perubahan

- `src/lib/api.ts`: instance Axios, interceptor token/refresh, retry, dan error terpusat.
- `src/hooks`: lifecycle request untuk session, daftar dashboard, dan detail permohonan.
- `src/lib/auth.ts`: login/logout dan hook session yang dipakai halaman.
- `src/lib/applications.ts`: endpoint permohonan, evidence, history, assignment, dan mapping API/UI.
- `src/lib/workflow.ts`: metadata tahap/label/PIC/form; seed, overrides, transisi lokal, history dan evidence palsu dihapus.
- `src/components/dashboard/action-form.tsx`: form aktivitas yang dipakai detail dan survei, dengan field API dan upload asli.
- `src/components/dashboard/evidence-uploader.tsx`: drag-and-drop evidence, daftar berkas, validasi, progres, status, dan penghapusan pilihan.
- `src/hooks/use-document-actions.ts`: buka evidence di tab browser dan unduh melalui request terautentikasi.
- `src/components/dashboard/app-shell.tsx`: identitas backend dan logout; switch peran/reset demo dihapus.
- `src/app/login/*`: credential helper development dan login nyata, dengan layout yang sama.
- `src/app/dashboard/page.tsx`: data list API, total/filter, caller-specific task queue, loading/error/retry.
- `src/app/permohonan/baru/page.tsx`: create API sesuai schema.
- `src/app/permohonan/[id]/page.tsx`: detail server, pilihan aksi paralel, node timeline, dokumen/log, penugasan vendor.
- `src/app/permohonan/[id]/survei/page.tsx`: memuat izin/server state dan memakai form aktivitas bersama.
- `.env.example`, `.gitignore`: contoh konfigurasi tanpa password; `.env.local` tetap tidak masuk Git.
- `tests/api.test.cjs`, `package.json`: regression tests memakai Node test runner dan TypeScript yang sudah tersedia.
- `README.md`, dokumen ini: cara menjalankan dan mapping untuk pemeliharaan.

Tidak ada global data store atau workflow engine frontend. Axios menangani transport API dan Sonner menyediakan toast shadcn.

## Verifikasi 9 September 2026

- 15 akun development: login dan profil berhasil pada API asli.
- 29 submit aktivitas nyata dengan helper frontend: upload, submit, refetch, dokumen persisted, dan history berhasil.
- PLG TM tanpa tiang/PDKB: selesai hingga closing; node cabang berstatus skipped dari backend.
- PLG TM dengan tiang/PDKB: selesai hingga closing, termasuk assignment vendor, PK vendor, WO PDKB, dokumentasi PDKB.
- NPS returned: status terminal `returned`, tanpa available action.
- JTR: create berhasil dan unit diambil backend; akses Teknik beda ULP ditolak. Akun Teknik untuk ULP Karang Pilang tidak ada dalam daftar yang diberikan, sehingga flow JTR lengkap tidak diuji.
- Error 400, 401, 403, 404: diperiksa langsung pada API. Error 409, 500, non-JSON, network, refresh, pagination, false boolean, dan kontrak semua endpoint submit diperiksa dengan automated tests.
- Daftar akun vendor dan CORS dari origin localhost diperiksa langsung.
- Browser tool tidak menyediakan browser tersambung. Interaksi browser, responsive layout, dan pemeriksaan visual belum diverifikasi; build dan pengujian HTTP bukan pengganti pengujian visual.

Empat record TEST permanen dibuat dengan persetujuan pengguna, tanpa mengubah backend:

| Nomor | UUID | Hasil |
| --- | --- | --- |
| PBPD-2026-0001 | da8af11c-c25f-4ffb-99e1-9ae337e199fd | Completed; tanpa tiang/PDKB |
| PBPD-2026-0002 | bf263f72-c1aa-4a48-99d3-0f812d7680d1 | Completed; dengan tiang/PDKB |
| PBPD-2026-0003 | 0fde2376-f3bb-4e02-8a9e-a693e1408ad8 | Returned NPS |
| PBPD-2026-0004 | 7c983bfb-cf76-4939-8d10-57787cdbf555 | JTR, menunggu survei ULP Karang Pilang |

Jalankan `npm run test`, `npm run lint`, `npm run typecheck`, dan `npm run build`. Test otomatis tidak melakukan request ke backend nyata dan tidak membuat data TEST baru.

Hasil pemeriksaan akhir:

| Pemeriksaan | Hasil |
| --- | --- |
| `npm.cmd run test` | 35 test lulus |
| `npm.cmd run lint` | Lulus |
| `npm.cmd run typecheck` | Lulus |
| `npm.cmd run build` | Lulus, semua route berhasil dibangun |
| `git diff --check` | Lulus |
| HTTP development login/dashboard/create/detail | 200; login memuat props 15 akun development |
| Audit source dan output client production | Tidak ada password akun development; tidak ada runtime localStorage/demo tersisa di source |

Di Windows pengujian menggunakan `npm.cmd` karena execution policy PowerShell memblokir shim `npm.ps1`. Ini tidak memerlukan perubahan konfigurasi sistem. Build dev untuk smoke test dihentikan setelah pemeriksaan; jalankan kembali `npm run dev` untuk pengujian manual.
