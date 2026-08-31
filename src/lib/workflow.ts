export const ROLE_STORAGE_KEY = "colabora_demo_role";
export const WORKFLOW_STORAGE_KEY = "colabora_workflow_state_v1";

export type RoleId =
  | "pelayanan"
  | "teknik"
  | "nps"
  | "perencanaan"
  | "konstruksi"
  | "transaksi"
  | "jaringan"
  | "pdkb"
  | "vendor-tiang"
  | "vendor-konstruksi"
  | "vendor-app"
  | "super-user";

export type ActionId =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "7b"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "12b"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17";

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ConnectionType =
  | "JTR"
  | "JTM / Gardu"
  | "PLG TM <5 GWNG"
  | "PLG TM >5 GWNG";

export type WorkflowDecisions = {
  needsPole?: boolean;
  needsPdkb?: boolean;
  npsApproved?: boolean;
};

export type ApplicationSeed = {
  id: string;
  customerId: string;
  customer: string;
  requestType: "Pasang baru" | "Perubahan daya";
  connectionType: ConnectionType;
  unit: string;
  location: string;
  power: string;
  requestedAt: string;
  currentAction: ActionId | null;
  decisions: WorkflowDecisions;
  rejected?: boolean;
  sla: { tone: "safe" | "due" | "late" | "done"; label: string };
  updatedAt: string;
};

export type ApplicationOverride = {
  currentAction?: ActionId | null;
  decisions?: WorkflowDecisions;
  rejected?: boolean;
  completed?: boolean;
  updatedAt?: string;
  history?: HistoryItem[];
  documents?: DocumentItem[];
};

export type HistoryItem = {
  id: string;
  at: string;
  title: string;
  by: string;
};

export type DocumentItem = {
  id: string;
  name: string;
  actionId: ActionId;
  addedAt: string;
};

export type Application = ApplicationSeed & ApplicationOverride;

export type FieldDefinition = {
  name: string;
  label: string;
  type?: "text" | "date" | "textarea" | "select" | "number";
  placeholder?: string;
  options?: string[];
};

export type ActivityDefinition = {
  id: ActionId;
  stage: StageId;
  label: string;
  shortLabel: string;
  description: string;
  owner: RoleId | ((application: ApplicationSeed) => RoleId);
  fields: FieldDefinition[];
  evidence?: string;
};

export const roles: Array<{
  id: RoleId;
  label: string;
  lane: string;
  initials: string;
}> = [
  { id: "teknik", label: "Bagian Teknik", lane: "ULP", initials: "BT" },
  {
    id: "pelayanan",
    label: "Pelayanan Pelanggan",
    lane: "ULP",
    initials: "PP",
  },
  { id: "nps", label: "NPS", lane: "UP3", initials: "NP" },
  {
    id: "perencanaan",
    label: "Bagian Perencanaan",
    lane: "UP3",
    initials: "PR",
  },
  { id: "konstruksi", label: "Bagian Konstruksi", lane: "UP3", initials: "KS" },
  { id: "transaksi", label: "Transaksi Energi", lane: "UP3", initials: "TE" },
  { id: "jaringan", label: "Bagian Jaringan", lane: "UP3", initials: "JR" },
  { id: "pdkb", label: "Tim PDKB", lane: "UP3", initials: "PD" },
  { id: "vendor-tiang", label: "Vendor Tiang", lane: "Vendor", initials: "VT" },
  {
    id: "vendor-konstruksi",
    label: "Vendor Konstruksi",
    lane: "Vendor",
    initials: "VK",
  },
  { id: "vendor-app", label: "Vendor SR/APP", lane: "Vendor", initials: "VA" },
  {
    id: "super-user",
    label: "Super User / Monitoring",
    lane: "Management",
    initials: "SU",
  },
];

