import { apiClient, apiRequest } from "@/lib/api";
import { formatApiDate } from "@/lib/utils";
import {
  getActivity,
  nodeActions,
  type Application,
  type AvailableAction,
  type WorkflowNode,
  type StageId,
} from "@/lib/workflow";

type PermohonanResponse = {
  id: string;
  no_permohonan: string;
  pelanggan_nama: string;
  pelanggan_alamat: string;
  pelanggan_no_hp: string;
  jenis_permohonan: string;
  jenis_sambungan: string;
  ulp_unit: string;
  request_date: string | null;
  tanggal_pembayaran?: string | null;
  nominal_pembayaran?: number | null;
  energize_status?: "temporary" | "permanent" | null;
  current_stage: StageId | null;
  status: string;
  kebutuhan_tiang: boolean | null;
  perlu_pdkb: boolean | null;
  nps_delegation_status: "delegated" | "returned" | null;
  // The list endpoint exposes an aggregate SLA in addition to per-node data.
  sla_deadline?: string | null;
  sla_status?: "none" | "on_time" | "due_soon" | "overdue";
  sla_basis?: string;
  sla_remaining_days?: number | null;
  sla_calendar_error?: string;
  // Create inputs. The API returns them at the top level (null on records made
  // before they were captured) although the published schema omits them; the
  // permohonan node payload is kept as a fallback.
  jenis_pembayaran?: "pascabayar" | "prabayar" | null;
  tarif?: string | null;
  golongan_tarif?: string | null;
  golongan_tarif_lama?: string | null;
  daya_baru?: number | null;
  daya_lama?: number | null;
  pembatas_baru?: string | null;
  pembatas_lama?: string | null;
  workflow_nodes?: WorkflowNode[] | null;
  available_actions?: AvailableAction[] | null;
};

function toPositiveNumber(value: unknown) {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number > 0
    ? number
    : undefined;
}
type DocumentResponse = {
  type?: string;
  id: string;
  original_filename: string;
  created_at: string;
  mime_type: string;
  size_bytes: number;
  workflow_nodes: string[];
  uploaded_by_name?: string;
  source?: string;
};
type ActivityLog = {
  id: string;
  created_at: string;
  actor: string;
  detail: string | null;
  workflow_node: string | null;
};

