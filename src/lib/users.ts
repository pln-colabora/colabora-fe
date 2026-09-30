import { apiClient, apiRequest } from "@/lib/api";
import type { RoleId } from "@/lib/workflow";

export type Account = {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  unit?: string;
  telp_number?: string;
  image_url?: string;
  account_document_url?: string;
  is_verified?: boolean;
};

export async function getUsers() {
  const users: Account[] = [];
  let page = 1;
  let maxPage = 1;

  do {
    const response = await apiRequest<Account[]>(
      `/api/user?page=${page}&per_page=100&sort=name&order=asc`,
    );
    users.push(...response.data);
    maxPage = response.pagination?.max_page ?? 1;
    page += 1;
  } while (page <= maxPage);

  return users;
}

export async function deleteUser(id: string) {
  return apiRequest(`/api/user/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function updateUserUnit(id: string, unit: string) {
  return apiRequest<Account>(`/api/user/${encodeURIComponent(id)}`, {
    method: "PATCH",
    data: { unit },
  });
}

export async function getAccountDocument(path: string) {
  if (!path.startsWith("/api/"))
    throw new Error("Path API dokumen akun tidak valid.");
  return (await apiClient.get<Blob>(path, { responseType: "blob" })).data;
}
