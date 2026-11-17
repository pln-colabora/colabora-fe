"use client";

import { useMemo, useState } from "react";

import { CheckCircle2, CircleAlert, LoaderCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import { EvidenceUploader } from "@/components/dashboard/evidence-uploader";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { continueDraft, saveDraft } from "@/lib/applications";
import {
  bulkDraftPayload,
  connectionTypesByRole,
  draftContinueProblem,
} from "@/lib/draft-continue";
import { presentApiError } from "@/lib/error-utils";
import type { Application, RoleId } from "@/lib/workflow";

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const acceptedFile = /\.(pdf|jpe?g|png|xlsx?)$/i;

type Outcome = { state: "done" } | { state: "failed"; message: string };

// Continues several imported drafts that share one jenis sambungan and one set
// of evidence (e.g. ten units of the same customer). The API continues one
// draft per request, so each draft is saved and continued in turn with its own
// copy of the files; a failure never stops the remaining drafts.
export function BulkContinueDialog({
  open,
  onOpenChange,
  drafts,
  roleId,
  onFinished,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: Application[];
  roleId: RoleId;
  onFinished: (continuedIds: string[]) => void;
}) {
  const connectionOptions = connectionTypesByRole[roleId] ?? [];
  const [connectionType, setConnectionType] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Map<string, Outcome>>(new Map());

  const problems = useMemo(
    () => new Map(drafts.map((draft) => [draft.id, draftContinueProblem(draft)])),
    [drafts],
  );
  const ready = drafts.filter(
    (draft) => !problems.get(draft.id) && outcomes.get(draft.id)?.state !== "done",
  );
  const finished = outcomes.size > 0 && !running;

  function reset() {
    setConnectionType("");
    setFiles([]);
    setMessage("");
    setOutcomes(new Map());
    setCurrent(null);
  }

  async function run() {
    if (!connectionType) return setMessage("Pilih jenis sambungan.");
    if (!files.length) return setMessage("Unggah minimal satu evidence.");
    const invalid = files.find(
      (file) => file.size > MAX_FILE_SIZE || !acceptedFile.test(file.name),
    );
    if (invalid)
      return setMessage(
        `${invalid.name}: evidence harus PDF, JPG, PNG, XLS, atau XLSX, maksimal 30 MB.`,
      );
    setMessage("");
    setRunning(true);
    const next = new Map(outcomes);
    const continued: string[] = [];
    for (const draft of ready) {
      setCurrent(draft.id);
      try {
        await saveDraft(draft.id, bulkDraftPayload(draft, connectionType));
        await continueDraft(draft.id, files);
        next.set(draft.id, { state: "done" });
        continued.push(draft.id);
      } catch (error) {
        next.set(draft.id, {
          state: "failed",
          message: presentApiError(error, "Draft gagal dilanjutkan.").message,
        });
      }
      setOutcomes(new Map(next));
    }
    setCurrent(null);
    setRunning(false);
    const failed = [...next.values()].filter((item) => item.state === "failed").length;
    if (!failed) toast.success(`${continued.length} draft berhasil dilanjutkan.`);
    else
      toast.warning(
        `${continued.length} draft dilanjutkan, ${failed} gagal. Lihat rinciannya di dialog.`,
      );
    if (continued.length) onFinished(continued);
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (running) return;
        if (!value) reset();
        onOpenChange(value);
      }}
    >
      <AlertDialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-hidden p-0">
        <AlertDialogHeader className="border-b px-5 pt-5 pb-4 text-left sm:px-6">
          <AlertDialogTitle>Lanjutkan {drafts.length} draft</AlertDialogTitle>
          <AlertDialogDescription>
            Jenis sambungan dan evidence di bawah dipakai untuk semua draft
            terpilih. Data lain diambil dari masing-masing draft.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[calc(90dvh-11rem)] space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          <div>
            <label htmlFor="bulk-connection" className="text-sm font-medium">
              Jenis sambungan
            </label>
            <Select
              value={connectionType}
              onValueChange={setConnectionType}
              disabled={running || finished}
            >
              <SelectTrigger id="bulk-connection" className="bg-background mt-2 h-11 w-full">
                <SelectValue placeholder="Pilih jenis sambungan" />
              </SelectTrigger>
              <SelectContent>
                {connectionOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p id="bulk-evidence" className="text-sm font-medium">
              Evidence permohonan
            </p>
            <div className="mt-2">
              <EvidenceUploader
                aria-labelledby="bulk-evidence"
                files={files}
                disabled={running || finished}
                onFilesChange={setFiles}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">
              Draft terpilih ({ready.length} siap dari {drafts.length})
            </p>
            <ul className="mt-2 divide-y rounded-md border text-sm">
              {drafts.map((draft) => {
                const problem = problems.get(draft.id);
                const outcome = outcomes.get(draft.id);
                return (
                  <li key={draft.id} className="flex items-start gap-3 px-3 py-2.5">
                    <DraftState
                      busy={current === draft.id}
                      problem={problem}
                      outcome={outcome}
                    />
                    <div className="min-w-0">
                      <p className="font-medium">
                        <span className="font-mono">{draft.number}</span> ·{" "}
                        {draft.customer}
                      </p>
                      <p
                        className={`mt-0.5 ${
                          outcome?.state === "failed" || problem
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {outcome?.state === "failed"
                          ? outcome.message
                          : outcome?.state === "done"
                            ? "Berhasil dilanjutkan."
                            : problem
                              ? `${problem} Perbaiki lewat Lengkapi.`
                              : draft.location}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {message && (
            <p role="alert" className="text-destructive text-sm">
              {message}
            </p>
          )}
        </div>

        <AlertDialogFooter className="border-t px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={running}
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            {finished ? "Tutup" : "Batal"}
          </Button>
          {!finished || ready.length > 0 ? (
            <Button
              type="button"
              className="min-h-11"
              disabled={running || !ready.length}
              onClick={() => void run()}
            >
              {running && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {running
                ? "Memproses..."
                : finished
                  ? `Coba lagi ${ready.length} draft`
                  : `Lanjutkan ${ready.length} draft`}
            </Button>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DraftState({
  busy,
  problem,
  outcome,
}: {
  busy: boolean;
  problem: string | null | undefined;
  outcome: Outcome | undefined;
}) {
  if (busy)
    return (
      <LoaderCircle
        className="text-primary mt-0.5 size-4 shrink-0 animate-spin"
        aria-label="Memproses"
      />
    );
  if (outcome?.state === "done")
    return <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-label="Berhasil" />;
  if (outcome?.state === "failed")
    return <XCircle className="text-destructive mt-0.5 size-4 shrink-0" aria-label="Gagal" />;
  if (problem)
    return <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-label="Belum siap" />;
  return <span className="mt-0.5 size-4 shrink-0" aria-hidden="true" />;
}
