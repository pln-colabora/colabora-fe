"use client";

import { useEffect, useState, type FormEvent } from "react";

import Link from "next/link";

import { ArrowLeft, Info, LockKeyhole } from "lucide-react";

import { AppShell, canCreatePermohonan } from "@/components/dashboard/app-shell";
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
import { ROLE_STORAGE_KEY, getRole, type RoleId } from "@/lib/workflow";

const jenisByRole: Partial<Record<RoleId, string[]>> = {
  "pelayanan-pelanggan": ["JTR", "JTM / Gardu"],
  nps: ["PLG TM <5 GWNG", "PLG TM >5 GWNG"],
};

const requestTypes = ["Pasang baru", "Perubahan daya"];
const units = ["ULP Taman", "ULP Menganti", "ULP Karang Pilang"];

type FormValues = {
  customer: string;
  customerId: string;
  phone: string;
  requestType: string;
  connectionType: string;
  unit: string;
  power: string;
  location: string;
  notes: string;
};

export default function ApplicationCreatePage() {
  const [roleId, setRoleId] = useState<RoleId>("teknik");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRoleId(
      (window.localStorage.getItem(ROLE_STORAGE_KEY) as RoleId) || "teknik",
    );
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <AppShell active="create" roleId={roleId} onRoleChange={setRoleId}>
        <div role="status" className="space-y-4">
          <p>Memuat formulir permohonan...</p>
          <div className="bg-muted h-24 rounded-md" />
          <div className="bg-muted h-64 rounded-md" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="create" roleId={roleId} onRoleChange={setRoleId}>
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <Link
          href="/dashboard?view=all"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke daftar permohonan
        </Link>

        <header className="mt-5 border-b pb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Permohonan PB/PD baru
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Catat data pelanggan dan kebutuhan sambungan untuk memulai proses
            permohonan. Jenis sambungan mengikuti kewenangan peran Anda.
          </p>
        </header>

        {canCreatePermohonan(roleId) ? (
          <CreateForm roleId={roleId} />
        ) : (
          <Unauthorized roleId={roleId} />
        )}
      </div>
    </AppShell>
  );
}

function Unauthorized({ roleId }: { roleId: RoleId }) {
  const role = getRole(roleId);
  return (
    <section
      className="bg-card mt-6 rounded-lg px-5 py-4"
      aria-labelledby="unauthorized-title"
    >
      <div className="flex items-start gap-3">
        <LockKeyhole
          className="text-muted-foreground mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <h2
            id="unauthorized-title"
            className="font-display font-semibold"
          >
            Peran ini tidak berwenang membuat permohonan
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {role.lane} — {role.label} tidak membuka permohonan baru. Pembuatan
            permohonan dilakukan oleh Pelayanan Pelanggan (JTR/JTM) atau NPS
            (PLG TM).
          </p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link href="/dashboard?view=all">Lihat daftar permohonan</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function CreateForm({ roleId }: { roleId: RoleId }) {
  const connectionOptions = jenisByRole[roleId] ?? [];
  const [values, setValues] = useState<FormValues>({
    customer: "",
    customerId: "",
    phone: "",
    requestType: requestTypes[0],
    connectionType: connectionOptions[0] ?? "",
    unit: units[0],
    power: "",
    location: "",
    notes: "",
  });
  const [evidenceName, setEvidenceName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const powerUnit = values.connectionType.startsWith("PLG TM") ? "kVA" : "VA";

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
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
        <Field className="md:col-span-2">
          <Label htmlFor="customer">Nama pelanggan</Label>
          <Input
            id="customer"
            value={values.customer}
            onChange={(event) => update("customer", event.target.value)}
            placeholder="Nama pelanggan"
            className="mt-2 h-11"
            required
          />
        </Field>

        <Field>
          <Label htmlFor="customerId">ID pelanggan</Label>
          <Input
            id="customerId"
            value={values.customerId}
            onChange={(event) => update("customerId", event.target.value)}
            placeholder="53xxxxxxxxxx"
            inputMode="numeric"
            className="mt-2 h-11 font-mono"
            required
          />
        </Field>

        <Field>
          <Label htmlFor="phone">No. HP / telepon</Label>
          <Input
            id="phone"
            type="tel"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="08xxxxxxxxxx"
            className="mt-2 h-11"
            required
          />
        </Field>

        <Field>
          <Label htmlFor="requestType">Jenis permohonan</Label>
          <Select
            value={values.requestType}
            onValueChange={(value) => update("requestType", value)}
          >
            <SelectTrigger id="requestType" className="bg-background mt-2 h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {requestTypes.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <Label htmlFor="connectionType">Jenis sambungan</Label>
          <Select
            value={values.connectionType}
            onValueChange={(value) => update("connectionType", value)}
          >
            <SelectTrigger
              id="connectionType"
              className="bg-background mt-2 h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {connectionOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground mt-2 text-sm">
            Pilihan dibatasi sesuai kewenangan peran {getRole(roleId).label}.
          </p>
        </Field>

        <Field>
          <Label htmlFor="unit">Unit / ULP</Label>
          <Select
            value={values.unit}
            onValueChange={(value) => update("unit", value)}
          >
            <SelectTrigger id="unit" className="bg-background mt-2 h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <Label htmlFor="power">Daya diminta ({powerUnit})</Label>
          <Input
            id="power"
            value={values.power}
            onChange={(event) => update("power", event.target.value)}
            placeholder={powerUnit === "kVA" ? "555" : "7700"}
            inputMode="numeric"
            className="mt-2 h-11"
            required
          />
        </Field>

        <Field className="md:col-span-2">
          <Label htmlFor="location">Lokasi</Label>
          <Input
            id="location"
            value={values.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder="Jl. ... No. ..., Surabaya"
            className="mt-2 h-11"
            required
          />
        </Field>

        <Field className="md:col-span-2">
          <Label htmlFor="notes">Catatan permohonan</Label>
          <Textarea
            id="notes"
            value={values.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Catatan operasional (opsional)"
            className="bg-background mt-2 min-h-24"
          />
        </Field>
      </div>

      <div className="mt-5">
        <Label htmlFor="evidence">
          Evidence permohonan{" "}
          <span className="text-muted-foreground font-normal">(PDF/JPG/PNG)</span>
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
            Formulir lengkap dan tervalidasi. Permohonan belum tersimpan —
            integrasi penyimpanan ke API COLABORA belum tersedia.
          </span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="outline" className="min-h-11">
          <Link href="/dashboard?view=all">Batal</Link>
        </Button>
        <Button type="submit" className="min-h-11">
          Simpan permohonan
        </Button>
      </div>
    </form>
  );
}

function Field({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
