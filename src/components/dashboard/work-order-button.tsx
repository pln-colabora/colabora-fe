"use client";

import { Download, LoaderCircle } from "lucide-react";

import { ActivityExportButton } from "@/components/dashboard/activity-export-button";
import { Button } from "@/components/ui/button";
import { useDocumentActions } from "@/hooks/use-document-actions";
import type { DocumentItem } from "@/lib/workflow";

// Download button for a work-order (WO) row on the timeline.
// - The team that owns the WO generates the PDF (POST export, owner-only).
// - Every other role downloads the generated PDF from the document list (GET).
export function WorkOrderButton({
  applicationId,
  applicationNumber,
  workflowNode,
  canGenerate,
  file,
}: {
  applicationId: string;
  applicationNumber: string;
  workflowNode: string;
  canGenerate: boolean;
  /** The generated WO PDF, if the owner has already produced it. */
  file?: DocumentItem;
}) {
  const { activeAction, downloadDocument } = useDocumentActions();

  if (canGenerate) {
    return (
      <ActivityExportButton
        applicationId={applicationId}
        applicationNumber={applicationNumber}
        workflowNode={workflowNode}
        compact
      />
    );
  }

  const busy = !!file && activeAction?.documentId === file.id;
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="size-8"
      disabled={!file || !!activeAction}
      aria-label={file ? "Unduh WO" : "WO belum dibuat"}
      title={file ? "Unduh WO" : "File WO belum dibuat oleh pembuatnya"}
      onClick={() => file && void downloadDocument(file, "File WO")}
    >
      {busy ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        <Download aria-hidden="true" />
      )}
    </Button>
  );
}