export const stages: Array<{ id: StageId; label: string; shortLabel: string }> =
  [
    { id: 1, label: "Permohonan PB/PD", shortLabel: "Permohonan" },
    { id: 2, label: "Survei Perluasan Jaringan", shortLabel: "Survei" },
    { id: 3, label: "Perencanaan Perluasan", shortLabel: "Perencanaan" },
    {
      id: 4,
      label: "Pra Pelaksanaan Konstruksi",
      shortLabel: "Pra konstruksi",
    },
    { id: 5, label: "Pelaksanaan Konstruksi", shortLabel: "Konstruksi" },
    { id: 6, label: "Energize Jaringan", shortLabel: "Energize" },
    { id: 7, label: "Penutupan / Selesai", shortLabel: "Penutupan" },
  ];

const planningOwner = (): RoleId => "perencanaan";

const energizeOwner = (): RoleId => "jaringan";

const appVendorOwner = (): RoleId => "vendor-app";

export const activities: ActivityDefinition[] = [
  {
    id: "1",
    stage: 1,
    label: "Permohonan PB/PD",
    shortLabel: "Permohonan PB/PD",
    description:
      "Catat data pelanggan, kebutuhan daya, lokasi, dan evidence awal permohonan.",
    owner: "pelayanan",
    fields: [
      {
        name: "customer",
        label: "Nama pelanggan",
        placeholder: "Nama pelanggan",
      },
      { name: "phone", label: "No. HP / telepon", placeholder: "08xxxxxxxxxx" },
      {
        name: "notes",
        label: "Catatan permohonan",
        type: "textarea",
        placeholder: "Catatan operasional",
      },
    ],
    evidence: "Evidence permohonan",
  },
  {
    id: "2",
    stage: 2,
    label: "Survei Perluasan Jaringan",
    shortLabel: "Survei",
    description:
      "Lengkapi hasil pemeriksaan lapangan sebelum pekerjaan direncanakan.",
    owner: "teknik",
    fields: [
      { name: "surveyDate", label: "Tanggal survei", type: "date" },
      { name: "officer", label: "Petugas survei", placeholder: "Nama petugas" },
      {
        name: "coordinates",
        label: "Titik koordinat GPS",
        placeholder: "-7.2575, 112.7521",
      },
      {
        name: "condition",
        label: "Kondisi jaringan eksisting",
        type: "select",
        options: [
          "Layak diperluas",
          "Perlu penguatan",
          "Perlu kajian lanjutan",
        ],
      },
      {
        name: "notes",
        label: "Catatan hasil survei",
        type: "textarea",
        placeholder: "Kondisi lapangan dan rekomendasi",
      },
    ],
    evidence: "Evidence hasil survei",
  },
  {
    id: "3",
    stage: 3,
    label: "RAB, KKO & KKF",
    shortLabel: "RAB, KKO & KKF",
    description:
      "Susun perencanaan teknis dan tentukan apakah pemasangan tiang diperlukan.",
    owner: planningOwner,
    fields: [
      {
        name: "estimate",
        label: "Estimasi pekerjaan",
        type: "textarea",
        placeholder: "Ringkasan estimasi pekerjaan",
      },
      {
        name: "rab",
        label: "Nilai RAB (Rp)",
        type: "number",
        placeholder: "0",
      },
      {
        name: "technicalNotes",
        label: "Catatan teknis",
        type: "textarea",
        placeholder: "Dasar perhitungan dan catatan teknis",
      },
      {
        name: "needsPole",
        label: "Kebutuhan tiang",
        type: "select",
        options: ["Ya", "Tidak"],
      },
    ],
    evidence: "Dokumen RAB, KKO & KKF",
  },
  {
    id: "4",
    stage: 3,
    label: "Permohonan Perluasan",
    shortLabel: "Permohonan perluasan",
    description:
      "Siapkan PK pekerjaan dan bukti pembayaran pelanggan untuk proses NPS.",
    owner: "nps",
    fields: [
      {
        name: "cost",
        label: "Perkiraan biaya penyambungan (Rp)",
        type: "number",
        placeholder: "0",
      },
      {
        name: "length",
        label: "Panjang jaringan diperlukan (m)",
        type: "number",
        placeholder: "0",
      },
      {
        name: "workOrder",
        label: "Nomor PK pekerjaan",
        placeholder: "PK/UP3/2026/...",
      },
      {
        name: "targetDivision",
        label: "Bagian tujuan PK",
        type: "select",
        options: ["Perencanaan", "Konstruksi", "Transaksi Energi"],
      },
    ],
    evidence: "Bukti pembayaran pelanggan",
  },
  {
    id: "5",
    stage: 3,
    label: "Persetujuan / Delegasi NPS",
    shortLabel: "Persetujuan NPS",
    description:
      "Tinjau hasil perencanaan. Penolakan akan menghentikan workflow permohonan.",
    owner: "nps",
    fields: [
      {
        name: "npsDecision",
        label: "Keputusan NPS",
        type: "select",
        options: ["Disetujui", "Ditolak"],
      },
      {
        name: "notes",
        label: "Catatan keputusan",
        type: "textarea",
        placeholder: "Alasan atau arahan tindak lanjut",
      },
    ],
    evidence: "Nota persetujuan sambungan",
  },
  {
    id: "6",
    stage: 4,
    label: "WO Vendor Tiang",
    shortLabel: "WO Vendor Tiang",
    description:
      "Terbitkan work order pemasangan tiang sesuai hasil perencanaan.",
    owner: "perencanaan",
    fields: woFields("Tiang"),
    evidence: "Dokumen WO Vendor Tiang",
  },
  {
    id: "7",
    stage: 4,
    label: "WO Vendor Konstruksi",
    shortLabel: "WO Vendor Konstruksi",
    description:
      "Terbitkan WO konstruksi dan tentukan kebutuhan dukungan PDKB.",
    owner: "konstruksi",
    fields: [
      ...woFields("Konstruksi"),
      {
        name: "needsPdkb",
        label: "Perlu PDKB",
        type: "select",
        options: ["Ya", "Tidak"],
      },
    ],
    evidence: "Dokumen WO Vendor Konstruksi",
  },
  {
    id: "7b",
    stage: 4,
    label: "WO PDKB",
    shortLabel: "WO PDKB",
    description: "Terbitkan penugasan Tim PDKB sebelum konstruksi dimulai.",
    owner: "konstruksi",
    fields: [
      {
        name: "woNumber",
        label: "Nomor WO PDKB",
        placeholder: "WO-PDKB/UP3/2026/...",
      },
      {
        name: "team",
        label: "Tim PDKB yang ditugaskan",
        placeholder: "Tim PDKB",
      },
      { name: "target", label: "Target selesai", type: "date" },
      { name: "scope", label: "Lingkup pekerjaan PDKB", type: "textarea" },
    ],
    evidence: "Dokumen WO PDKB",
  },
  {
    id: "8",
    stage: 4,
    label: "WO Vendor APP",
    shortLabel: "WO Vendor APP",
    description: "Terbitkan work order penyediaan dan pemasangan APP.",
    owner: "transaksi",
    fields: woFields("APP"),
    evidence: "Dokumen WO Vendor APP",
  },
  {
    id: "9",
    stage: 4,
    label: "Reservasi Material",
    shortLabel: "Reservasi material",
    description:
      "Pastikan material utama tersedia dan telah dipesan dari gudang.",
    owner: "transaksi",
    fields: [
      {
        name: "material",
        label: "Material utama",
        placeholder: "Nama material",
      },
      { name: "quantity", label: "Jumlah", type: "number", placeholder: "0" },
      { name: "warehouse", label: "Gudang", placeholder: "Gudang asal" },
      {
        name: "availability",
        label: "Status ketersediaan",
        type: "select",
        options: ["Tersedia", "Tersedia sebagian", "Menunggu pengadaan"],
      },
      { name: "reservedAt", label: "Tanggal reservasi", type: "date" },
    ],
    evidence: "Bukti reservasi material",
  },
  {
    id: "10",
    stage: 4,
    label: "Perakitan & Tera APP",
    shortLabel: "Perakitan & Tera APP",
    description: "Catat identitas APP serta hasil perakitan dan tera.",
    owner: "transaksi",
    fields: [
      {
        name: "appNumber",
        label: "Nomor seri APP",
        placeholder: "Nomor APP / kWh meter",
      },
      { name: "appType", label: "Tipe APP", placeholder: "Tipe perangkat" },
      {
        name: "assembly",
        label: "Status perakitan",
        type: "select",
        options: ["Selesai", "Perlu perbaikan"],
      },
      {
        name: "calibration",
        label: "Status tera",
        type: "select",
        options: ["Lulus", "Tidak lulus"],
      },
      { name: "date", label: "Tanggal tera", type: "date" },
    ],
    evidence: "BA Tera APP",
  },
  {
    id: "11",
    stage: 5,
    label: "Pemasangan Tiang",
    shortLabel: "Pemasangan tiang",
    description:
      "Dokumentasikan pemasangan tiang dari kondisi awal hingga selesai.",
    owner: "vendor-tiang",
    fields: [
      { name: "wo", label: "Nomor WO", placeholder: "WO-TIANG/..." },
      {
        name: "poleCount",
        label: "Jumlah tiang",
        type: "number",
        placeholder: "0",
      },
      { name: "startDate", label: "Tanggal mulai", type: "date" },
      { name: "endDate", label: "Tanggal selesai", type: "date" },
      {
        name: "progress",
        label: "Progress",
        type: "select",
        options: ["100% — Selesai", "Tertunda — Perlu tindak lanjut"],
      },
    ],
    evidence: "Foto sebelum, pekerjaan & setelah",
  },
  {
    id: "12",
    stage: 5,
    label: "Pelaksanaan Konstruksi",
    shortLabel: "Pelaksanaan konstruksi",
    description:
      "Laporkan realisasi scope, waktu, kendala, dan dokumentasi konstruksi.",
    owner: "vendor-konstruksi",
    fields: [
      { name: "wo", label: "Nomor WO", placeholder: "WO-KONSTRUKSI/..." },
      { name: "scope", label: "Realisasi scope pekerjaan", type: "textarea" },
      { name: "startDate", label: "Tanggal mulai", type: "date" },
      { name: "endDate", label: "Tanggal selesai", type: "date" },
      {
        name: "obstacle",
        label: "Kendala",
        type: "textarea",
        placeholder: "Tidak ada / jelaskan kendala",
      },
    ],
    evidence: "Dokumentasi konstruksi",
  },
  {
    id: "12b",
    stage: 5,
    label: "Dokumentasi PDKB",
    shortLabel: "Dokumentasi PDKB",
    description: "Lengkapi dokumentasi pendampingan PDKB dan BAPL.",
    owner: "pdkb",
    fields: [
      { name: "team", label: "Tim PDKB", placeholder: "Nama tim" },
      { name: "workDate", label: "Tanggal pekerjaan", type: "date" },
      { name: "notes", label: "Catatan pelaksanaan", type: "textarea" },
    ],
    evidence: "Foto PDKB & BAPL",
  },
  {
    id: "13",
    stage: 6,
    label: "Pengoperasian Jaringan Listrik",
    shortLabel: "Pengoperasian jaringan",
    description: "Catat pengujian dan hasil pengoperasian jaringan listrik.",
    owner: energizeOwner,
    fields: [
      { name: "operationDate", label: "Tanggal pengoperasian", type: "date" },
      { name: "officer", label: "Petugas", placeholder: "Nama petugas / tim" },
      {
        name: "testResult",
        label: "Hasil pengujian",
        type: "select",
        options: ["Lulus dan siap dioperasikan", "Perlu perbaikan"],
      },
      {
        name: "dcTest",
        label: "DC Test",
        type: "select",
        options: ["Tidak diperlukan", "Lulus", "Tidak lulus"],
      },
      { name: "notes", label: "Catatan", type: "textarea" },
    ],
    evidence: "BA Pengujian & dokumentasi",
  },
  {
    id: "14",
    stage: 6,
    label: "Pemasangan SR/APP & Penyalaan",
    shortLabel: "Pemasangan SR/APP",
    description:
      "Lengkapi identitas meter, hasil pemasangan, dan status penyalaan.",
    owner: appVendorOwner,
    fields: [
      { name: "meter", label: "Nomor meter", placeholder: "Nomor meter" },
      { name: "vendor", label: "Vendor", placeholder: "Nama vendor" },
      { name: "installDate", label: "Tanggal pemasangan", type: "date" },
      {
        name: "installStatus",
        label: "Status pemasangan",
        type: "select",
        options: ["Selesai", "Perlu perbaikan"],
      },
      {
        name: "energizeStatus",
        label: "Status penyalaan",
        type: "select",
        options: ["Menyala", "Belum menyala"],
      },
    ],
    evidence: "BA Penyalaan & dokumentasi",
  },
  {
    id: "15",
    stage: 7,
    label: "Entri & Mutasi PDL",
    shortLabel: "Entri & Mutasi PDL",
    description: "Catat nomor PDL dan hasil mutasi pelanggan.",
    owner: "pelayanan",
    fields: [
      {
        name: "pdlNumber",
        label: "Nomor PDL",
        placeholder: "PDL/ULP/2026/...",
      },
      { name: "entryDate", label: "Tanggal entri", type: "date" },
      {
        name: "mutationStatus",
        label: "Status mutasi",
        type: "select",
        options: ["Berhasil", "Perlu koreksi"],
      },
    ],
    evidence: "Bukti mutasi PDL",
  },
  {
    id: "16",
    stage: 7,
    label: "Arsip AIL / Updating DIJ",
    shortLabel: "Arsip AIL / DIJ",
    description: "Lengkapi nomor AIL dan pembaruan data induk jaringan.",
    owner: "pelayanan",
    fields: [
      {
        name: "ailNumber",
        label: "Nomor AIL",
        placeholder: "AIL/ULP/2026/...",
      },
      { name: "dijDate", label: "Tanggal update DIJ", type: "date" },
      { name: "notes", label: "Catatan arsip", type: "textarea" },
    ],
    evidence: "Arsip AIL & dokumen akhir",
  },
  {
    id: "17",
    stage: 7,
    label: "Selesai",
    shortLabel: "Selesai",
    description:
      "Konfirmasi seluruh dokumen akhir lengkap dan tutup permohonan.",
    owner: "pelayanan",
    fields: [
      { name: "completionDate", label: "Tanggal selesai", type: "date" },
      {
        name: "confirmation",
        label: "Konfirmasi penutupan",
        type: "select",
        options: ["Seluruh data dan dokumen lengkap"],
      },
      { name: "notes", label: "Catatan penutupan", type: "textarea" },
    ],
    evidence: "Dokumen penutupan",
  },
];

