"use client";

import { useState } from "react";

import { toast } from "sonner";

import { getApplicationDocument } from "@/lib/applications";
import type { DocumentItem } from "@/lib/workflow";

type DocumentAction = {
  documentId: string;
  type: "open" | "download";
};

function getDocumentErrorMessage(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message ===
      "Tidak dapat menghubungi API COLABORA. Periksa koneksi lalu coba lagi."
  ) {
    return "File belum dapat diakses karena layanan penyimpanan tidak tersedia dari jaringan ini.";
  }

  return error instanceof Error ? error.message : fallback;
}

export function useDocumentActions(applicationId: string) {
  const [activeAction, setActiveAction] = useState<DocumentAction>();

  async function openDocument(document: DocumentItem) {
    const previewWindow = window.open("about:blank", "_blank");
    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = "Memuat evidence...";
    }
    setActiveAction({ documentId: document.id, type: "open" });
    try {
      const blob = await getApplicationDocument(applicationId, document.id);
      const objectUrl = URL.createObjectURL(blob);
      if (previewWindow) previewWindow.location.replace(objectUrl);
      else {
        URL.revokeObjectURL(objectUrl);
        toast.error("Browser memblokir tab baru. Izinkan pop-up lalu coba lagi.");
        return;
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      previewWindow?.close();
      toast.error(getDocumentErrorMessage(error, "Evidence gagal dibuka."));
    } finally {
      setActiveAction(undefined);
    }
  }

  async function downloadDocument(document: DocumentItem) {
    setActiveAction({ documentId: document.id, type: "download" });
    try {
      const blob = await getApplicationDocument(applicationId, document.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = document.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      toast.success("Evidence mulai diunduh.");
    } catch (error) {
      toast.error(getDocumentErrorMessage(error, "Evidence gagal diunduh."));
    } finally {
      setActiveAction(undefined);
    }
  }

  return { activeAction, openDocument, downloadDocument };
}
