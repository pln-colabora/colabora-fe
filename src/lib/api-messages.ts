// The API answers with terse English validation strings meant for developers.
// Translate them once, at the API layer, so every screen shows the same clear
// Indonesian text. Unknown messages fall back to a neutral sentence instead of
// leaking raw backend wording.

const fieldLabels: Record<string, string> = {
  daya_baru: "Daya baru",
  daya_lama: "Daya lama",
  golongan_tarif: "Golongan tarif",
  golongan_tarif_lama: "Golongan tarif lama",
  pembatas_lama: "Pembatas lama",
  tarif: "Tarif",
  jenis_permohonan: "Jenis permohonan",
  jenis_sambungan: "Jenis sambungan",
  ulp_unit: "Unit / ULP",
  nominal_pembayaran: "Nominal pembayaran",
  tanggal_pembayaran: "Tanggal pembayaran",
  surveyed_at: "Tanggal survei",
  estimasi_tanggal_selesai: "Estimasi tanggal selesai",
  tanggal_pdkb: "Tanggal kegiatan PDKB",
  notes: "Catatan",
  priority: "Prioritas",
  operation_result: "Hasil pengoperasian jaringan",
  energize_status: "Status penyalaan",
  nps_delegation_status: "Delegasi PK NPS",
  nomor_surat: "Nomor surat",
  pelanggan_nama: "Nama pelanggan",
  pelanggan_no_hp: "No. HP",
  pelanggan_alamat: "Lokasi",
  document_ids: "Evidence",
  email: "Email",
  password: "Kata sandi",
  name: "Nama",
  role: "Peran",
};

function label(field: string) {
  const key = field.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  return fieldLabels[key] ?? key.replaceAll("_", " ");
}

const exact: Record<string, string> = {
  "perubahan daya requires different daya_lama and daya_baru":
    "Daya baru harus berbeda dari daya lama untuk perubahan daya.",
  "daya_lama must be empty for pasang baru":
    "Daya lama tidak diisi untuk pasang baru.",
  "golongan_tarif_lama and pembatas_lama must be empty for pasang baru":
    "Golongan tarif lama dan pembatas lama tidak diisi untuk pasang baru.",
  "daya is not available for the selected tariff and connection type":
    "Daya yang dipilih tidak tersedia untuk tarif dan jenis sambungan ini.",
  "invalid tariff selection":
    "Pilihan tarif, golongan tarif, dan daya tidak valid.",
  "kombinasi tarif, golongan_tarif, dan daya_baru tidak tersedia di tabel tarif untuk jenis_sambungan ini":
    "Kombinasi tarif, golongan tarif, dan daya baru tidak tersedia untuk jenis sambungan ini.",
  "kombinasi golongan_tarif_lama dan daya_lama tidak tersedia di tabel tarif untuk jenis_sambungan ini":
    "Kombinasi golongan tarif lama dan daya lama tidak tersedia untuk jenis sambungan ini.",
  "caller cannot create this connection type":
    "Peran Anda tidak dapat membuat permohonan untuk jenis sambungan ini.",
  "invalid ulp_unit for this connection type":
    "Unit / ULP tidak sesuai dengan jenis sambungan ini.",
  "invalid PLG TM target ULP": "Unit / ULP tujuan PLG TM tidak valid.",
  "at least one evidence document is required":
    "Unggah minimal satu evidence.",
  "at least one evidence file is required": "Unggah minimal satu evidence.",
  "document_ids must contain unique UUIDs": "Evidence yang sama terpilih lebih dari sekali.",
  "document_ids must not contain duplicates": "Evidence yang sama terpilih lebih dari sekali.",
  "one or more documents are already attached or do not exist":
    "Sebagian evidence sudah terpakai atau tidak ditemukan. Unggah ulang berkasnya.",
  "one or more documents are already attached":
    "Sebagian evidence sudah terpakai. Unggah ulang berkasnya.",
  "one or more documents do not exist":
    "Sebagian evidence tidak ditemukan. Unggah ulang berkasnya.",
  "file exceeds max upload size": "Ukuran berkas melebihi batas 30 MB.",
  "file type not allowed":
    "Format berkas tidak didukung. Gunakan PDF, JPG, PNG, XLS, atau XLSX.",
  "invalid original filename": "Nama berkas tidak valid.",
  "malware detected": "Berkas terdeteksi mengandung malware dan ditolak.",
  "location_coordinates requires latitude and longitude":
    "Isi latitude dan longitude lokasi pemasangan.",
  "operation_result must not be blank":
    "Hasil pengoperasian jaringan wajib diisi.",
  "nps_delegation_status must be one of: delegated, returned":
    "Pilih keputusan delegasi PK NPS.",
  "user does not own this workflow node":
    "Aktivitas ini bukan tanggung jawab peran Anda.",
  "vendor cannot submit the other vendor node":
    "Aktivitas ini bukan tanggung jawab vendor Anda.",
  "energize waits for required PDKB documentation":
    "Energize menunggu dokumentasi PDKB selesai.",
  "pole installation is skipped when poles are not required":
    "Pemasangan tiang dilewati karena tiang tidak diperlukan.",
  "data sudah berubah; muat ulang sebelum menyimpan":
    "Data sudah diubah pengguna lain. Muat ulang halaman sebelum menyimpan.",
  "tanggal PDKB sudah terisi; pilih tanggal lain":
    "Tanggal PDKB sudah terisi. Pilih tanggal lain.",
  "booking WO tidak dapat diubah melalui kalender":
    "Jadwal dari WO tidak dapat diubah melalui kalender.",
  "invalid credentials": "Email atau kata sandi tidak cocok.",
  "invalid-email": "Format email tidak valid.",
  "account is not verified":
    "Akun belum diverifikasi. Hubungi pengelola akun.",
  "account already verified": "Akun sudah diverifikasi.",
  "email already exist": "Email sudah terdaftar.",
  "email not found": "Email tidak terdaftar.",
  "verification document is required": "Dokumen verifikasi wajib diunggah.",
  "password reset token invalid":
    "Tautan atur ulang kata sandi tidak valid atau sudah kedaluwarsa.",
  "token expired": "Sesi berakhir. Silakan masuk kembali.",
  "token invalid": "Sesi tidak valid. Silakan masuk kembali.",
  "token not found": "Sesi berakhir. Silakan masuk kembali.",
  "token not valid": "Sesi tidak valid. Silakan masuk kembali.",
  "refresh token expired": "Sesi berakhir. Silakan masuk kembali.",
  "refresh token not found": "Sesi berakhir. Silakan masuk kembali.",
  "denied access": "Anda tidak memiliki izin untuk tindakan ini.",
  "vendor role already assigned": "Vendor untuk peran ini sudah ditugaskan.",
  "permohonan not found": "Permohonan tidak ditemukan.",
  "workflow node not found": "Aktivitas tidak ditemukan.",
  "document not found": "Dokumen tidak ditemukan.",
  "user not found": "Akun tidak ditemukan.",
  "invalid workflow activity payload": "Data aktivitas tidak valid.",
};