function woFields(kind: string): FieldDefinition[] {
  return [
    {
      name: "woNumber",
      label: "Nomor WO",
      placeholder: `WO-${kind.toUpperCase()}/UP3/2026/...`,
    },
    { name: "vendor", label: "Vendor", placeholder: `Vendor ${kind}` },
    { name: "issuedAt", label: "Tanggal diterbitkan", type: "date" },
    { name: "target", label: "Target pekerjaan", type: "date" },
    {
      name: "scope",
      label: "Scope pekerjaan",
      type: "textarea",
      placeholder: "Lingkup pekerjaan yang ditugaskan",
    },
  ];
}

export const applicationSeeds: ApplicationSeed[] = [
  seed(
    "0156",
    "Siti Marlina",
    "JTR",
    "ULP Taman",
    "2",
    {},
    "safe",
    "2 hari tersisa",
    "29 Agu 2026, 14:32",
  ),
  seed(
    "0155",
    "Bengkel Sumber Jaya",
    "JTM / Gardu",
    "ULP Menganti",
    "12",
    { needsPole: false, npsApproved: true, needsPdkb: false },
    "late",
    "Terlambat 1 hari",
    "29 Agu 2026, 11:08",
  ),
  seed(
    "0154",
    "PT Cipta Pangan",
    "PLG TM <5 GWNG",
    "ULP Karang Pilang",
    "3",
    {},
    "due",
    "Berakhir hari ini",
    "28 Agu 2026, 16:45",
  ),
  seed(
    "0153",
    "Rudi Hartono",
    "JTR",
    "ULP Taman",
    "3",
    {},
    "safe",
    "3 hari tersisa",
    "28 Agu 2026, 10:20",
  ),
  seed(
    "0152",
    "CV Lintas Karya",
    "PLG TM >5 GWNG",
    "ULP Menganti",
    "5",
    { needsPole: true },
    "due",
    "1 hari tersisa",
    "27 Agu 2026, 15:17",
  ),
  seed(
    "0151",
    "Masjid Al-Ikhlas",
    "JTR",
    "ULP Karang Pilang",
    "7",
    { needsPole: false, npsApproved: true },
    "safe",
    "2 hari tersisa",
    "27 Agu 2026, 09:40",
  ),
  seed(
    "0150",
    "PT Prima Logistik",
    "PLG TM <5 GWNG",
    "ULP Taman",
    "6",
    { needsPole: true, npsApproved: true },
    "late",
    "Terlambat 2 hari",
    "26 Agu 2026, 13:55",
  ),
  seed(
    "0149",
    "Koperasi Maju Bersama",
    "JTR",
    "ULP Menganti",
    "9",
    { needsPole: false, npsApproved: true, needsPdkb: false },
    "safe",
    "4 hari tersisa",
    "26 Agu 2026, 08:31",
  ),
  seed(
    "0148",
    "Gudang Sejahtera",
    "PLG TM >5 GWNG",
    "ULP Karang Pilang",
    "11",
    { needsPole: true, npsApproved: true, needsPdkb: false },
    "due",
    "1 hari tersisa",
    "25 Agu 2026, 17:10",
  ),
  seed(
    "0147",
    "Klinik Medika Utama",
    "JTR",
    "ULP Taman",
    "12b",
    { needsPole: false, npsApproved: true, needsPdkb: true },
    "safe",
    "3 hari tersisa",
    "25 Agu 2026, 12:04",
  ),
  seed(
    "0146",
    "PT Sentosa Kimia",
    "PLG TM <5 GWNG",
    "ULP Menganti",
    "13",
    { needsPole: true, npsApproved: true, needsPdkb: true },
    "due",
    "Berakhir hari ini",
    "24 Agu 2026, 16:22",
  ),
  seed(
    "0145",
    "Perumahan Taman Asri",
    "JTR",
    "ULP Karang Pilang",
    "14",
    { needsPole: false, npsApproved: true, needsPdkb: false },
    "late",
    "Terlambat 1 hari",
    "24 Agu 2026, 09:18",
  ),
  seed(
    "0144",
    "Toko Berkah Abadi",
    "JTR",
    "ULP Taman",
    "15",
    { needsPole: false, npsApproved: true, needsPdkb: false },
    "safe",
    "2 hari tersisa",
    "23 Agu 2026, 14:01",
  ),
  {
    ...seed(
      "0143",
      "PT Surya Nusantara",
      "PLG TM <5 GWNG",
      "ULP Menganti",
      null,
      { needsPole: true, npsApproved: true, needsPdkb: false },
      "done",
      "Selesai",
      "22 Agu 2026, 10:45",
    ),
    requestedAt: "2026-08-06",
  },
  {
    ...seed(
      "0142",
      "Dewi Anggraini",
      "JTM / Gardu",
      "ULP Karang Pilang",
      "5",
      { needsPole: true, npsApproved: false },
      "done",
      "Proses dihentikan",
      "21 Agu 2026, 13:12",
    ),
    rejected: true,
  },
];

