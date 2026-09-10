"use client";

import { useCallback, useEffect, useState } from "react";

import { getApplications } from "@/lib/applications";
import type { Application } from "@/lib/workflow";

export function useApplications(enabled = true) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getApplications()
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Gagal memuat permohonan.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, reloadKey]);

  return { applications, loading: !enabled || loading, error, reload };
}
