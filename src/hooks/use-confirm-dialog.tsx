"use client";

import { useCallback, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ConfirmationOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PendingConfirmation = ConfirmationOptions & {
  resolve: (confirmed: boolean) => void;
};

export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);

  const confirm = useCallback((options: ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending((current) => {
        current?.resolve(false);
        return { ...options, resolve };
      });
    });
  }, []);

  const close = useCallback((open: boolean) => {
    if (open) return;
    setPending((current) => {
      current?.resolve(false);
      return null;
    });
  }, []);

  const accept = useCallback(() => {
    setPending((current) => {
      current?.resolve(true);
      return null;
    });
  }, []);

  const dialog = (
    <AlertDialog open={!!pending} onOpenChange={close}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          <AlertDialogDescription>{pending?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{pending?.cancelLabel ?? "Batal"}</AlertDialogCancel>
          <AlertDialogAction
            onClick={accept}
            className={cn(pending?.destructive && "bg-destructive text-white hover:bg-destructive/90")}
          >
            {pending?.confirmLabel ?? "Lanjutkan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
