"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ChevronDown,
  ClipboardList,
  FilePlus2,
  House,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { logout, type User } from "@/lib/auth";
import { getRole, type RoleId } from "@/lib/workflow";

const baseDestinations = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Beranda",
    mobileLabel: "Beranda",
    icon: House,
  },
  {
    id: "applications",
    href: "/dashboard?view=all",
    label: "Permohonan",
    mobileLabel: "Permohonan",
    icon: ClipboardList,
  },
] as const;

const createDestination = {
  id: "create",
  href: "/permohonan/baru",
  label: "Permohonan baru",
  mobileLabel: "Buat baru",
  icon: FilePlus2,
} as const;

const CREATE_ROLES: RoleId[] = ["pelayanan-pelanggan", "nps"];

export function canCreatePermohonan(roleId: RoleId) {
  return CREATE_ROLES.includes(roleId);
}

type AppShellProps = {
  children: React.ReactNode;
  active: "dashboard" | "applications" | "create";
  roleId: RoleId;
  user?: User | null;
};

export function AppShell({ children, active, roleId, user }: AppShellProps) {
  const router = useRouter();
  function handleLogout() {
    void logout();
    toast.success("Berhasil keluar.");
    router.replace("/login");
  }
  const role = getRole(roleId);
  const destinations = canCreatePermohonan(roleId)
    ? [...baseDestinations, createDestination]
    : baseDestinations;
  return (
    <div className="bg-background min-h-dvh w-full max-w-full overflow-x-clip lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="bg-background fixed top-2 left-2 z-50 -translate-y-24 rounded-md border p-3 focus:translate-y-0"
      >
        Lewati ke konten utama
      </a>
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-dvh max-h-dvh flex-col self-start overflow-y-auto border-r lg:flex">
        <Link
          href="/dashboard"
          className="border-sidebar-border flex min-h-20 flex-col justify-center border-b px-5"
        >
          <span className="font-display text-primary block text-xl font-bold tracking-tight">
            COLABORA
          </span>
          <span className="text-muted-foreground mt-1 block text-xs">
            Layanan Kolaborasi PLN
          </span>
        </Link>
        <nav aria-label="Navigasi utama" className="px-3 py-5">
          <p className="text-muted-foreground px-2 pb-2 text-xs font-medium">
            Menu utama
          </p>
          <div className="space-y-1">
            {destinations.map(({ id, href, label, icon: Icon }) => (
              <Link
                key={id}
                href={href}
                aria-current={active === id ? "page" : undefined}
                className={`font-display flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium ${active === id ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="border-sidebar-border mt-auto border-t px-5 py-5">
          <p className="text-muted-foreground mb-3 text-xs font-medium">Akun</p>
          <p className="text-sm font-medium">
            {user?.name ?? "Memuat akun..."}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {user?.unit || "—"}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground mt-3 min-h-10 w-full justify-start px-0 hover:bg-transparent"
            onClick={handleLogout}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Keluar
          </Button>
        </div>
      </aside>
      <div className="max-w-full min-w-0">
        <header className="bg-card sticky top-0 z-20 border-b">
          <div className="mx-auto flex min-h-16 w-full max-w-[1440px] min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:gap-8">
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
              <summary className="hover:bg-accent flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-1.5 sm:px-2 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 text-sm">
                  <span className="text-muted-foreground block text-xs">
                    Peran
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
                <p className="text-sm font-medium">
                  {user?.name ?? "Memuat akun..."}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {user?.email}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {role.label} — {user?.unit || "—"}
                </p>
              </div>
            </details>
            <Button
              variant="ghost"
              className="min-h-11 gap-1 px-2 sm:px-3 lg:hidden"
              onClick={handleLogout}
            >
              <LogOut aria-hidden="true" />
              Keluar
            </Button>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] min-w-0 overflow-x-clip px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:py-8 lg:pb-8"
        >
          {children}
        </main>
        <nav
          aria-label="Navigasi seluler"
          className="bg-card fixed inset-x-0 bottom-0 z-20 grid border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
          style={{
            gridTemplateColumns: `repeat(${destinations.length}, minmax(0, 1fr))`,
          }}
        >
          {destinations.map(({ id, href, mobileLabel, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id ? "page" : undefined}
              className={`flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1 border-t-2 px-2 text-xs font-medium ${active === id ? "border-primary bg-accent text-primary" : "text-muted-foreground border-transparent"}`}
            >
              <Icon className="size-[1.15rem] shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate leading-4">{mobileLabel}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