function seed(
  suffix: string,
  customer: string,
  connectionType: ConnectionType,
  unit: string,
  currentAction: ActionId | null,
  decisions: WorkflowDecisions,
  tone: ApplicationSeed["sla"]["tone"],
  slaLabel: string,
  updatedAt: string,
): ApplicationSeed {
  const numeric = Number(suffix);
  return {
    id: `PBPD-2026-${suffix}`,
    customerId: `53${String(numeric).padStart(10, "0")}`,
    customer,
    requestType: numeric % 3 === 0 ? "Perubahan daya" : "Pasang baru",
    connectionType,
    unit,
    location: `${numeric % 2 === 0 ? "Jl. Raya" : "Jl. Industri"} No. ${(numeric % 97) + 1}, Surabaya`,
    power: connectionType.startsWith("PLG TM")
      ? `${555 + (numeric % 6) * 345} kVA`
      : `${7_700 + (numeric % 5) * 6_900} VA`,
    requestedAt: `2026-08-${String(8 + (156 - numeric)).padStart(2, "0")}`,
    currentAction,
    decisions,
    sla: { tone, label: slaLabel },
    updatedAt,
  };
}

export function getActivity(id: ActionId | null | undefined) {
  return activities.find((activity) => activity.id === id);
}

export function getOwner(
  activity: ActivityDefinition,
  application: ApplicationSeed,
): RoleId {
  return typeof activity.owner === "function"
    ? activity.owner(application)
    : activity.owner;
}

