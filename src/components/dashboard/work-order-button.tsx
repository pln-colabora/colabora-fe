"use client";

import { Download, LoaderCircle } from "lucide-react";

import { ActivityExportButton } from "@/components/dashboard/activity-export-button";
import { Button } from "@/components/ui/button";
import { useDocumentActions } from "@/hooks/use-document-actions";
import { getWorkOrderAction, type DocumentItem } from "@/lib/workflow";

// Download button for a work-order (WO) row on the timeline. The PDF is generated
// when the WO form is saved, so everyone downloads the existing file (GET) from
// the document list. Only the owning team can generate it from here (POST).
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
  const action = getWorkOrderAction(canGenerate, file);

  // Safety net for the owner: a WO saved before its PDF was generated at submit
  // (or whose generation failed) can still be produced from here.
  if (action === "generate") {
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
      disabled={action !== "download" || !!activeAction}
      aria-label={file ? "Unduh WO" : "WO belum tersedia"}
      title={file ? "Unduh WO" : "File WO belum tersedia"}
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
