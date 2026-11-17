"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { deleteApplication } from "@/lib/applications";
import { presentApiError } from "@/lib/error-utils";

export function DeleteApplicationButton({
  id,
  number,
  returnTo,
}: {
  id: string;
  number: string;
  returnTo: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      deleting ||
      !(await confirm({
        title: "Hapus permohonan ini?",
        description: `Permohonan ${number} beserta aktivitas, riwayat, dan dokumennya akan dihapus permanen dan tidak dapat dipulihkan.`,
        confirmLabel: "Hapus permohonan",
        destructive: true,
      }))
    )
      return;

    setDeleting(true);
    try {
      await deleteApplication(id);
      toast.success("Permohonan berhasil dihapus.");
      router.replace(returnTo);
    } catch (requestError) {
      toast.error(
        presentApiError(requestError, "Permohonan tidak dapat dihapus.").message,
      );
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive mt-3"
        disabled={deleting}
        onClick={handleDelete}
      >
        {deleting ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 aria-hidden="true" />
        )}
        Hapus permohonan
      </Button>
      {dialog}
    </>
  );
}
