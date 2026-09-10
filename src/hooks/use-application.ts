"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getApplication,
  getApplicationDocuments,
  getApplicationHistory,
} from "@/lib/applications";
import type { Application } from "@/lib/workflow";

export function useApplication(
  id: string,
  enabled = true,
  includeRelated = false,
) {
  const [application, setApplication] = useState<Application>();
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!enabled || !id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setRelatedError("");
    getApplication(id)
      .then(async (data) => {
        if (cancelled) return;
        setApplication(data);
        setLoading(false);
        if (!includeRelated) return;

        setRelatedLoading(true);
        try {
          const [documents, history] = await Promise.all([
            getApplicationDocuments(id),
            getApplicationHistory(id),
          ]);
          if (!cancelled)
            setApplication((current) =>
              current ? { ...current, documents, history } : current,
            );
        } catch (requestError) {
          if (!cancelled)
            setRelatedError(
              requestError instanceof Error
                ? requestError.message
                : "Gagal memuat dokumen dan riwayat.",
            );
        } finally {
          if (!cancelled) setRelatedLoading(false);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setApplication(undefined);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Gagal memuat detail.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, id, includeRelated, reloadKey]);

  return {
    application,
    setApplication,
    loading: !enabled || loading,
    error,
    relatedLoading,
    relatedError,
    reload,
  };
}
