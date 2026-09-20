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
  unit?: string;
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
  // POST /api/user honors the requested role (AccountCreateRequest). The old
  // /api/auth/register path ignored it and always created a plain "user".
  const payload: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role,
  };
  if (input.telp_number) payload.telp_number = input.telp_number;
  // Operational roles require a unit; admin/user/super-user leave it empty.
  if (input.unit) payload.unit = input.unit;

  return (
    await apiRequest<User>("/api/user", {
      method: "POST",
      data: payload,
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
