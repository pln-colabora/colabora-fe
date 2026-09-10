"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({
  accounts = [],
}: {
  accounts?: Array<{ name: string; email: string; password: string }>;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const busy = form.formState.isSubmitting;

  async function handleSubmit(values: LoginValues) {
    try {
      const user = await login(values.email, values.password);
      form.reset({ email: values.email, password: "" });
      toast.success(`Berhasil masuk sebagai ${user.name}.`);
      router.replace("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login gagal.";
      form.setError("root", { message });
      toast.error(message);
    }
  }

  return (
    <Form {...form}>
      <form
        className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
      >
        {accounts.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="development-account">Akun development</Label>
            <Select
              onValueChange={(email) => {
                const account = accounts.find((item) => item.email === email);
                if (account) {
                  form.setValue("email", account.email, {
                    shouldValidate: true,
                  });
                  form.setValue("password", account.password, {
                    shouldValidate: true,
                  });
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

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="nama@perusahaan.co.id"
                  disabled={busy}
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kata sandi</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    disabled={busy}
                    className="h-11 pr-11"
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full w-11 rounded-l-none"
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
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
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root?.message && (
          <p role="alert" className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="min-h-11 w-full"
          disabled={busy}
        >
          {busy && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {busy ? "Memverifikasi..." : "Masuk"}
        </Button>
      </form>
    </Form>
  );
}
