"use client";

import { useCallback, useEffect } from "react";

import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

export function useUnsavedChanges(isDirty: boolean) {
  const { confirm, dialog } = useConfirmDialog();

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
    if (!isDirty) return Promise.resolve(true);
    return confirm({
      title: "Tinggalkan formulir?",
      description:
        "Perubahan formulir belum disimpan dan akan hilang jika Anda meninggalkan halaman.",
      confirmLabel: "Tinggalkan",
      destructive: true,
    });
  }, [confirm, isDirty]);

  return { confirmDiscard, dialog };
}
