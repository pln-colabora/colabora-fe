"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ChevronDown,
  ClipboardList,
  FilePlus2,
  House,
  LogOut,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ROLE_STORAGE_KEY,
  getRole,
  resetWorkflowDemo,
  roles,
  type RoleId,
} from "@/lib/workflow";

const baseDestinations = [
  { id: "dashboard", href: "/dashboard", label: "Beranda", icon: House },
  {
    id: "applications",
    href: "/dashboard?view=all",
    label: "Permohonan",
    icon: ClipboardList,
  },
] as const;

const createDestination = {
  id: "create",
  href: "/permohonan/baru",
  label: "Permohonan baru",
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
  const destinations = canCreatePermohonan(roleId)
    ? [...baseDestinations, createDestination]
    : baseDestinations;
  return (
    <div className="bg-background min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="bg-background fixed top-2 left-2 z-50 -translate-y-24 rounded-md border p-3 focus:translate-y-0"
      >
        Lewati ke konten utama
      </a>
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-dvh flex-col border-r lg:flex">
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
          <p className="text-muted-foreground mb-3 text-xs font-medium">
            Akun demo
          </p>
          <p className="text-sm font-medium">{role.label}</p>
          <p className="text-muted-foreground mt-1 text-xs">{role.lane}</p>
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground mt-3 min-h-10 w-full justify-start px-0 hover:bg-transparent"
            onClick={() => {
              window.localStorage.removeItem(ROLE_STORAGE_KEY);
              router.push("/login");
            }}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Keluar
          </Button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="bg-card sticky top-0 z-20 border-b">
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
                <Select
                  value={roleId}
                  onValueChange={(value) => {
                    const nextRole = value as RoleId;
                    window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
                    onRoleChange(nextRole);
                  }}
                >
                  <SelectTrigger
                    id="role-switcher"
                    className="bg-card h-11 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {roles.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.lane} / {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              className="min-h-11 lg:hidden"
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
          className="bg-card fixed inset-x-0 bottom-0 z-20 grid border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
          style={{
            gridTemplateColumns: `repeat(${destinations.length}, minmax(0, 1fr))`,
          }}
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
