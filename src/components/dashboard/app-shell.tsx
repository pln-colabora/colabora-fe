"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ChevronDown,
  ClipboardList,
  House,
  LogOut,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ROLE_STORAGE_KEY,
  getRole,
  resetWorkflowDemo,
  roles,
  type RoleId,
} from "@/lib/workflow";

const destinations = [
  { id: "dashboard", href: "/dashboard", label: "Beranda", icon: House },
  {
    id: "applications",
    href: "/dashboard?view=all",
    label: "Permohonan",
    icon: ClipboardList,
  },
] as const;

type AppShellProps = {
  children: React.ReactNode;
  active: "dashboard" | "applications";
  roleId: RoleId;
  onRoleChange: (role: RoleId) => void;
};

export function AppShell({
  children,
  active,
  roleId,
  onRoleChange,
}: AppShellProps) {
  const router = useRouter();
  const role = getRole(roleId);
  return (
    <div className="bg-background min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="bg-background fixed top-2 left-2 z-50 -translate-y-24 rounded-md border p-3 focus:translate-y-0"
      >
        Lewati ke konten utama
      </a>
      <aside className="bg-brand-ink border-t-brand-yellow sticky top-0 hidden h-dvh flex-col border-t-4 text-white lg:flex">
        <Link
          href="/dashboard"
          className="border-b border-white/15 px-6 py-6 focus-visible:outline-white"
        >
          <span className="font-display block text-xl font-semibold tracking-tight">
            COLABORA
          </span>
          <span className="mt-1 block text-sm text-white/80">
            Layanan Kolaborasi PLN
          </span>
        </Link>
        <nav aria-label="Navigasi utama" className="space-y-1 px-3 py-6">
          {destinations.map(({ id, href, label, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id ? "page" : undefined}
              className={`font-display flex min-h-12 items-center gap-3 border-l-2 px-3 text-sm font-medium focus-visible:outline-white ${active === id ? "border-brand-yellow bg-white/10 text-white" : "border-transparent text-white/80 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/15 px-6 py-5">
          <p className="text-sm font-medium">{role.label}</p>
          <p className="mt-1 text-sm text-white/80">{role.lane}</p>
          <p className="mt-4 text-xs text-white/70">Lingkungan demo PB/PD</p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="bg-card border-t-brand-yellow sticky top-0 z-20 border-t-4 border-b lg:border-t-0">
          <div className="mx-auto flex min-h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:gap-8">
            <Link href="/dashboard" className="shrink-0 py-2 lg:hidden">
              <span className="font-display text-primary block text-lg font-bold tracking-tight">
                COLABORA
              </span>
              <span className="text-muted-foreground hidden text-sm sm:block">
                Layanan Kolaborasi PLN
              </span>
            </Link>
            <p className="text-muted-foreground hidden text-sm lg:block">
              Ruang kerja permohonan PB/PD
            </p>
            <details className="group relative ml-auto min-w-0">
              <summary className="hover:bg-accent flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-2 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 text-sm">
                  <span className="text-muted-foreground block text-xs">
                    Peran demo
                  </span>
                  <span className="hidden max-w-48 truncate font-medium lg:block">
                    {role.label}
                  </span>
                  <span className="font-medium lg:hidden">{role.lane}</span>
                </span>
                <ChevronDown
                  className="text-muted-foreground size-4 shrink-0 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="bg-popover absolute top-full right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border p-4 shadow-md">
                <label
                  htmlFor="role-switcher"
                  className="mb-2 block text-sm font-medium"
                >
                  Ganti peran demo
                </label>
                <select
                  id="role-switcher"
                  value={roleId}
                  onChange={(event) => {
                    const nextRole = event.target.value as RoleId;
                    window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
                    onRoleChange(nextRole);
                  }}
                  className="border-input bg-card h-11 w-full rounded-md border px-2 text-sm"
                >
                  {roles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.lane} / {item.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  className="mt-3 min-h-11 w-full justify-start"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Reset data demo? Semua perubahan aktivitas di browser ini akan dihapus dan data awal dipulihkan.",
                      )
                    ) {
                      resetWorkflowDemo();
                      window.location.reload();
                    }
                  }}
                >
                  <RotateCcw aria-hidden="true" />
                  Reset demo
                </Button>
              </div>
            </details>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => {
                window.localStorage.removeItem(ROLE_STORAGE_KEY);
                router.push("/login");
              }}
            >
              <LogOut aria-hidden="true" />
              Keluar
            </Button>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] min-w-0 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:py-8 lg:pb-8"
        >
          {children}
        </main>
        <nav
          aria-label="Navigasi seluler"
          className="bg-card fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {destinations.map(({ id, href, label, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 border-t-2 text-sm font-medium ${active === id ? "border-primary bg-accent text-primary" : "text-muted-foreground border-transparent"}`}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