export function mapApplication(data: PermohonanResponse): Application {
  const nodes = data.status === "draft" ? [] : data.workflow_nodes ?? [];
  const active = nodes.filter(
    (node) => node.status === "available" || node.status === "in_progress",
  );
  const slaNode =
    active.find((node) => node.sla_status === "overdue") ??
    active.find((node) => node.sla_status === "due_soon") ??
    active.find((node) => node.sla_status === "on_time") ??
    active.find((node) => node.sla_deadline);
  // Prefer the aggregate values from the list response, while keeping the
  // per-node fallback for older API responses.
  const sla =
    data.sla_status && data.sla_status !== "none"
      ? data.sla_status
      : slaNode?.sla_status;
  // Active nodes may carry a deadline without a graded sla_status ("none");
  // surface that date so the SLA column is informative instead of just "—".
  const deadline = data.status === "draft" ? null :
    data.sla_deadline ??
    slaNode?.sla_deadline ??
    active.find((node) => node.sla_deadline)?.sla_deadline ??
    nodes.find(
      (node) =>
        node.stage_number === data.current_stage && Boolean(node.sla_deadline),
    )?.sla_deadline ??
    null;
  const latestCompletedAt = nodes
    .map((node) => node.completed_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a))[0];
  const createInputs =
    nodes.find((node) => node.workflow_node === "permohonan")?.payload ?? {};
  const tarifValue = data.tarif ?? createInputs.tarif;
  const golonganTarifValue =
    data.golongan_tarif ?? createInputs.golongan_tarif;
  return {
    id: data.id,
    number: data.no_permohonan,
    customer: data.pelanggan_nama,
    phone: data.pelanggan_no_hp,
    location: data.pelanggan_alamat,
    requestType:
      data.jenis_permohonan === "Pasang Baru (PB)"
        ? "Pasang baru"
        : data.jenis_permohonan === "Perubahan Daya (PD)"
          ? "Perubahan daya"
          : (data.jenis_permohonan as Application["requestType"]),
    connectionType: (data.jenis_sambungan === "JTM/Gardu"
      ? "JTM / Gardu"
      : data.jenis_sambungan) as Application["connectionType"],
    unit: data.ulp_unit,
    jenisPembayaran: data.jenis_pembayaran ?? undefined,
    tarif:
      typeof tarifValue === "string" && tarifValue ? tarifValue : undefined,
    golonganTarif:
      typeof golonganTarifValue === "string" && golonganTarifValue
        ? golonganTarifValue
        : undefined,
    golonganTarifLama:
      typeof (data.golongan_tarif_lama ?? createInputs.golongan_tarif_lama) ===
        "string" &&
      (data.golongan_tarif_lama ?? createInputs.golongan_tarif_lama)
        ? String(data.golongan_tarif_lama ?? createInputs.golongan_tarif_lama)
        : undefined,
    pembatasBaru: data.pembatas_baru ?? undefined,
    pembatasLama: data.pembatas_lama ?? undefined,
    dayaBaru: toPositiveNumber(data.daya_baru ?? createInputs.daya_baru),
    dayaLama: toPositiveNumber(data.daya_lama ?? createInputs.daya_lama),
    requestedAt: data.request_date ?? "",
    paymentDate: data.tanggal_pembayaran ?? undefined,
    paymentAmount: data.nominal_pembayaran ?? undefined,
    energizeStatus: data.energize_status ?? undefined,
    updatedAt: latestCompletedAt ?? "—",
    currentAction:
      active.map((node) => nodeActions[node.workflow_node]).find(Boolean) ??
      null,
    currentStage: data.current_stage ?? 1,
    status: data.status,
    rejected: data.status === "returned",
    completed: data.status === "completed",
    decisions: {
      needsPole: data.kebutuhan_tiang ?? undefined,
      needsPdkb: data.perlu_pdkb ?? undefined,
      npsApproved:
        data.nps_delegation_status === null
          ? undefined
          : data.nps_delegation_status === "delegated",
    },
    sla: {
      basis: data.sla_basis ?? slaNode?.sla_basis,
      remainingDays: data.sla_remaining_days ?? slaNode?.sla_remaining_days,
      calendarError: data.sla_calendar_error ?? slaNode?.sla_calendar_error,
      tone:
        data.status === "draft"
          ? "safe"
          : data.status === "completed"
          ? "done"
          : sla === "overdue"
            ? "late"
            : sla === "due_soon"
              ? "due"
              : "safe",
      label:
        data.status === "draft"
          ? "—"
          : data.status === "completed"
          ? "Selesai"
          : sla === "overdue"
            ? "Terlambat"
            : sla === "due_soon"
              ? "Mendekati tenggat"
              : sla === "on_time"
                ? "Tepat waktu"
                : deadline
                  ? `Tenggat ${formatApiDate(deadline, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : "—",
      deadline,
    },
    nodes,
    availableActions: data.status === "draft" ? [] : data.available_actions ?? [],
    history: [],
    documents: [],
  };
}

export async function getApplications() {
  // Keep draft imports out of the active dashboard while retaining its existing
  // client-side filters and totals across every active page.
  const statuses = ["in_progress", "completed", "returned"];
  const groups = await Promise.all(statuses.map((status) => getApplicationsByStatus(status)));
  return groups.flat().sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export async function getApplicationsByStatus(status: string, scope?: string, search?: string) {
  const applications: Application[] = [];
  let page = 1;
  let maxPage = 1;
  do {
    const params = new URLSearchParams({status, page: String(page), per_page: "100"});
    if (scope) params.set("scope", scope);
    if (search) params.set("search", search);
    const response = await apiRequest<PermohonanResponse[]>(
      `/api/permohonan?${params.toString()}`,
    );
    applications.push(...response.data.map(mapApplication));
    maxPage = response.pagination?.max_page ?? 1;
    page++;
  } while (page <= maxPage);
  return applications;
}

export async function getDraftPage(page: number, search = "") {
  const params = new URLSearchParams({ status: "draft", scope: "mine", page: String(page), per_page: "25" });
  if (search) params.set("search", search);
  const response = await apiRequest<PermohonanResponse[]>(`/api/permohonan?${params.toString()}`);
  return { applications: response.data.map(mapApplication), pagination: response.pagination };
}

export async function getApplication(id: string) {
  const path = `/api/permohonan/${encodeURIComponent(id)}`;
  const { data } = await apiRequest<PermohonanResponse>(path);
  return mapApplication(data);
}

export async function getApplicationActivity(
  id: string,
  workflowNode: string,
) {
  const path = `/api/permohonan/${encodeURIComponent(id)}/activities/${encodeURIComponent(workflowNode)}`;
  const { data } = await apiRequest<Record<string, unknown>>(path);
  if (
    data &&
    typeof data === "object" &&
    data.payload &&
    typeof data.payload === "object" &&
    !Array.isArray(data.payload)
  )
    return data.payload as Record<string, unknown>;
  return data;
}

export async function getApplicationDocuments(id: string) {
  const { data } = await apiRequest<DocumentResponse[]>(
    `/api/permohonan/${encodeURIComponent(id)}/documents`,
  );
  return data.map((document) => ({
    id: document.id,
    name: document.original_filename,
    addedAt: document.created_at,
    actionId: nodeActions[document.workflow_nodes[0]],
    mimeType: document.mime_type,
    sizeBytes: document.size_bytes,
    uploadedBy: document.uploaded_by_name,
    source: document.source,
    category: document.type,
  }));
}
export async function getApplicationHistory(id: string) {
  const { data } = await apiRequest<ActivityLog[]>(
    `/api/permohonan/${encodeURIComponent(id)}/logs`,
  );
  const seen = new Set<string>();
  return data
    .filter((log) => {
      const key = `${log.created_at}|${log.workflow_node ?? ""}|${log.actor}|${log.detail ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((log) => {
      const activity = getActivity(
        nodeActions[log.workflow_node ?? ""],
      );
      return {
        id: log.id,
        at: log.created_at,
        title:
          activity?.label ?? log.workflow_node ?? "Aktivitas workflow",
        detail: log.detail ?? undefined,
        by: log.actor,
        actionId: nodeActions[log.workflow_node ?? ""],
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

export type TariffPowerOption = {
  tarif: string;
  golongan_tarif: string;
  jenis_sambungan: string;
  label: string;
  daya_label?: string | null;
  daya_min: number;
  daya_max: number | null;
  pembatas?: string | null;
};
// Active tarif + power bands, optionally scoped to a jenis sambungan.
export async function getTariffOptions(jenisSambungan?: string) {
  const query = jenisSambungan
    ? `?jenis_sambungan=${encodeURIComponent(jenisSambungan)}`
    : "";
  return (await apiRequest<TariffPowerOption[]>(`/api/tariffs${query}`)).data;
}

export type CreateApplicationRequest = {
  jenis_permohonan: string;
  jenis_sambungan: string;
  pelanggan_nama: string;
  pelanggan_alamat: string;
  pelanggan_no_hp: string;
  jenis_pembayaran: "pascabayar" | "prabayar";
  tarif: string;
  golongan_tarif?: string;
  golongan_tarif_lama?: string;
  daya_baru: number;
  daya_lama?: number;
  pembatas_baru?: string;
  pembatas_lama?: string;
  ulp_unit?: string;
  evidence_files: File[];
  tanggal_pembayaran: string;
  nominal_pembayaran: number;
};

export type DraftApplicationRequest = Omit<CreateApplicationRequest, "evidence_files" | "jenis_pembayaran" | "tarif" | "golongan_tarif" | "daya_baru" | "tanggal_pembayaran" | "nominal_pembayaran" | "daya_lama" | "golongan_tarif_lama" | "pembatas_baru" | "pembatas_lama" | "ulp_unit"> & {
  jenis_pembayaran: string;
  tarif: string | null;
  golongan_tarif: string | null;
  daya_baru: number | null;
  tanggal_pembayaran: string;
  nominal_pembayaran: number | null;
  daya_lama: number | null;
  golongan_tarif_lama: string | null;
  pembatas_baru: string | null;
  pembatas_lama: string | null;
  ulp_unit: string;
};

export async function importEIS(file: File) {
  const body = new FormData();
  body.set("file", file);
  return (await apiRequest<PermohonanResponse[]>("/api/permohonan/import-eis", { method: "POST", data: body })).data.map(mapApplication);
}

export async function saveDraft(id: string, payload: DraftApplicationRequest) {
  return mapApplication((await apiRequest<PermohonanResponse>(`/api/permohonan/${encodeURIComponent(id)}/draft`, { method: "PUT", data: payload })).data);
}

export async function deleteDraft(id: string) {
  await apiRequest<null>(`/api/permohonan/${encodeURIComponent(id)}/draft`, { method: "DELETE" });
}

export async function continueDraft(id: string, files: File[]) {
  const body = new FormData();
  files.forEach((file) => body.append("evidence_files", file));
  return mapApplication((await apiRequest<PermohonanResponse>(`/api/permohonan/${encodeURIComponent(id)}/draft/continue`, { method: "POST", data: body })).data);
}

export async function saveAndContinueDraft(id: string, payload: DraftApplicationRequest, files: File[], onSaved: () => void) {
  await saveDraft(id, payload);
  onSaved();
  return continueDraft(id, files);
}
export async function createApplication(payload: CreateApplicationRequest) {
  // Multipart: the create endpoint binds the customer's evidence to the new
  // permohonan atomically, so files are sent alongside the fields.
  const body = new FormData();
  body.set("jenis_permohonan", payload.jenis_permohonan);
  body.set("jenis_sambungan", payload.jenis_sambungan);
  body.set("pelanggan_nama", payload.pelanggan_nama);
  body.set("pelanggan_alamat", payload.pelanggan_alamat);
  body.set("pelanggan_no_hp", payload.pelanggan_no_hp);
  body.set("tanggal_pembayaran", payload.tanggal_pembayaran);
  body.set("nominal_pembayaran", String(payload.nominal_pembayaran));
  body.set("jenis_pembayaran", payload.jenis_pembayaran);
  body.set("tarif", payload.tarif);
  if (payload.golongan_tarif)
    body.set("golongan_tarif", payload.golongan_tarif);
  if (payload.golongan_tarif_lama)
    body.set("golongan_tarif_lama", payload.golongan_tarif_lama);
  body.set("daya_baru", String(payload.daya_baru));
  if (payload.daya_lama !== undefined)
    body.set("daya_lama", String(payload.daya_lama));
  if (payload.pembatas_baru)
    body.set("pembatas_baru", payload.pembatas_baru);
  if (payload.pembatas_lama)
    body.set("pembatas_lama", payload.pembatas_lama);
  if (payload.ulp_unit) body.set("ulp_unit", payload.ulp_unit);
  for (const file of payload.evidence_files)
    body.append("evidence_files", file);
  return mapApplication(
    (
      await apiRequest<PermohonanResponse>("/api/permohonan", {
        method: "POST",
        data: body,
      })
    ).data,
  );
}
export async function uploadEvidence(
  file: File,
  onProgress?: (percentage: number) => void,
  category = "evidence",
) {
  const body = new FormData();
  body.set("file", file);
  body.set("type", category);
  return (
    await apiRequest<DocumentResponse>("/api/documents", {
      method: "POST",
      data: body,
      onUploadProgress: (event) => {
        if (event.total)
          onProgress?.(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
      },
      // The current gateway omits CORS headers on its 413 response, so the
      // browser reports that response as a network failure.
      networkErrorMessage:
        "Ukuran konten terlalu besar. Kurangi ukuran berkas lalu coba lagi.",
    })
  ).data;
}

// Streams the file as an attachment. The backend resolves the permohonan from
// the document itself, so only the document id is needed.
export async function downloadApplicationDocument(documentId: string) {
  const path = `/api/documents/${encodeURIComponent(documentId)}/download`;
  return (await apiClient.get<Blob>(path, { responseType: "blob" })).data;
}
export async function exportApplicationActivity(
  applicationId: string,
  workflowNode: string,
) {
  const normalizedNode = workflowNode.replaceAll("-", "_");
  // Each work order has its own PDF endpoint (POST: generates once, then serves).
  const vendorPath = (
    { wo_tiang: "tiang", wo_konstruksi: "konstruksi" } as Record<string, string>
  )[normalizedNode];
  if (vendorPath) {
    const path = `/api/permohonan/${encodeURIComponent(
      applicationId,
    )}/wo-vendor/${vendorPath}/export`;
    return (
      await apiClient.post<Blob>(path, undefined, { responseType: "blob" })
    ).data;
  }
  const path = `/api/permohonan/${encodeURIComponent(
    applicationId,
  )}/activities/${encodeURIComponent(workflowNode)}/export`;
  return (await apiClient.get<Blob>(path, { responseType: "blob" })).data;
}
// Generates the work-order PDF right after its form is saved, so the file already
// exists when anyone else wants to download it. The node is completed by then, so
// a failure here must not look like a failed submission: report it, never throw.
export async function generateWorkOrderFile(
  applicationId: string,
  workflowNode: string,
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  try {
    await exportApplicationActivity(applicationId, workflowNode);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
export async function previewApplicationDocument(documentId: string) {
  const path = `/api/documents/${encodeURIComponent(documentId)}/preview`;
  return (await apiClient.get<Blob>(path, { responseType: "blob" })).data;
}
export async function submitAction(
  id: string,
  action: AvailableAction,
  values: Record<string, string>,
  documentIds: string[],
  locationCoordinates?: { latitude: number; longitude: number } | null,
) {
  // Some API deployments expose the combined planning node under the
  // decision name; both names use the same rab-kko-kkf contract.
  const workflowNode = action.workflow_node.replaceAll("-", "_");
  const payload: Record<string, unknown> = { document_ids: documentIds };
  if (workflowNode === "survei")
    payload.surveyed_at = values.surveyed_at;
  if (workflowNode === "rab_kko_kkf" || workflowNode === "kebutuhan_tiang")
    payload.kebutuhan_tiang = values.kebutuhan_tiang === "Ya";
  if (
    workflowNode === "permohonan_perluasan" ||
    workflowNode === "nps_delegation"
  )
    payload.nps_delegation_status =
      values.nps_delegation_status === "Didelegasikan"
        ? "delegated"
        : "returned";
  if (workflowNode === "verifikasi_prioritas") payload.priority = values.priority;
  if (workflowNode === "wo_konstruksi") {
    payload.perlu_pdkb = values.perlu_pdkb === "Ya";
    payload.estimasi_tanggal_selesai = values.estimasi_tanggal_selesai;
    if (payload.perlu_pdkb) payload.tanggal_pdkb = values.tanggal_pdkb;
  }
  // reservasi_material (vendor-konstruksi) and tera_app (transaksi-energi) are
  // now separate nodes; each takes a plain optional notes field.
  if (
    ["wo_tiang", "wo_konstruksi", "wo_app", "wo_pdkb"].includes(workflowNode) &&
    values.nomor_surat
  )
    payload.nomor_surat = values.nomor_surat;
  if (values.notes) payload.notes = values.notes;
  if (workflowNode === "energize_jaringan")
    payload.operation_result = values.operation_result;
  if (workflowNode === "energize_jaringan")
    payload.energize_status =
      values.energize_status === "Nyala sementara" ? "temporary" : "permanent";
  if (
    workflowNode === "pemasangan_tiang" ||
    workflowNode === "pelaksanaan_konstruksi"
  )
    payload.workflow_node = action.workflow_node;
  // Optional WGS84 point captured by vendor tiang on the pemasangan_tiang node.
  if (locationCoordinates)
    payload.location_coordinates = locationCoordinates;
  const path = action.path.replace("{id}", encodeURIComponent(id));
  if (
    !path.startsWith(`/api/permohonan/${encodeURIComponent(id)}/`) ||
    action.method !== "POST"
  )
    throw new Error(
      "Tindakan backend tidak dikenali. Muat ulang detail permohonan.",
    );
  return mapApplication(
    (
      await apiRequest<PermohonanResponse>(path, {
        method: "POST",
        data: payload,
      })
    ).data,
  );
}

export async function assignVendor(
  id: string,
  vendorId: string,
  vendorRole: string,
) {
  return mapApplication(
    (
      await apiRequest<PermohonanResponse>(
        `/api/permohonan/${encodeURIComponent(id)}/vendor-assignments`,
        {
          method: "POST",
          data: {
            vendor_id: vendorId,
            vendor_role: vendorRole,
          },
        },
      )
    ).data,
  );
}

export async function getVendorAccounts(role: string) {
  const vendors: Array<{ id: string; name: string; role: string }> = [];
  let page = 1;
  let maxPage = 1;
  do {
    const response = await apiRequest<
      Array<{ id: string; name: string; role: string }>
    >("/api/vendor?page=" + page + "&per_page=100");
    vendors.push(...response.data.filter((user) => user.role === role));
    maxPage = response.pagination?.max_page ?? 1;
    page++;
  } while (page <= maxPage);
  return vendors;
}
