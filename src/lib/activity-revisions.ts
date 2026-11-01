import { apiRequest } from "@/lib/api";

export type RevisionDocument = {
  id: string;
  original_filename: string;
  source: string;
  type: string;
};
export type ActivityDetail = {
  revision: number;
  payload: Record<string, unknown>;
  documents: RevisionDocument[];
};
export type ActivityRevision = {
  revision: number;
  payload: Record<string, unknown>;
  document_ids: string[];
  recorded_by: string;
  created_at: string;
};
const base = (id: string) => `/api/permohonan/${encodeURIComponent(id)}`;
export async function getRevisionContext(id: string, node: string) {
  const path = `${base(id)}/activities/${encodeURIComponent(node)}`;
  const [current, history] = await Promise.all([
    apiRequest<ActivityDetail>(path),
    apiRequest<ActivityRevision[]>(`${path}/revisions`),
  ]);
  return { current: current.data, history: history.data };
}
export async function saveActivityRevision(
  id: string,
  node: string,
  expected: number,
  documents: string[],
  survey?: { surveyed_at: string; notes: string },
) {
  await apiRequest(
    `${base(id)}/${node === "survei" ? "survei" : "wo-vendor/konstruksi/documents"}`,
    {
      method: "PUT",
      data: { expected_revision: expected, document_ids: documents, ...survey },
    },
  );
}
