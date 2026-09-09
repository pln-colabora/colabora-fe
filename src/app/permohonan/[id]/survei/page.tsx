"use client";

import { useEffect, useState, type FormEvent } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowLeft, Eye, Info, LockKeyhole } from "lucide-react";

import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ROLE_STORAGE_KEY,
  getActivity,
  getApplications,
  getOwner,
  getRole,
  type Application,
  type RoleId,
} from "@/lib/workflow";

const conditions = [
  "Layak diperluas",
  "Perlu penguatan",
  "Perlu kajian lanjutan",
];

type SurveyValues = {
  surveyDate: string;
  officer: string;
  coordinates: string;
  condition: string;
  notes: string;
};

export default function SurveyPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const [roleId, setRoleId] = useState<RoleId>("teknik");
  const [application, setApplication] = useState<Application | undefined>(() =>
    getApplications({}).find((item) => item.id === id),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRoleId(
      (window.localStorage.getItem(ROLE_STORAGE_KEY) as RoleId) || "teknik",
    );
    setApplication(getApplications().find((item) => item.id === id));
    setReady(true);
  }, [id]);

  if (!ready) {
    return (
      <AppShell active="applications" roleId={roleId} onRoleChange={setRoleId}>
        <div role="status" className="space-y-4">
          <p>Memuat formulir survei...</p>
          <div className="bg-muted h-24 rounded-md" />
          <div className="bg-muted h-64 rounded-md" />
        </div>
      </AppShell>
    );
  }

  if (!application) {
    return (
      <AppShell active="applications" roleId={roleId} onRoleChange={setRoleId}>
        <div className="mx-auto max-w-3xl border px-6 py-16 text-center">
          <h1 className="font-display text-xl font-semibold">
            Permohonan tidak ditemukan
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Nomor permohonan tidak tersedia pada data demo.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard?view=all">Kembali ke permohonan</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const surveyActivity = getActivity("2")!;
  const ownerId = getOwner(surveyActivity, application);
  const owner = getRole(ownerId);
  const isActive = application.currentAction === "2" && !application.rejected;
  const ownsAction = ownerId === roleId;
  const isMonitoring = roleId === "super-user";

  return (
    <AppShell active="applications" roleId={roleId} onRoleChange={setRoleId}>
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <Link
          href={`/permohonan/${application.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke detail permohonan
        </Link>

        <header className="mt-5 border-b pb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Survei Perluasan Jaringan
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {application.customer} · {application.connectionType} ·{" "}
            <span className="font-mono text-xs">{application.id}</span>
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            PIC survei: {owner.lane} — {owner.label}
          </p>
        </header>

        {!isActive ? (
          <Notice
            icon={LockKeyhole}
            title="Aktivitas survei tidak aktif"
            body="Permohonan ini tidak sedang menunggu aktivitas survei. Buka detail permohonan untuk melihat tahap yang sedang berjalan."
          />
        ) : isMonitoring ? (
          <Notice
            icon={Eye}
            title="Mode monitoring"
            body={`Survei berada pada ${owner.lane} — ${owner.label}. Super User dapat memantau tanpa mengisi formulir.`}
          />
        ) : !ownsAction ? (
          <Notice
            icon={LockKeyhole}
            title="Menunggu tindakan PIC survei"
            body={`Survei dikerjakan oleh ${owner.lane} — ${owner.label} sesuai jenis sambungan ${application.connectionType}.`}
          />
        ) : (
          <SurveyForm application={application} />
        )}
      </div>
    </AppShell>
  );
}

function SurveyForm({ application }: { application: Application }) {
  const [values, setValues] = useState<SurveyValues>({
    surveyDate: "",
    officer: "",
    coordinates: "",
    condition: conditions[0],
    notes: "",
  });
  const [evidenceName, setEvidenceName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof SurveyValues>(key: K, value: SurveyValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Slicing only: penyimpanan menunggu integrasi API COLABORA.
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="surveyDate">Tanggal survei</Label>
          <Input
            id="surveyDate"
            type="date"
            value={values.surveyDate}
            onChange={(event) => update("surveyDate", event.target.value)}
            className="bg-background mt-2 h-11"
            required
          />
        </div>

        <div>
          <Label htmlFor="officer">Petugas survei</Label>
          <Input
            id="officer"
            value={values.officer}
            onChange={(event) => update("officer", event.target.value)}
            placeholder="Nama petugas"
            className="mt-2 h-11"
            required
          />
        </div>

        <div>
          <Label htmlFor="coordinates">Titik koordinat GPS</Label>
          <Input
            id="coordinates"
            value={values.coordinates}
            onChange={(event) => update("coordinates", event.target.value)}
            placeholder="-7.2575, 112.7521"
            className="mt-2 h-11 font-mono"
            required
          />
        </div>

        <div>
          <Label htmlFor="condition">Kondisi jaringan eksisting</Label>
          <Select
            value={values.condition}
            onValueChange={(value) => update("condition", value)}
          >
            <SelectTrigger
              id="condition"
              className="bg-background mt-2 h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes">Catatan hasil survei</Label>
          <Textarea
            id="notes"
            value={values.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Kondisi lapangan dan rekomendasi"
            className="bg-background mt-2 min-h-24"
            required
          />
        </div>
      </div>

      <div className="mt-5">
        <Label htmlFor="evidence">
          Evidence hasil survei{" "}
          <span className="text-muted-foreground font-normal">
            (PDF/JPG/PNG)
          </span>
        </Label>
        <Input
          id="evidence"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="mt-2 h-11"
          required
          onChange={(event) => {
            setEvidenceName(event.target.files?.[0]?.name ?? "");
            setSubmitted(false);
          }}
        />
        {evidenceName ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Berkas dipilih: {evidenceName}
          </p>
        ) : null}
      </div>

      {submitted ? (
        <div
          role="status"
          className="border-primary/30 bg-primary/10 text-primary mt-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Hasil survei lengkap dan tervalidasi. Belum tersimpan — integrasi
            penyimpanan ke API COLABORA belum tersedia.
          </span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="outline" className="min-h-11">
          <Link href={`/permohonan/${application.id}`}>Batal</Link>
        </Button>
        <Button type="submit" className="min-h-11">
          Simpan hasil survei
        </Button>
      </div>
    </form>
  );
}

function Notice({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof LockKeyhole;
  title: string;
  body: string;
}) {
  return (
    <section
      className="bg-card mt-6 rounded-lg px-5 py-4"
      aria-labelledby="survey-notice-title"
    >
      <div className="flex items-start gap-3">
        <Icon
          className="text-muted-foreground mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <h2 id="survey-notice-title" className="font-display font-semibold">
            {title}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{body}</p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link href="/dashboard?view=all">Lihat daftar permohonan</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