export function getRole(id: RoleId) {
  return roles.find((role) => role.id === id) ?? roles[0];
}

export function getRoleActivities(
  roleId: RoleId,
  application: ApplicationSeed = applicationSeeds[0],
) {
  if (roleId === "super-user") return [];
  return activities.filter(
    (activity) => getOwner(activity, application) === roleId,
  );
}

export function getActiveSequence(
  application: Pick<ApplicationSeed, "decisions">,
): ActionId[] {
  return activities
    .filter((activity) => {
      if (
        (activity.id === "6" || activity.id === "11") &&
        application.decisions.needsPole === false
      )
        return false;
      if (
        (activity.id === "7b" || activity.id === "12b") &&
        application.decisions.needsPdkb !== true
      )
        return false;
      return true;
    })
    .map((activity) => activity.id);
}

export function getCurrentStage(application: Application): StageId {
  if (application.currentAction)
    return getActivity(application.currentAction)?.stage ?? 1;
  return 7;
}

export function getApplicationStatus(application: Application) {
  if (application.rejected) return "Ditolak";
  if (!application.currentAction || application.completed) return "Selesai";
  if (application.sla.tone === "late") return "Terlambat";
  return "Menunggu tindakan";
}

export function getInitialCompletedActionIds(
  application: Application,
): ActionId[] {
  const sequence = getActiveSequence(application);
  if (application.rejected) {
    const rejectedIndex = sequence.indexOf("5");
    return sequence.slice(0, rejectedIndex + 1);
  }
  if (!application.currentAction) return sequence;
  const currentIndex = sequence.indexOf(application.currentAction);
  return currentIndex < 0 ? [] : sequence.slice(0, currentIndex);
}

