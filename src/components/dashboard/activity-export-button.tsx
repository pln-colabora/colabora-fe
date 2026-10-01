"use client";

import { useState } from "react";

import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportApplicationActivity } from "@/lib/applications";
import { presentApiError } from "@/lib/error-utils";

export function ActivityExportButton({
  applicationId,
  applicationNumber,
  workflowNode,
  compact = false,
}: {
  applicationId: string;
  applicationNumber: string;
  workflowNode: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function exportPdf() {
    setLoading(true);
    try {
      const blob = await exportApplicationActivity(
        applicationId,
        workflowNode,
      );
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = `permohonan-${applicationNumber}-${workflowNode}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      toast.success("Form aktivitas mulai diunduh sebagai PDF.");
    } catch (error) {
      toast.error(
        presentApiError(error, "Form aktivitas gagal diekspor.").message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon-sm" : "default"}
      className={compact ? "size-8" : "min-h-11"}
      disabled={loading}
      aria-label={`Unduh laporan ${workflowNode}`}
      title="Unduh laporan aktivitas"
      onClick={() => void exportPdf()}
    >
      {loading ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        <Download aria-hidden="true" />
      )}
      {!compact && "Unduh Laporan"}
    </Button>
  );
}