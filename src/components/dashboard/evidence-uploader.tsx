"use client";

import { useRef, useState, type ComponentProps } from "react";

import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatFileSize } from "@/lib/utils";

export type EvidenceFileStatus = {
  state: "uploading" | "uploaded" | "failed";
  progress?: number;
};

type EvidenceUploaderProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  statuses?: Map<File, EvidenceFileStatus>;
  disabled?: boolean;
} & Pick<
  ComponentProps<"div">,
  "id" | "aria-describedby" | "aria-invalid"
>;

export function EvidenceUploader({
  files,
  onFilesChange,
  statuses = new Map(),
  disabled = false,
  ...controlProps
}: EvidenceUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(incoming: File[]) {
    const unique = new Map(
      [...files, ...incoming].map((file) => [
        `${file.name}:${file.size}:${file.lastModified}`,
        file,
      ]),
    );
    onFilesChange([...unique.values()]);
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-3">
      <div
        {...controlProps}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={cn(
          "border-border bg-background flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-5 py-6 text-center transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          dragging && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (
            !disabled &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-lg">
          <UploadCloud className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-medium">
          Tarik dan letakkan evidence di sini
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          PDF, JPG, JPEG, atau PNG · maksimal 10 MB per berkas
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Pilih berkas
        </Button>
        <Input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          disabled={disabled}
          tabIndex={-1}
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="min-w-0" aria-live="polite">
          <p className="mb-2 text-sm font-medium">
            {files.length} berkas dipilih
          </p>
          <ul className="min-w-0 space-y-2">
            {files.map((file) => {
              const status = statuses.get(file);
              return (
                <li
                  key={`${file.name}:${file.size}:${file.lastModified}`}
                  className="bg-background flex min-w-0 items-center gap-3 rounded-lg border px-3 py-3"
                >
                  <FileText
                    className="text-muted-foreground size-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                      <FileStatus status={status} />
                    </div>
                    {status?.state === "uploading" &&
                      status.progress !== undefined && (
                        <div
                          className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full"
                          role="progressbar"
                          aria-label={`Progres upload ${file.name}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={status.progress}
                        >
                          <div
                            className="bg-primary h-full transition-[width]"
                            style={{ width: `${status.progress}%` }}
                          />
                        </div>
                      )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-9 shrink-0"
                    disabled={disabled}
                    aria-label={`Hapus ${file.name}`}
                    onClick={() =>
                      onFilesChange(files.filter((item) => item !== file))
                    }
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function FileStatus({ status }: { status?: EvidenceFileStatus }) {
  if (status?.state === "uploading")
    return (
      <span className="text-primary inline-flex items-center gap-1">
        <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
        Mengunggah{status.progress !== undefined ? ` ${status.progress}%` : ""}
      </span>
    );
  if (status?.state === "uploaded")
    return (
      <span className="text-success inline-flex items-center gap-1">
        <CheckCircle2 className="size-3" aria-hidden="true" />
        Terunggah
      </span>
    );
  if (status?.state === "failed")
    return (
      <span className="text-destructive inline-flex items-center gap-1">
        <XCircle className="size-3" aria-hidden="true" />
        Gagal
      </span>
    );
  return <span className="text-muted-foreground">Siap diunggah</span>;
}