const evidenceNames: Partial<Record<ActionId, string[]>> = {
  "1": ["Permohonan_PBPD.pdf"],
  "2": ["Hasil_Survei.pdf", "Foto_Survei_01.jpg"],
  "3": ["RAB.pdf", "KKO.pdf", "KKF.pdf"],
  "4": ["Bukti_Pembayaran.pdf"],
  "5": ["Nota_Persetujuan_Sambungan.pdf"],
  "6": ["WO_Vendor_Tiang.pdf"],
  "7": ["WO_Konstruksi.pdf"],
  "7b": ["WO_PDKB.pdf"],
  "8": ["WO_Vendor_APP.pdf"],
  "9": ["Reservasi_Material.pdf"],
  "10": ["BA_Tera.pdf"],
  "11": ["Dokumentasi_Pemasangan_Tiang.jpg"],
  "12": ["Dokumentasi_Konstruksi.jpg"],
  "12b": ["BAPL_PDKB.pdf", "Dokumentasi_PDKB.jpg"],
  "13": ["BA_Pengujian.pdf"],
  "14": ["BA_Penyalaan.pdf"],
  "15": ["Mutasi_PDL.pdf"],
  "16": ["Arsip_AIL_DIJ.pdf"],
  "17": ["Dokumen_Penutupan.pdf"],
};

