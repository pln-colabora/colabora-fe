import { apiRequest } from "@/lib/api";

export type PdkbSchedule = {
  id: string;
  date: string;
  title: string;
  permohonan_id: string | null;
  locked: boolean;
};
const path = "/api/pdkb/schedules";
export async function listPdkbSchedules(from: string, to: string) {
  return (await apiRequest<PdkbSchedule[]>(`${path}?from=${from}&to=${to}`))
    .data;
}
export async function savePdkbSchedule(
  id: string | null,
  date: string,
  title: string,
) {
  return (
    await apiRequest<PdkbSchedule>(
      id ? `${path}/${encodeURIComponent(id)}` : path,
      { method: id ? "PUT" : "POST", data: { date, title } },
    )
  ).data;
}
export async function deletePdkbSchedule(id: string) {
  await apiRequest(`${path}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
