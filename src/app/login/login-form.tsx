"use client";

import { useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { Eye, EyeOff } from "lucide-react";

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
import { login } from "@/lib/auth";

export function LoginForm({
  accounts = [],
}: {
  accounts?: Array<{ name: string; email: string; password: string }>;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      setPassword("");
      router.replace("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
      onSubmit={handleSubmit}
    >
      {accounts.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="development-account">Akun development</Label>
          <Select
            onValueChange={(email) => {
              const account = accounts.find((item) => item.email === email);
              if (account) {
                setEmail(account.email);
                setPassword(account.password);
              }
            }}
            disabled={busy}
          >
            <SelectTrigger
              id="development-account"
              className="bg-background h-11 w-full"
            >
              <SelectValue placeholder="Pilih akun pengujian" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.email} value={account.email}>
                  {account.name} — {account.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-sm">
            Pilihan akun mengisi kredensial. Login tetap diverifikasi oleh
            server.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@perusahaan.co.id"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={busy}
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
            className="h-11 pr-11"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute inset-y-0 right-0 h-full w-11 rounded-l-none"
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
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="min-h-11 w-full"
        disabled={busy}
      >
        {busy ? "Memverifikasi..." : "Masuk"}
      </Button>
    </form>
  );
}
