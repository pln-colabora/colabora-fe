"use client";

import { useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ROLE_STORAGE_KEY,
  getRole,
  getRoleActivities,
  roles,
  type RoleId,
} from "@/lib/workflow";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState<RoleId>("teknik");
  const role = getRole(roleId);
  const roleActivities = getRoleActivities(roleId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(ROLE_STORAGE_KEY, roleId);
    router.push("/dashboard?view=mine");
  }

  return (
    <form
      className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="demo-role">Masuk demo sebagai</Label>
        <select
          id="demo-role"
          value={roleId}
          onChange={(event) => setRoleId(event.target.value as RoleId)}
          className="border-input bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.lane} — {role.label}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-xs leading-5">
          Role dapat diganti kembali dari ruang kerja untuk mencoba alur lintas
          PIC.
        </p>
        <div className="border-l-2 pl-3 text-xs leading-5">
          <p className="font-medium">
            {role.lane} — {role.label}
          </p>
          {roleId === "super-user" ? (
            <p className="text-muted-foreground mt-1">
              Memantau seluruh permohonan dan detail workflow tanpa mengubah
              aktivitas.
            </p>
          ) : (
            <p className="text-muted-foreground mt-1">
              Menangani {roleActivities.length} aktivitas:{" "}
              {roleActivities.map((activity) => activity.shortLabel).join(", ")}
              .
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@perusahaan.co.id"
          defaultValue="demo@colabora.local"
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Kata sandi</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            defaultValue="demo1234"
            className="h-11 pr-11"
            required
          />
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md outline-none focus-visible:ring-2 focus-visible:ring-inset"
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full">
        Masuk
      </Button>
    </form>
  );
}
