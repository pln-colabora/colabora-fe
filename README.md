# COLABORA

Ruang kerja permohonan PB/PD terintegrasi API untuk lingkungan PLN, menggunakan Next.js App Router, React, TypeScript, dan Tailwind CSS.

## Menjalankan proyek

```sh
npm ci
# Salin .env.example ke .env.local dan isi konfigurasi lokal.
npm run dev
```

Buka http://localhost:3000 dan masuk memakai akun backend. Untuk dropdown akun development, isi `COLABORA_DEV_ACCOUNTS` di `.env.local` dengan JSON akun yang diberikan (jangan commit password). Dropdown hanya mengisi kredensial; tombol Masuk tetap memanggil API. Konfigurasi tersebut tidak ditampilkan pada build production.

## Pemeriksaan

```sh
npm run test
npm run lint
npm run typecheck
npm run build
```

Lint hanya memeriksa sumber, tanpa mengubah file. Untuk memformat perubahan tertentu, jalankan `npx prettier --write <file>`; hindari memformat seluruh repositori untuk perubahan kecil.

## Struktur dan batas perubahan

- `src/app/dashboard/page.tsx`: Beranda, ringkasan, permohonan terbaru, pencarian, dan filter daftar. `/dashboard?view=all` membuka semua permohonan; `?view=mine` membuka tugas peran aktif.
- `src/app/permohonan/[id]/page.tsx`: detail, tindakan, formulir aktivitas, dokumen, dan riwayat permohonan.
- `src/components/dashboard/`: shell navigasi dan tampilan status bersama. Tambahkan tujuan navigasi melalui daftar `destinations` agar desktop dan seluler tetap selaras.
- `src/components/ui/`: primitif antarmuka yang sudah tersedia.
- `src/lib/workflow.ts`: metadata presentasi tahap, label, PIC, dan field form.
- `src/lib/api.ts`, `src/lib/auth.ts`, `src/lib/applications.ts`: klien Axios, session backend, endpoint, serta mapping API/UI.
- `src/hooks`: state dan lifecycle data React untuk session, dashboard, dan detail permohonan.
- Form memakai React Hook Form, schema Zod, primitive shadcn, dan toast untuk hasil aksi pengguna.
- `src/components/dashboard/action-form.tsx`: form aktivitas bersama untuk detail dan survei; upload multipart dan submit memakai available action backend.
- `src/styles/globals.css`: token warna, tipografi, fokus keyboard, dan reduced motion. Gunakan token semantik untuk status, termasuk tema gelap.

Baca [AGENTS.md](AGENTS.md) dan [DESIGN.MD](DESIGN.MD) sebelum mengubah UI. Pertahankan aturan bisnis dan jalur tindakan yang benar; gunakan komponen bersama untuk tampilan yang memang berulang.

## Integrasi backend

Lihat [API-INTEGRATION.md](API-INTEGRATION.md) untuk mapping seluruh endpoint/action, perbedaan field, aturan session, hasil verifikasi, dan batas pengujian.

Backend menjadi sumber data, status node, SLA, dan izin tindakan. Dashboard mengambil list paginated; detail memuat permohonan, dokumen, dan log. Tidak ada seed atau penyimpanan workflow di localStorage. Access/refresh token berada di sessionStorage; role dan unit dimuat dari profil server.

Form pembuatan mengikuti schema API: daya, ID pelanggan, catatan, dan evidence awal tidak dikirim karena tidak diterima endpoint create. Unit JTR/JTM berasal dari akun backend. Evidence aktivitas diunggah sebagai file asli, lalu document ID diikat oleh submit. Server menentukan transisi dan branching, termasuk aktivitas paralel.

Pemilih evidence mendukung drag-and-drop, validasi format/ukuran, progres upload, dan penghapusan sebelum submit. Evidence yang sudah terikat dapat dibuka di tab browser atau diunduh dari halaman detail.

Tests memakai Node test runner tanpa dependency tambahan dan tidak menulis data ke backend. Empat permohonan TEST untuk pemeriksaan live telah dibuat dengan izin pengguna; daftar ID dan hasilnya ada di dokumen integrasi.

## Pemeriksaan UI manual

Periksa Beranda, daftar, detail, dan formulir pada lebar 1440, 1280, 1024, 768, 430, 390, dan 360 px, serta tema terang/gelap. Pastikan navigasi keyboard, fokus, menu aktif, filter/reset, keadaan kosong, pemuatan, dan kegagalan penyimpanan dapat dipahami. Tabel desktop dapat digulir horizontal; seluler memakai daftar ringkas dan navigasi bawah.

## Asal proyek

Fondasi proyek berasal dari Mainline oleh shadcnblocks.com. Ketentuan lisensi tetap tersedia di [LICENSE](LICENSE).

## Palet dan tata letak desktop

Warna UI memakai keluarga biru pada [logo PLN](https://commons.wikimedia.org/wiki/File:Logo_PLN.png), serta arah warna yang didokumentasikan dalam [laporan PLN IP Services, halaman 91](https://www.plnipservices.co.id/document/12/download). Biru tua dipakai untuk tindakan utama, cyan untuk aksen pendukung, dan biru sangat muda untuk permukaan terpilih. Kuning disimpan sebagai token logo tetapi tidak dipakai sebagai aksen antarmuka. Merah, hijau, dan amber hanya menyampaikan status semantik. Nilai sRGB di `globals.css` merupakan adaptasi untuk layar; warna tombol dan teks diperkuat kontrasnya. Token utama tombol terang memiliki kontras 5,81:1 dengan teks putih.

Beranda memakai tabel ringkas mulai lebar 1024 px dan daftar terstruktur di bawahnya. Sidebar putih selebar 232 px tampil mulai lebar 1024 px, memakai menu aktif biru dan konteks akun di bawah; konten memakai ruang yang tersisa dengan batas 1440 px. Tablet dan seluler menggunakan navigasi bawah. Identitas akun backend berada pada disclosure di header; filter daftar berada pada baris tersendiri.

Halaman login memakai dua kolom pada desktop: ilustrasi memenuhi panel konteks kiri sebagai background, sementara formulir berada di kanan tanpa container dekoratif tambahan. Panel ilustrasi disembunyikan di bawah 1024 px. Aset WebP sekitar 124 KiB digunakan untuk halaman; sumber PNG dan prompt tersedia di [public/illustrations](public/illustrations). Kontrol form menggunakan komponen shadcn bersama dari `src/components/ui/`.