export function getDocuments(application: Application): DocumentItem[] {
  const initialApplication =
    applicationSeeds.find((item) => item.id === application.id) ?? application;
  const base = getInitialCompletedActionIds(initialApplication).flatMap(
    (actionId, actionIndex) =>
      (application.rejected && actionId === "5"
        ? ["Keputusan_Penolakan_NPS.pdf"]
        : (evidenceNames[actionId] ?? [])
      ).map((name, fileIndex) => ({
        id: `${application.id}-${actionId}-${fileIndex}`,
        name,
        actionId,
        addedAt: formatWorkflowDate(application.requestedAt, actionIndex + 1),
      })),
  );
  return [...base, ...(application.documents ?? [])];
}

export function getHistory(application: Application): HistoryItem[] {
  const initialApplication =
    applicationSeeds.find((item) => item.id === application.id) ?? application;
  const completed = getInitialCompletedActionIds(initialApplication);
  const base = completed.map((actionId, index) => {
    const activity = getActivity(actionId)!;
    const role = getRole(getOwner(activity, application));
    const isRejected = application.rejected && actionId === "5";
    return {
      id: `${application.id}-${actionId}`,
      at: formatWorkflowDate(application.requestedAt, index),
      title: isRejected
        ? "Permohonan ditolak NPS"
        : `${activity.shortLabel} selesai`,
      by: `${role.lane} — ${role.label}`,
    };
  });
  return [...base, ...(application.history ?? [])].reverse();
}