const patterns: Array<[RegExp, (...groups: string[]) => string]> = [
  [/^(\w+) is required when (\w+) is set$/, (a, b) => `${label(a)} wajib diisi jika ${label(b).toLowerCase()} dipilih.`],
  [/^(\w+) is required$/, (a) => `${label(a)} wajib diisi.`],
  [/^(\w+) must be greater than zero$/, (a) => `${label(a)} harus lebih dari 0.`],
  [/^(\w+) must use YYYY-MM-DD format$/, (a) => `${label(a)} tidak valid.`],
  [/^(\w+) must be at most (\d+) characters$/, (a, n) => `${label(a)} maksimal ${n} karakter.`],
  [/^priority (?:is required and )?must be one of:.*$/, () => "Pilih prioritas: High, Medium, atau Low."],
  [/^(\w+) must be one of: .*$/, (a) => `Pilihan ${label(a).toLowerCase()} tidak valid.`],
  [/^location_coordinates\.(latitude|longitude) must be between .*$/, (a) => `${a === "latitude" ? "Latitude" : "Longitude"} di luar rentang yang valid.`],
  // gin/validator binding errors, e.g.
  // Key: 'CreateRequest.DayaBaru' Error:Field validation for 'DayaBaru' failed on the 'required' tag
  [/Field validation for '(\w+)' failed on the 'required' tag/, (a) => `${label(a)} wajib diisi.`],
  [/Field validation for '(\w+)' failed on the '(\w+)' tag/, (a) => `${label(a)} tidak valid.`],
];

function translateOne(raw: string): string | null {
  const message = raw.trim();
  if (!message) return null;
  if (exact[message]) return exact[message];
  for (const [pattern, build] of patterns) {
    const match = pattern.exec(message);
    if (match) return build(...match.slice(1));
  }
  return null;
}

export function translateApiMessage(raw: string, status: number) {
  const parts = raw
    .split(/;\s*|\n/)
    .map(translateOne)
    .filter((part): part is string => Boolean(part));
  if (parts.length) return [...new Set(parts)].join(" ");
  // Keep text that is already user-facing Indonesian (sentences produced by the
  // FE itself or by newer API versions); hide raw technical English otherwise.
  if (/\b(tidak|wajib|silakan|gagal|harus|sudah|belum)\b/i.test(raw)) return raw;
  return status >= 500
    ? "Layanan COLABORA sedang bermasalah. Coba lagi beberapa saat."
    : "Permintaan tidak dapat diproses. Periksa kembali data yang diisi lalu coba lagi.";
}
