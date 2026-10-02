import { formatApiDate } from "@/lib/utils";
import {
  getActivity,
  getApplicationStatus,
  getCurrentStage,
  getOwnedSla,
  stages,
  type Application,
  type RoleId,
} from "@/lib/workflow";

export type ExportRow = {
  number: string;
  customer: string;
  phone: string;
  location: string;
  requestType: string;
  connectionType: string;
  unit: string;
  requestedAt: string;
  stage: string;
  activity: string;
  status: string;
  slaStatus: string;
  slaDeadline: string;
};

export type ExportColumn = {
  header: string;
  /** Column width in characters (Excel). */
  width: number;
  value: (row: ExportRow) => string;
  /** Value is an ISO date; written as a real date cell in Excel. */
  date?: boolean;
  /** Customer contact data; withheld from vendor roles. */
  sensitive?: boolean;
};

const columns: ExportColumn[] = [
  { header: "No. Permohonan", width: 20, value: (row) => row.number },
  { header: "Pelanggan", width: 30, value: (row) => row.customer },
  { header: "No. HP", width: 16, value: (row) => row.phone, sensitive: true },
  {
    header: "Alamat",
    width: 40,
    value: (row) => row.location,
    sensitive: true,
  },
  { header: "Jenis Permohonan", width: 18, value: (row) => row.requestType },
  { header: "Jenis Sambungan", width: 18, value: (row) => row.connectionType },
  { header: "Unit / ULP", width: 20, value: (row) => row.unit },
  {
    header: "Tanggal Permohonan",
    width: 18,
    value: (row) => row.requestedAt,
    date: true,
  },
  { header: "Tahap Saat Ini", width: 18, value: (row) => row.stage },
  { header: "Aktivitas Saat Ini", width: 26, value: (row) => row.activity },
  { header: "Status", width: 20, value: (row) => row.status },
  { header: "Status SLA", width: 18, value: (row) => row.slaStatus },
  {
    header: "Batas SLA",
    width: 16,
    value: (row) => row.slaDeadline,
    date: true,
  },
];

// Vendors are external to PLN; the detail page already hides customer contact
// data from them, so the export must not reintroduce it.
export function getExportColumns(roleId: RoleId): ExportColumn[] {
  const isVendor = roleId.startsWith("vendor-");
  return columns.filter((column) => !(isVendor && column.sensitive));
}

function slaStatusLabel(sla: { tone: string; deadline: string | null }) {
  if (sla.tone === "done") return "Selesai";
  if (sla.tone === "late") return "Terlambat";
  if (sla.tone === "due") return "Mendekati tenggat";
  return sla.deadline ? "Tepat waktu" : "";
}

// Mirrors what the list table shows for this role, so the file matches the screen.
export function buildExportRows(
  applications: Application[],
  roleId: RoleId,
): ExportRow[] {
  return applications.map((application) => {
    const stage = stages.find(
      (item) => item.id === getCurrentStage(application),
    );
    const activity = getActivity(application.currentAction);
    const sla = getOwnedSla(application, roleId) ?? application.sla;
    return {
      number: application.number,
      customer: application.customer,
      phone: application.phone,
      location: application.location,
      requestType: application.requestType,
      connectionType: application.connectionType,
      unit: application.unit,
      requestedAt: application.requestedAt.slice(0, 10),
      stage: application.rejected
        ? "Delegasi PK NPS"
        : (stage?.shortLabel ?? ""),
      activity: application.rejected ? "" : (activity?.shortLabel ?? ""),
      status: getApplicationStatus(application, roleId),
      slaStatus: slaStatusLabel(sla),
      slaDeadline: sla.deadline ? sla.deadline.slice(0, 10) : "",
    };
  });
}

export function exportFileName(extension: "xlsx" | "pdf", now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `daftar-permohonan-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.${extension}`;
}

// Excel stores dates as UTC midnight; a local-midnight Date would shift a day
// back for users east of UTC (WIB).
function toUtcDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : null;
}

export async function buildApplicationsXlsx(
  applications: Application[],
  roleId: RoleId,
): Promise<Blob> {
  // Loaded on demand so the library never weighs on the dashboard bundle.
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const rows = buildExportRows(applications, roleId);
  return writeXlsxFile(rows, {
    sheet: "Permohonan",
    stickyRowsCount: 1,
    columns: getExportColumns(roleId).map((column) => ({
      header: { value: column.header, fontWeight: "bold" as const },
      width: column.width,
      cell: (row: ExportRow) => {
        const text = column.value(row);
        if (!text) return null;
        if (!column.date) return { value: text };
        const date = toUtcDate(text);
        return date
          ? { value: date, type: Date, format: "dd/mm/yyyy" }
          : { value: text };
      },
    })),
  }).toBlob();
}

export async function buildApplicationsPdf(
  applications: Application[],
  roleId: RoleId,
  scope: string[],
  now = new Date(),
): Promise<Blob> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const rows = buildExportRows(applications, roleId);
  // PDF is a readable list; customer contact columns stay in the Excel file.
  const pdfColumns = getExportColumns(roleId).filter(
    (column) => !column.sensitive,
  );
  const dateText = (iso: string) =>
    iso ? formatApiDate(iso, { day: "numeric", month: "short", year: "numeric" }) : "-";

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 10;
  doc.setFontSize(14);
  doc.text("Daftar Permohonan PB/PD", margin, 14);
  doc.setFontSize(9);
  const exportedAt = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  doc.text(`Diekspor ${exportedAt} · ${rows.length} permohonan`, margin, 20);
  if (scope.length) doc.text(`Cakupan: ${scope.join(" · ")}`, margin, 25);

  autoTable(doc, {
    startY: scope.length ? 29 : 24,
    margin: { left: margin, right: margin, bottom: 12 },
    head: [pdfColumns.map((column) => column.header)],
    body: rows.map((row) =>
      pdfColumns.map((column) => {
        const text = column.value(row);
        return column.date ? dateText(text) : text || "-";
      }),
    ),
    styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: { fillColor: [0, 111, 133], textColor: 255 },
    alternateRowStyles: { fillColor: [237, 243, 245] },
  });

  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.text(`Halaman ${page} dari ${pageCount}`, pageWidth - margin, pageHeight - 6, {
      align: "right",
    });
  }
  return doc.output("blob");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function exportApplicationsXlsx(
  applications: Application[],
  roleId: RoleId,
) {
  const fileName = exportFileName("xlsx");
  downloadBlob(await buildApplicationsXlsx(applications, roleId), fileName);
  return { fileName };
}

export async function exportApplicationsPdf(
  applications: Application[],
  roleId: RoleId,
  scope: string[],
) {
  const fileName = exportFileName("pdf");
  downloadBlob(
    await buildApplicationsPdf(applications, roleId, scope),
    fileName,
  );
  return { fileName };
}