function formatWorkflowDate(date: string, offset: number) {
  const value = new Date(`${date}T09:14:00`);
  value.setDate(value.getDate() + offset);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function readOverrides(): Record<string, ApplicationOverride> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      window.localStorage.getItem(WORKFLOW_STORAGE_KEY) ?? "{}",
    );
  } catch {
    return {};
  }
}

export function getApplications(overrides = readOverrides()): Application[] {
  return applicationSeeds.map((seedItem) => ({
    ...seedItem,
    ...(overrides[seedItem.id] ?? {}),
    decisions: {
      ...seedItem.decisions,
      ...(overrides[seedItem.id]?.decisions ?? {}),
    },
  }));
}

export function advanceApplication(
  application: Application,
  roleId: RoleId,
  values: Record<string, string>,
  evidenceName?: string,
) {
  if (!application.currentAction) return application;
  const activity = getActivity(application.currentAction);
  if (!activity || getOwner(activity, application) !== roleId)
    return application;

  const overrides = readOverrides();
  const current = overrides[application.id] ?? {};
  const decisions: WorkflowDecisions = { ...application.decisions };
  if (application.currentAction === "3")
    decisions.needsPole = values.needsPole === "Ya";
  if (application.currentAction === "7")
    decisions.needsPdkb = values.needsPdkb === "Ya";
  if (application.currentAction === "5")
    decisions.npsApproved = values.npsDecision !== "Ditolak";

  const rejected =
    application.currentAction === "5" && decisions.npsApproved === false;
  const sequence = getActiveSequence({ decisions });
  const actionIndex = sequence.indexOf(application.currentAction);
  const nextAction = rejected
    ? application.currentAction
    : (sequence[actionIndex + 1] ?? null);
  const now = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  const role = getRole(roleId);
  const history: HistoryItem = {
    id: `${application.id}-history-${application.currentAction}-${Date.now()}`,
    at: new Date().toISOString(),
    title: rejected
      ? "Permohonan ditolak NPS"
      : `${activity.shortLabel} selesai`,
    by: `${role.lane} — ${role.label}`,
  };
  const documents = evidenceName
    ? [
        ...(current.documents ?? []),
        {
          id: `${application.id}-upload-${application.currentAction}-${Date.now()}`,
          name: evidenceName,
          actionId: application.currentAction,
          addedAt: now,
        },
      ]
    : current.documents;

  overrides[application.id] = {
    ...current,
    currentAction: nextAction,
    completed: !rejected && nextAction === null,
    rejected,
    decisions,
    updatedAt: now,
    history: [...(current.history ?? []), history],
    documents,
  };
  window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(overrides));
  return getApplications(overrides).find((item) => item.id === application.id)!;
}

export function resetWorkflowDemo() {
  if (typeof window !== "undefined")
    window.localStorage.removeItem(WORKFLOW_STORAGE_KEY);
}
