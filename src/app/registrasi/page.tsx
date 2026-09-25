"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { ArrowLeft, FileUp } from "lucide-react";

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
import { getRole, type RoleId } from "@/lib/workflow";

const vendorRoles: RoleId[] = [
  "vendor-tiang",
  "vendor-konstruksi",
  "vendor-sr-app",
];

export default function VendorRegistrationPage() {
  const [role, setRole] = useState<RoleId>();
  const [files, setFiles] = useState<File[]>([]);

  return (
    <main className="bg-background min-h-dvh px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b pb-5">
          <Link href="/login" className="flex min-h-11 items-center gap-2">
            <Image
              src="/logo/colabora.png"
              alt=""
              width={32}
              height={32}
              className="size-8 object-contain"
              priority
            />
            <span className="font-display text-primary text-lg font-semibold tracking-tight">
              COLABORA
            </span>
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Masuk
          </Link>
        </header>

        <section aria-labelledby="registration-title" className="mt-8">
          <h1
            id="registration-title"
            className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Registrasi vendor
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Isi informasi akun dan lampirkan dokumen pendukung. Pendaftaran
            akan ditinjau oleh Super User.
          </p>

          <div
            className="bg-warning-surface border-warning-border text-warning mt-5 rounded-md border px-4 py-3 text-sm"
            role="status"
          >
            Pengiriman registrasi dan lampiran belum tersedia. Form ini belum
            mengirim atau menyimpan data.
          </div>

          <form className="bg-card mt-6 rounded-lg border p-5 sm:p-6">
            <fieldset className="grid min-w-0 gap-5 md:grid-cols-2">
              <legend className="font-display mb-5 text-lg font-semibold">
                Informasi akun
              </legend>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vendor-name">Nama lengkap</Label>
                <Input
                  id="vendor-name"
                  name="name"
                  autoComplete="name"
                  className="h-11"
                  placeholder="Nama pemohon"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-email">Email</Label>
                <Input
                  id="vendor-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="h-11"
                  placeholder="nama@perusahaan.co.id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-phone">No. HP / telepon</Label>
                <Input
                  id="vendor-phone"
                  name="telp_number"
                  type="tel"
                  autoComplete="tel"
                  className="h-11"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vendor-role">Peran vendor</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as RoleId)}
                >
                  <SelectTrigger id="vendor-role" className="h-11 w-full">
                    <SelectValue placeholder="Pilih peran vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorRoles.map((vendorRole) => (
                      <SelectItem key={vendorRole} value={vendorRole}>
                        {getRole(vendorRole).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-password">Kata sandi</Label>
                <Input
                  id="vendor-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className="h-11"
                  placeholder="Minimal 8 karakter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-password-confirm">
                  Konfirmasi kata sandi
                </Label>
                <Input
                  id="vendor-password-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="h-11"
                  placeholder="Ulangi kata sandi"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vendor-attachments">Lampiran</Label>
                <Input
                  id="vendor-attachments"
                  name="attachments"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="min-h-11 cursor-pointer py-2"
                  onChange={(event) =>
                    setFiles(Array.from(event.currentTarget.files ?? []))
                  }
                  aria-describedby="vendor-attachments-help"
                />
                <p
                  id="vendor-attachments-help"
                  className="text-muted-foreground text-xs"
                >
                  PDF, JPG, JPEG, atau PNG.
                </p>
                {files.length > 0 ? (
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    {files.map((file) => (
                      <li
                        key={`${file.name}:${file.size}:${file.lastModified}`}
                        className="flex min-w-0 items-center gap-2"
                      >
                        <FileUp
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">{file.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end md:col-span-2">
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/login">Kembali ke masuk</Link>
                </Button>
                <Button type="button" className="min-h-11" disabled>
                  Pendaftaran belum tersedia
                </Button>
              </div>
            </fieldset>
          </form>
        </section>
      </div>
    </main>
  );
}
