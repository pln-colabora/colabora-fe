export type RoleId =
  | "pelayanan-pelanggan"
  | "teknik"
  | "nps"
  | "perencanaan"
  | "konstruksi"
  | "transaksi-energi"
  | "jaringan"
  | "pdkb"
  | "vendor-tiang"
  | "vendor-konstruksi"
  | "vendor-sr-app"
  | "super-user"
  | "admin"
  | "user";

export type ActionId =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "pk"
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

export type ApplicationSummary = {
  id: string;
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

export type HistoryItem = {
  id: string;
  at: string;
  title: string;
  detail?: string;
  by: string;
};

export type DocumentItem = {
  id: string;
  name: string;
  actionId: ActionId | undefined;
  addedAt: string;
  mimeType: string;
  sizeBytes: number;
};

export type WorkflowNode = {
  workflow_node: string;
  activity_number: number | null;
  stage_number: StageId;
  status: "locked" | "available" | "in_progress" | "completed" | "skipped";
  sla_deadline: string | null;
  sla_status: "none" | "on_time" | "due_soon" | "overdue";
  completed_at: string | null;
  completed_by: string | null;
  payload: Record<string, unknown>;
};
export type AvailableAction = {
  workflow_node: string;
  activity_number: number | null;
  stage_number: StageId;
  method: string;
  path: string;
};
export type Application = ApplicationSummary & {
  number: string;
  phone: string;
  status: string;
  currentStage: StageId;
  completed: boolean;
  nodes: WorkflowNode[];
  availableActions: AvailableAction[];
  history: HistoryItem[];
  documents: DocumentItem[];
};

export type FieldDefinition = {
  name: string;
  label: string;
  type?: "text" | "date" | "textarea" | "select" | "number";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  maxLength?: number;
};

export type ActivityDefinition = {
  id: ActionId;
  stage: StageId;
  label: string;
  shortLabel: string;
  description: string;
  owner: RoleId | ((application: ApplicationSummary) => RoleId);
  fields: FieldDefinition[];
  evidence?: string;
};

export const roles: Array<{
  id: RoleId;
  label: string;
  lane: string;
  initials: string;
}> = [
  { id: "admin", label: "Admin", lane: "Administrasi", initials: "AD" },
  { id: "user", label: "User", lane: "Pengguna", initials: "US" },
  { id: "teknik", label: "Bagian Teknik", lane: "ULP", initials: "BT" },
  {
    id: "pelayanan-pelanggan",
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
  {
    id: "transaksi-energi",
    label: "Transaksi Energi",
    lane: "UP3",
    initials: "TE",
  },
  { id: "jaringan", label: "Bagian Jaringan", lane: "UP3", initials: "JR" },
  { id: "pdkb", label: "Tim PDKB", lane: "UP3", initials: "PD" },
  { id: "vendor-tiang", label: "Vendor Tiang", lane: "Vendor", initials: "VT" },
  {
    id: "vendor-konstruksi",
    label: "Vendor Konstruksi",
    lane: "Vendor",
    initials: "VK",
  },
  {
    id: "vendor-sr-app",
    label: "Vendor SR/APP",
    lane: "Vendor",
    initials: "VA",
  },
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

const isPlgTm = (application: ApplicationSummary) =>
  application.connectionType.startsWith("PLG TM");

const permohonanOwner = (application: ApplicationSummary): RoleId =>
  isPlgTm(application) ? "nps" : "pelayanan-pelanggan";

const surveyOwner = (application: ApplicationSummary): RoleId =>
  isPlgTm(application) ? "perencanaan" : "teknik";

const planningOwner = surveyOwner;

const energizeOwner = (application: ApplicationSummary): RoleId =>
  isPlgTm(application) ? "jaringan" : "teknik";

const appVendorOwner = (application: ApplicationSummary): RoleId =>
  isPlgTm(application) ? "vendor-konstruksi" : "vendor-sr-app";

const notesField: FieldDefinition = {
  name: "notes",
  label: "Catatan",
  type: "textarea",
  required: false,
  maxLength: 2000,
};

export const activities: ActivityDefinition[] = [
  {
    id: "1",
    stage: 1,
    label: "Permohonan PB/PD",
    shortLabel: "Permohonan PB/PD",
    description:
      "Catat data pelanggan, jenis sambungan, dan lokasi permohonan.",
    fields: [],
    owner: permohonanOwner,
  },
  {
    id: "2",
    stage: 2,
    label: "Survei Perluasan Jaringan",
    shortLabel: "Survei",
    description:
      "Lengkapi hasil pemeriksaan lapangan sebelum pekerjaan direncanakan.",
    fields: [
      {
        name: "surveyed_at",
        label: "Tanggal survei",
        type: "date",
        required: true,
      },
      notesField,
    ],
    evidence: "Evidence aktivitas",
    owner: surveyOwner,
  },
  {
    id: "3",
    stage: 3,
    label: "RAB, KKO & KKF",
    shortLabel: "RAB, KKO & KKF",
    description:
      "Susun perencanaan teknis dan tentukan apakah pemasangan tiang diperlukan.",
    fields: [
      {
        name: "kebutuhan_tiang",
        label: "Kebutuhan tiang",
        type: "select",
        options: ["Ya", "Tidak"],
        required: true,
      },
      notesField,
    ],
    evidence: "Evidence aktivitas",
    owner: planningOwner,
  },
  {
    id: "4",
    stage: 3,
    label: "Permohonan Perluasan",
    shortLabel: "Permohonan perluasan",
    description: "Lengkapi evidence perluasan dan keputusan delegasi PK NPS.",
    fields: [
      {
        name: "nps_delegation_status",
        label: "Delegasi PK NPS",
        type: "select",
        options: ["Didelegasikan", "Dikembalikan"],
        required: true,
      },
      notesField,
    ],
    evidence: "Evidence aktivitas",
    owner: "nps",
  },
  {
    id: "5",
    stage: 3,
    label: "Delegasi Perintah Kerja NPS",
    shortLabel: "Delegasi PK NPS",
    description:
      "Delegasikan PK pekerjaan ke bagian tujuan. Pengembalian PK akan menghentikan workflow permohonan.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "nps",
  },
  {
    id: "6",
    stage: 4,
    label: "WO Vendor Tiang",
    shortLabel: "WO Vendor Tiang",
    description:
      "Terbitkan work order pemasangan tiang sesuai hasil perencanaan.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "perencanaan",
  },
  {
    id: "7",
    stage: 4,
    label: "WO Vendor Konstruksi",
    shortLabel: "WO Vendor Konstruksi",
    description:
      "Terbitkan WO konstruksi dan tentukan kebutuhan dukungan PDKB.",
    fields: [
      {
        name: "perlu_pdkb",
        label: "Perlu PDKB",
        type: "select",
        options: ["Ya", "Tidak"],
        required: true,
      },
      notesField,
    ],
    evidence: "Evidence aktivitas",
    owner: "konstruksi",
  },
  {
    id: "7b",
    stage: 4,
    label: "WO PDKB",
    shortLabel: "WO PDKB",
    description: "Terbitkan penugasan Tim PDKB sebelum konstruksi dimulai.",
    fields: [notesField],
    evidence: "Upload Evidence Perintah Kerja PDKB",
    owner: "konstruksi",
  },
  {
    id: "pk",
    stage: 4,
    label: "PK Vendor Pelaksana",
    shortLabel: "PK Vendor",
    description: "Terbitkan perintah kerja vendor pelaksana.",
    owner: "konstruksi",
    fields: [notesField],
    evidence: "Evidence PK vendor",
  },
  {
    id: "8",
    stage: 4,
    label: "WO Vendor APP",
    shortLabel: "WO Vendor APP",
    description: "Terbitkan work order penyediaan dan pemasangan APP.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "transaksi-energi",
  },
  {
    id: "9",
    stage: 4,
    label: "Reservasi Material",
    shortLabel: "Reservasi material",
    description:
      "Pastikan material utama tersedia dan telah dipesan dari gudang.",
    fields: [
      {
        name: "reservation_notes",
        label: "Catatan reservasi material",
        type: "textarea",
        required: false,
        maxLength: 2000,
      },
      {
        name: "tera_notes",
        label: "Catatan perakitan dan tera APP",
        type: "textarea",
        required: false,
        maxLength: 2000,
      },
    ],
    evidence: "Evidence aktivitas",
    owner: "transaksi-energi",
  },
  {
    id: "10",
    stage: 4,
    label: "Perakitan & Tera APP",
    shortLabel: "Perakitan & Tera APP",
    description: "Catat identitas APP serta hasil perakitan dan tera.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "transaksi-energi",
  },
  {
    id: "11",
    stage: 5,
    label: "Pemasangan Tiang",
    shortLabel: "Pemasangan tiang",
    description:
      "Dokumentasikan pemasangan tiang dari kondisi awal hingga selesai.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "vendor-tiang",
  },
  {
    id: "12",
    stage: 5,
    label: "Pelaksanaan Konstruksi",
    shortLabel: "Pelaksanaan konstruksi",
    description:
      "Laporkan realisasi scope, waktu, kendala, dan dokumentasi konstruksi.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "vendor-konstruksi",
  },
  {
    id: "12b",
    stage: 5,
    label: "Dokumentasi PDKB",
    shortLabel: "Dokumentasi PDKB",
    description: "Lengkapi dokumentasi pendampingan PDKB dan BAPL.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "pdkb",
  },
  {
    id: "13",
    stage: 6,
    label: "Pengoperasian Jaringan Listrik",
    shortLabel: "Pengoperasian jaringan",
    description: "Catat pengujian dan hasil pengoperasian jaringan listrik.",
    fields: [
      {
        name: "operation_result",
        label: "Hasil pengoperasian jaringan",
        type: "textarea",
        required: true,
        maxLength: 500,
      },
      notesField,
    ],
    evidence: "Evidence aktivitas",
    owner: energizeOwner,
  },
  {
    id: "14",
    stage: 6,
    label: "Pemasangan SR/APP & Penyalaan",
    shortLabel: "Pemasangan SR/APP",
    description:
      "Lengkapi identitas meter, hasil pemasangan, dan status penyalaan.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: appVendorOwner,
  },
  {
    id: "15",
    stage: 7,
    label: "Entri & Mutasi PDL",
    shortLabel: "Entri & Mutasi PDL",
    description: "Lengkapi evidence penutupan PDL, arsip AIL, dan DIJ.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "pelayanan-pelanggan",
  },
  {
    id: "16",
    stage: 7,
    label: "Arsip AIL / Updating DIJ",
    shortLabel: "Arsip AIL / DIJ",
    description: "Lengkapi nomor AIL dan pembaruan data induk jaringan.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "pelayanan-pelanggan",
  },
  {
    id: "17",
    stage: 7,
    label: "Selesai",
    shortLabel: "Selesai",
    description:
      "Konfirmasi seluruh dokumen akhir lengkap dan tutup permohonan.",
    fields: [notesField],
    evidence: "Evidence aktivitas",
    owner: "pelayanan-pelanggan",
  },
];

// Presentation mapping only. Node state and action permissions come from the API.
export const nodeActions: Record<string, ActionId> = {
  permohonan: "1",
  survei: "2",
  rab_kko_kkf: "3",
  kebutuhan_tiang: "3",
  permohonan_perluasan: "4",
  nps_delegation: "5",
  wo_tiang: "6",
  wo_konstruksi: "7",
  wo_pdkb: "7b",
  pk_vendor: "pk",
  wo_app: "8",
  reservasi_material: "9",
  tera_app: "10",
  pemasangan_tiang: "11",
  pelaksanaan_konstruksi: "12",
  pdkb_documentation: "12b",
  energize_jaringan: "13",
  pemasangan_sr_app: "14",
  entri_mutasi_pdl: "15",
  arsip_ail: "16",
  selesai: "17",
};
export function getActivity(id: ActionId | null | undefined) {
  return activities.find((activity) => activity.id === id);
}
export function getOwner(
  activity: ActivityDefinition,
  application: ApplicationSummary,
): RoleId {
  return typeof activity.owner === "function"
    ? activity.owner(application)
    : activity.owner;
}
export function getRole(id: RoleId) {
  return (
    roles.find((role) => role.id === id) ?? {
      id,
      label: id,
      lane: "—",
      initials: "",
    }
  );
}
export function getCurrentStage(application: Application) {
  return application.currentStage;
}
export function getApplicationStatus(application: Application) {
  return (
    (
      {
        in_progress: "Menunggu tindakan",
        returned: "Ditolak",
        completed: "Selesai",
      } as Record<string, string>
    )[application.status] ?? application.status
  );
}
export function getDocuments(application: Application) {
  return application.documents;
}
export function getHistory(application: Application) {
  return application.history;
}
