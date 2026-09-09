import { apiRequest } from "@/lib/api";
import {
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
  request_date: string;
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
  workflow_nodes: string[];
};
type ActivityLog = {
  id: string;
  created_at: string;
  action: string;
  actor: string;
  detail: string | null;
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
    requestedAt: data.request_date,
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
        sla === "overdue"
          ? "Terlambat"
          : sla === "due_soon"
            ? "Mendekati tenggat"
            : sla === "on_time"
              ? "Tepat waktu"
              : "—",
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
  }));
}
export async function getApplicationHistory(id: string) {
  const { data } = await apiRequest<ActivityLog[]>(
    `/api/permohonan/${encodeURIComponent(id)}/logs`,
  );
  return data
    .map((log) => ({
      id: log.id,
      at: log.created_at,
      title: log.detail || log.action,
      by: log.actor,
    }))
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
        body: JSON.stringify(payload),
      })
    ).data,
  );
}
export async function uploadEvidence(file: File) {
  const body = new FormData();
  body.set("file", file);
  body.set("type", "evidence");
  return (
    await apiRequest<DocumentResponse>("/api/documents", {
      method: "POST",
      body,
    })
  ).data;
}
export async function submitAction(
  id: string,
  action: AvailableAction,
  values: Record<string, string>,
  documentIds: string[],
) {
  const payload: Record<string, unknown> = { document_ids: documentIds };
  if (action.workflow_node === "survei")
    payload.surveyed_at = values.surveyed_at;
  if (action.workflow_node === "rab_kko_kkf")
    payload.kebutuhan_tiang = values.kebutuhan_tiang === "Ya";
  if (
    action.workflow_node === "permohonan_perluasan" ||
    action.workflow_node === "nps_delegation"
  )
    payload.nps_delegation_status =
      values.nps_delegation_status === "Didelegasikan"
        ? "delegated"
        : "returned";
  if (action.workflow_node === "wo_konstruksi")
    payload.perlu_pdkb = values.perlu_pdkb === "Ya";
  if (
    action.workflow_node === "reservasi_material" ||
    action.workflow_node === "tera_app"
  ) {
    if (values.reservation_notes)
      payload.reservation_notes = values.reservation_notes;
    if (values.tera_notes) payload.tera_notes = values.tera_notes;
  } else if (values.notes) payload.notes = values.notes;
  if (action.workflow_node === "energize_jaringan")
    payload.operation_result = values.operation_result;
  if (
    action.workflow_node === "pemasangan_tiang" ||
    action.workflow_node === "pelaksanaan_konstruksi"
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
        body: JSON.stringify(payload),
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
          body: JSON.stringify({
            vendor_id: vendorId,
            vendor_role: vendorRole,
          }),
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
