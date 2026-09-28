import { apiRequest, clearSession, saveTokens } from "@/lib/api";
import { roles, type RoleId } from "@/lib/workflow";

export type User = {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  unit?: string;
  is_verified?: boolean;
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

export type RegistrationInput = {
  name: string;
  email: string;
  password: string;
  telp_number?: string;
  document: File;
};

export async function registerAccount(input: RegistrationInput) {
  const body = new FormData();
  body.set("name", input.name);
  body.set("email", input.email);
  body.set("password", input.password);
  if (input.telp_number) body.set("telp_number", input.telp_number);
  body.set("document", input.document);

  return (
    await apiRequest<User>(
      "/api/auth/register",
      { method: "POST", data: body },
      false,
    )
  ).data;
}

export async function getAccountRoles() {
  const knownRoles = new Set<string>(roles.map(({ id }) => id));
  const { data } = await apiRequest<string[]>("/api/auth/roles");
  return data.filter((role): role is RoleId => knownRoles.has(role));
}

export async function verifyUserAccount(id: string, role: RoleId) {
  return (
    await apiRequest<Pick<User, "id" | "email" | "is_verified" | "role">>(
      `/api/auth/verify/${encodeURIComponent(id)}`,
      { method: "POST", data: { role } },
    )
  ).data;
}

export async function sendPasswordReset(email: string) {
  return apiRequest(
    "/api/auth/send-password-reset",
    {
      method: "POST",
      data: { email },
    },
    false,
  );
}

export async function resetPassword(token: string, newPassword: string) {
  return apiRequest(
    "/api/auth/reset-password",
    {
      method: "POST",
      data: { token, new_password: newPassword },
    },
    false,
  );
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
