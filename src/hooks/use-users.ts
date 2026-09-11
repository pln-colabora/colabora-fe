"use client";

import { useCallback, useEffect, useState } from "react";

import { getUsers } from "@/lib/users";
import type { Account } from "@/lib/users";

export function useUsers(enabled = true) {
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, reloadKey]);

  return { users, loading: !enabled || loading, error, reload };
}
