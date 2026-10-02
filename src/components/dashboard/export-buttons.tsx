"use client";

import { useState } from "react";

import { FileSpreadsheet, FileText, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  exportApplicationsPdf,
  exportApplicationsXlsx,
} from "@/lib/export-applications";
import type { Application, RoleId } from "@/lib/workflow";

type ExportKind = "xlsx" | "pdf";

const kindLabel: Record<ExportKind, string> = { xlsx: "Excel", pdf: "PDF" };

// Exports exactly the rows currently shown in the list (filters included).
export function ExportButtons({
  applications,
  roleId,
  scope,
}: {
  applications: Application[];
  roleId: RoleId;
  scope: string[];
}) {
  const [busy, setBusy] = useState<ExportKind | null>(null);

  async function run(kind: ExportKind) {
    setBusy(kind);
    try {
      const { fileName } =
        kind === "xlsx"
          ? await exportApplicationsXlsx(applications, roleId)
          : await exportApplicationsPdf(applications, roleId, scope);
      toast.success(`File ${kindLabel[kind]} diunduh`, {
        description: `${fileName} · ${applications.length} permohonan`,
      });
    } catch {
      toast.error(`Gagal membuat file ${kindLabel[kind]}. Coba lagi.`);
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null || applications.length === 0;
  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label="Ekspor daftar permohonan"
    >
      {(["xlsx", "pdf"] as const).map((kind) => (
        <Button
          key={kind}
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={disabled}
          onClick={() => void run(kind)}
          aria-label={`Ekspor daftar ke ${kindLabel[kind]}`}
        >
          {busy === kind ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : kind === "xlsx" ? (
            <FileSpreadsheet aria-hidden="true" />
          ) : (
            <FileText aria-hidden="true" />
          )}
          {kindLabel[kind]}
        </Button>
      ))}
    </div>
  );
}
