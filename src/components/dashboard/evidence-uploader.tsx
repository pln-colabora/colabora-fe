"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import {
  Camera,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Trash2,
  UploadCloud,
  XCircle,
  X,
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
  selectionMode?: "single" | "multiple";
  enableCamera?: boolean;
  fileLabel?: string;
  helpText?: string;
} & Pick<
  ComponentProps<"div">,
  "id" | "aria-describedby" | "aria-invalid" | "aria-labelledby"
>;

export function EvidenceUploader({
  files,
  onFilesChange,
  statuses = new Map(),
  disabled = false,
  selectionMode = "multiple",
  enableCamera = false,
  fileLabel = "evidence",
  helpText = "PDF, JPG, JPEG, atau PNG · maksimal 10 MB per berkas",
  ...controlProps
}: EvidenceUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const singleFile = selectionMode === "single";

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function addFiles(incoming: File[]) {
    if (singleFile) {
      if (incoming.length > 0) onFilesChange(incoming.slice(0, 1));
      return;
    }
    const unique = new Map(
      [...files, ...incoming].map((file) => [
        `${file.name}:${file.size}:${file.lastModified}`,
        file,
      ]),
    );
    onFilesChange([...unique.values()]);
  }

  async function openCamera() {
    if (disabled) return;
    const requestId = ++cameraRequestRef.current;
    setCameraError(null);
    setCameraStarting(true);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError(
        "Kamera tidak dapat diakses. Periksa izin kamera atau gunakan Pilih berkas.",
      );
    } finally {
      setCameraStarting(false);
    }
  }

  function stopCamera() {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
    setCameraStarting(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Foto gagal dibuat. Coba ambil foto lagi.");
        return;
      }
      addFiles([
        new File([blob], `foto-lokasi-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        }),
      ]);
      stopCamera();
    }, "image/jpeg", 0.92);
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-2">
      <div
        {...controlProps}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={cn(
          "border-border bg-background flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center transition-colors sm:min-h-36",
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
          Tarik dan letakkan {fileLabel} di sini
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {helpText}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Pilih berkas
        </Button>
        {enableCamera ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              void openCamera();
            }}
          >
            <Camera aria-hidden="true" />
            Ambil foto
          </Button>
        ) : null}
        <Input
          ref={inputRef}
          type="file"
          multiple={!singleFile}
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

      {enableCamera && cameraOpen ? (
        <div
          className="border-border bg-background space-y-3 rounded-lg border p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="camera-dialog-title"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="camera-dialog-title" className="text-sm font-medium">
              Ambil foto lokasi
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Tutup kamera"
              onClick={stopCamera}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <div className="bg-muted aspect-video overflow-hidden rounded-md">
            <video
              ref={videoRef}
              className="size-full object-cover"
              autoPlay
              playsInline
              muted
              aria-label="Pratinjau kamera"
            />
          </div>
          {cameraStarting ? (
            <p className="text-muted-foreground text-sm" role="status">
              Meminta akses kamera...
            </p>
          ) : null}
          {cameraError ? (
            <p className="text-destructive text-sm" role="alert">
              {cameraError}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={stopCamera}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={capturePhoto}
              disabled={cameraStarting || !streamRef.current}
            >
              <Camera aria-hidden="true" />
              Ambil foto
            </Button>
          </div>
        </div>
      ) : null}

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
