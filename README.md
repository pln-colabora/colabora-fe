# COLABORA

Ruang kerja demo permohonan PB/PD untuk lingkungan PLN, menggunakan Next.js App Router, React, TypeScript, dan Tailwind CSS.

## Menjalankan proyek

```sh
npm ci
npm run dev
```

Buka http://localhost:3000. Pilih peran di halaman masuk untuk mencoba pekerjaan masing-masing PIC.

## Pemeriksaan

```sh
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
- `src/lib/workflow.ts`: sumber data demo, pemilik aktivitas, percabangan, status, dokumen, serta penyimpanan perubahan. Aturan bisnis tetap berada di sini.
- `src/styles/globals.css`: token warna, tipografi, fokus keyboard, dan reduced motion. Gunakan token semantik untuk status, termasuk tema gelap.

Baca [AGENTS.md](AGENTS.md) dan [DESIGN.MD](DESIGN.MD) sebelum mengubah UI. Pertahankan aturan bisnis dan jalur tindakan yang benar; gunakan komponen bersama untuk tampilan yang memang berulang.

## Batas demo

Aplikasi belum terhubung ke backend atau autentikasi produksi. Pemilihan peran dan email/kata sandi pada layar masuk merupakan simulasi. Jangan gunakan kredensial atau data pelanggan nyata.

Perubahan aktivitas disimpan di localStorage browser, bukan dibagikan ke pengguna lain. Reset demo menghapus perubahan lokal setelah konfirmasi. Dokumen unggahan hanya menyimpan nama berkas, bukan isi berkas.

Belum tersedia alur membuat permohonan baru, identitas pengguna pribadi, maupun aset resmi PLN. Beranda mengarahkan pengguna ke tugas yang sudah didukung. Jangan menambahkan tombol pembuatan tanpa alur yang bekerja atau menggambar ulang logo PLN.

Data SLA berasal dari data demo. Jangan menyajikannya sebagai pengukuran langsung atau mengubah perhitungannya melalui komponen visual.

## Pemeriksaan UI manual

Periksa Beranda, daftar, detail, dan formulir pada lebar 1440, 1280, 1024, 768, 430, 390, dan 360 px, serta tema terang/gelap. Pastikan navigasi keyboard, fokus, menu aktif, filter/reset, keadaan kosong, pemuatan, dan kegagalan penyimpanan dapat dipahami. Tabel desktop dapat digulir horizontal; seluler memakai daftar ringkas dan navigasi bawah.

## Asal proyek

Fondasi proyek berasal dari Mainline oleh shadcnblocks.com. Ketentuan lisensi tetap tersedia di [LICENSE](LICENSE).

## Palet dan tata letak desktop

Warna UI memakai keluarga biru pada [logo PLN](https://commons.wikimedia.org/wiki/File:Logo_PLN.png), serta arah warna yang didokumentasikan dalam [laporan PLN IP Services, halaman 91](https://www.plnipservices.co.id/document/12/download). Biru tua dipakai untuk tindakan utama, cyan untuk aksen pendukung, dan biru sangat muda untuk permukaan terpilih. Kuning disimpan sebagai token logo tetapi tidak dipakai sebagai aksen antarmuka. Merah, hijau, dan amber hanya menyampaikan status semantik. Nilai sRGB di `globals.css` merupakan adaptasi untuk layar; warna tombol dan teks diperkuat kontrasnya. Token utama tombol terang memiliki kontras 5,81:1 dengan teks putih.

Beranda memakai tabel ringkas mulai lebar 1024 px dan daftar terstruktur di bawahnya. Sidebar putih selebar 232 px tampil mulai lebar 1024 px, memakai menu aktif biru dan konteks akun di bawah; konten memakai ruang yang tersisa dengan batas 1440 px. Tablet dan seluler menggunakan navigasi bawah. Kontrol peran demo berada pada disclosure di header; filter daftar berada pada baris tersendiri.

Halaman login memakai dua kolom pada desktop: ilustrasi memenuhi panel konteks kiri sebagai background, sementara formulir berada di kanan tanpa container dekoratif tambahan. Panel ilustrasi disembunyikan di bawah 1024 px. Aset WebP sekitar 124 KiB digunakan untuk halaman; sumber PNG dan prompt tersedia di [public/illustrations](public/illustrations). Kontrol form menggunakan komponen shadcn bersama dari `src/components/ui/`.
