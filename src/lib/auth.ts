"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { apiRequest, ApiError, clearSession, saveTokens } from "@/lib/api";
import type { RoleId } from "@/lib/workflow";

export type User = {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  unit?: string;
};

export async function login(email: string, password: string) {
  const { data } = await apiRequest<{
    access_token: string;
    refresh_token: string;
  }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false,
  );
  saveTokens(data);
  try {
    return (await apiRequest<User>("/api/user/me")).data;
  } catch (error) {
    clearSession();
    throw error;
  }
}

export async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
  }
  clearSession();
}

// Each page validates the session with the server; browser storage never supplies a role.
export function useSession() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    apiRequest<User>("/api/user/me")
      .then(({ data }) => {
        if (!cancelled) setUser(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401)
          router.replace("/login");
        else
          setError(
            error instanceof Error ? error.message : "Gagal memuat akun.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [router]);
  return { user, error };
}
