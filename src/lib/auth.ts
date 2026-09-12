import { apiRequest, clearSession, saveTokens } from "@/lib/api";
import type { RoleId } from "@/lib/workflow";

export type User = {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  unit?: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  telp_number?: string;
  role: RoleId;
};

export async function getCurrentUser() {
  return (await apiRequest<User>("/api/user/me")).data;
}

export async function login(email: string, password: string) {
  const { data } = await apiRequest<{
    access_token: string;
    refresh_token: string;
  }>("/api/auth/login", { method: "POST", data: { email, password } }, false);
  saveTokens(data);
  try {
    return await getCurrentUser();
  } catch (error) {
    clearSession();
    throw error;
  }
}

export async function createUser(input: CreateUserInput) {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("email", input.email);
  formData.append("password", input.password);
  formData.append("role", input.role);
  if (input.telp_number) formData.append("telp_number", input.telp_number);

  return (
    await apiRequest<User>("/api/auth/register", {
      method: "POST",
      data: formData,
    })
  ).data;
}

export function logout() {
  // Start revocation while the access token is still available. Local logout
  // must remain usable when the API is unreachable or the token has expired.
  const revokeRequest = apiRequest("/api/auth/logout", {
    method: "POST",
  }).catch(() => undefined);
  clearSession();
  return revokeRequest;
}
