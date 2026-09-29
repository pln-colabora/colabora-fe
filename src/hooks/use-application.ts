"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getApplication,
  getApplicationActivity,
  getApplicationDocuments,
  getApplicationHistory,
} from "@/lib/applications";
import type { Application } from "@/lib/workflow";

type ActivityInputs = Record<string, Record<string, unknown>>;

export function useApplication(
  id: string,
  enabled = true,
  includeRelated = false,
) {
  const [application, setApplication] = useState<Application>();
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<unknown>(null);
  const [activityInputs, setActivityInputs] = useState<ActivityInputs>({});
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!enabled || !id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRelatedError(null);
    setActivityInputs({});
    getApplication(id)
      .then(async (data) => {
        if (cancelled) return;
        setApplication(data);
        setLoading(false);
        if (!includeRelated) return;

        setRelatedLoading(true);
        try {
          const completedNodes = data.nodes.filter(
            (node) => node.status === "completed",
          );
          const [documents, history, activityResults] = await Promise.all([
            getApplicationDocuments(id),
            getApplicationHistory(id),
            Promise.all(
              completedNodes.map(async (node) => ({
                workflowNode: node.workflow_node,
                inputs: await getApplicationActivity(id, node.workflow_node),
              })),
            ),
          ]);
          if (!cancelled) {
            setActivityInputs(
              Object.fromEntries(
                activityResults.map(({ workflowNode, inputs }) => [
                  workflowNode,
                  inputs,
                ]),
              ),
            );
            setApplication((current) =>
              current
                ? {
                    ...current,
                    documents,
                    history,
                    updatedAt: history[0]?.at ?? current.updatedAt,
                  }
                : current,
            );
          }
        } catch (requestError) {
          if (!cancelled)
            setRelatedError(requestError);
        } finally {
          if (!cancelled) setRelatedLoading(false);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setApplication(undefined);
          setError(requestError);
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
    activityInputs,
    reload,
  };
}
