"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api";
import { getCurrentUser, type User } from "@/lib/auth";

// The server remains the source of truth for the signed-in user's role.
export function useSession() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(requestError);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { user, error, loading: !user && !error };
}
