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
  current_stage: StageId;
  status: string;
  kebutuhan_tiang: boolean | null;
  perlu_pdkb: boolean | null;
  nps_delegation_status: "delegated" | "returned" | null;
  workflow_nodes: WorkflowNode[];
  available_actions: AvailableAction[];
};
type DocumentResponse = {
  id: string;
  original_filename: string;
  created_at: string;
  mime_type: string;
  size_bytes: number;
  workflow_nodes: string[];
};
type ActivityLog = {
  id: string;
  created_at: string;
  actor: string;
  detail: string | null;
  workflow_node: string | null;
};

export function mapApplication(data: PermohonanResponse): Application {
  const nodes = data.workflow_nodes ?? [];
  const active = nodes.filter(
    (node) => node.status === "available" || node.status === "in_progress",
  );
  const slaNode =
    active.find((node) => node.sla_status === "overdue") ??
    active.find((node) => node.sla_status === "due_soon") ??
    active.find((node) => node.sla_status === "on_time");
  const sla = slaNode?.sla_status;
  // Active nodes may carry a deadline without a graded sla_status ("none");
  // surface that date so the SLA column is informative instead of just "—".
  const deadline =
    slaNode?.sla_deadline ??
    active.find((node) => node.sla_deadline)?.sla_deadline ??
    nodes.find(
      (node) =>
        node.stage_number === data.current_stage && Boolean(node.sla_deadline),
    )?.sla_deadline ??
    null;
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
    power: "—",
    requestedAt: data.request_date ?? "",
    updatedAt: "—",
    currentAction:
      active.map((node) => nodeActions[node.workflow_node]).find(Boolean) ??
      null,
    currentStage: data.current_stage,
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
      tone:
        data.status === "completed"
          ? "done"
          : sla === "overdue"
            ? "late"
            : sla === "due_soon"
              ? "due"
              : "safe",
      label:
        data.status === "completed"
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
    availableActions: data.available_actions ?? [],
    history: [],
    documents: [],
  };
}

export async function getApplications() {
  // The existing dashboard filters and totals cover the full visible list, not just page one.
  const applications: Application[] = [];
  let page = 1;
  let maxPage = 1;
  do {
    const response = await apiRequest<PermohonanResponse[]>(
      `/api/permohonan?page=${page}&per_page=100`,
    );
    applications.push(...response.data.map(mapApplication));
    maxPage = response.pagination?.max_page ?? 1;
    page++;
  } while (page <= maxPage);
  return applications;
}

export async function getApplication(id: string) {
  const path = `/api/permohonan/${encodeURIComponent(id)}`;
  const { data } = await apiRequest<PermohonanResponse>(path);
  return mapApplication(data);
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
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

export type CreateApplicationRequest = {
  jenis_permohonan: string;
  jenis_sambungan: string;
  pelanggan_nama: string;
  pelanggan_alamat: string;
  pelanggan_no_hp: string;
  ulp_unit?: string;
};
export async function createApplication(payload: CreateApplicationRequest) {
  return mapApplication(
    (
      await apiRequest<PermohonanResponse>("/api/permohonan", {
        method: "POST",
        data: payload,
      })
    ).data,
  );
}
export async function uploadEvidence(
  file: File,
  onProgress?: (percentage: number) => void,
) {
  const body = new FormData();
  body.set("file", file);
  body.set("type", "evidence");
  return (
    await apiRequest<DocumentResponse>("/api/documents", {
      method: "POST",
      data: body,
      onUploadProgress: (event) => {
        if (event.total)
          onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
      // The current gateway omits CORS headers on its 413 response, so the
      // browser reports that response as a network failure.
      networkErrorMessage:
        "Ukuran konten terlalu besar. Kurangi ukuran berkas lalu coba lagi.",
    })
  ).data;
}

export async function getApplicationDocument(
  applicationId: string,
  documentId: string,
) {
  const path = `/api/permohonan/${encodeURIComponent(
    applicationId,
  )}/documents/${encodeURIComponent(documentId)}`;
  return (await apiClient.get<Blob>(path, { responseType: "blob" })).data;
}
export async function submitAction(
  id: string,
  action: AvailableAction,
  values: Record<string, string>,
  documentIds: string[],
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
  if (workflowNode === "wo_konstruksi")
    payload.perlu_pdkb = values.perlu_pdkb === "Ya";
  if (
    workflowNode === "reservasi_material" ||
    workflowNode === "tera_app"
  ) {
    if (values.reservation_notes)
      payload.reservation_notes = values.reservation_notes;
    if (values.tera_notes) payload.tera_notes = values.tera_notes;
  } else if (values.notes) payload.notes = values.notes;
  if (workflowNode === "energize_jaringan")
    payload.operation_result = values.operation_result;
  if (
    workflowNode === "pemasangan_tiang" ||
    workflowNode === "pelaksanaan_konstruksi"
  )
    payload.workflow_node = action.workflow_node;
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
    >("/api/user?page=" + page + "&per_page=100");
    vendors.push(...response.data.filter((user) => user.role === role));
    maxPage = response.pagination?.max_page ?? 1;
    page++;
  } while (page <= maxPage);
  return vendors;
}
