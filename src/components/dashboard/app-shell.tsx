"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FilePlus2,
  House,
  LogOut,
  PanelLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { logout, type User } from "@/lib/auth";
import { getRole, type RoleId } from "@/lib/workflow";

const SIDEBAR_STORAGE_KEY = "colabora:sidebar-collapsed";

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(stored === "true");
      }
    } catch {
      // Ignore errors reading from localStorage in restricted environments
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignore errors writing to localStorage
      }
      return next;
    });
  }

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
    <div
      className={`bg-background min-h-dvh w-full max-w-full transition-[padding-left] duration-200 ease-in-out ${
        collapsed ? "lg:pl-16" : "lg:pl-[232px]"
      }`}
    >
      <a
        href="#main-content"
        className="bg-background fixed top-2 left-2 z-50 -translate-y-24 rounded-md border p-3 focus:translate-y-0"
      >
        Lewati ke konten utama
      </a>
      <aside
        className={`bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-30 hidden flex-col overflow-y-auto overflow-x-hidden border-r transition-[width] duration-200 ease-in-out lg:flex ${
          collapsed ? "w-16" : "w-[232px]"
        }`}
      >
        <div
          className={`border-sidebar-border flex h-16 shrink-0 items-center border-b ${
            collapsed ? "justify-center px-2" : "px-5"
          }`}
        >
          <Link
            href="/dashboard"
            className={`flex items-center min-w-0 ${
              collapsed ? "justify-center" : "gap-3"
            }`}
            title="COLABORA"
          >
            <Image
              src="/logo/colabora.png"
              alt="Logo COLABORA"
              width={32}
              height={32}
              className="size-8 shrink-0 object-contain"
              priority
            />
            {!collapsed && (
              <span className="font-display text-primary block text-xl font-bold tracking-tight truncate">
                COLABORA
              </span>
            )}
          </Link>
        </div>

        <nav
          aria-label="Navigasi utama"
          className={`py-5 ${collapsed ? "px-2" : "px-3"}`}
        >
          {!collapsed && (
            <p className="text-muted-foreground px-2 pb-2 text-xs font-medium">
              Menu utama
            </p>
          )}
          <div className="space-y-1">
            {destinations.map(({ id, href, label, icon: Icon }) => (
              <Link
                key={id}
                href={href}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                aria-current={active === id ? "page" : undefined}
                className={`font-display flex min-h-11 items-center rounded-md text-sm font-medium transition-colors ${
                  collapsed ? "justify-center px-0 w-full" : "gap-3 px-3"
                } ${
                  active === id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-auto flex flex-col">
          <div
            className={`border-sidebar-border border-t ${
              collapsed ? "flex justify-center p-2" : "p-3"
            }`}
          >
            <Button
              type="button"
              variant="ghost"
              size={collapsed ? "icon-sm" : "default"}
              className={`text-muted-foreground hover:text-foreground ${
                collapsed
                  ? "h-9 w-9"
                  : "w-full justify-start gap-3 px-3 text-xs font-medium"
              }`}
              onClick={toggleCollapsed}
              title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            >
              {collapsed ? (
                <ChevronsRight className="size-4" aria-hidden="true" />
              ) : (
                <>
                  <ChevronsLeft className="size-4" aria-hidden="true" />
                  <span>Ciutkan</span>
                </>
              )}
            </Button>
          </div>

          <div
            className={`border-sidebar-border border-t ${
              collapsed ? "px-2 py-3" : "px-5 py-4"
            }`}
          >
            {!collapsed ? (
              <>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Akun
                </p>
                <p
                  className="text-sm font-medium truncate"
                  title={user?.name ?? undefined}
                >
                  {user?.name ?? "Memuat akun..."}
                </p>
                <p
                  className="text-muted-foreground mt-0.5 text-xs truncate"
                  title={user?.unit || undefined}
                >
                  {user?.unit || "—"}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-3 min-h-10 w-full justify-start gap-3 border-0 px-3 text-sm font-medium text-muted-foreground shadow-none outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:ring-0"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4 shrink-0" aria-hidden="true" />
                  Keluar
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-full text-xs font-semibold"
                  title={`${user?.name ?? "Akun"}${user?.unit ? ` (${user.unit})` : ""}`}
                  aria-label={`${user?.name ?? "Akun"}${user?.unit ? ` (${user.unit})` : ""}`}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-9 border-0 text-muted-foreground shadow-none outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:ring-0"
                  onClick={handleLogout}
                  title="Keluar"
                  aria-label="Keluar"
                >
                  <LogOut className="size-4 shrink-0" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="max-w-full min-w-0">
        <header
          className={`bg-card fixed inset-x-0 top-0 z-40 h-16 border-b transition-[left] duration-200 ease-in-out ${
            collapsed ? "lg:left-16" : "lg:left-[232px]"
          }`}
        >
          <div className="mx-auto flex h-full w-full max-w-[1440px] min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 shrink-0 py-2 lg:hidden"
            >
              <Image
                src="/logo/colabora.png"
                alt="Logo COLABORA"
                width={28}
                height={28}
                className="size-7 shrink-0 object-contain"
                priority
              />
              <span className="font-display text-primary block text-lg font-bold tracking-tight">
                COLABORA
              </span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground hidden size-8 shrink-0 lg:inline-flex"
              onClick={toggleCollapsed}
              title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            >
              <PanelLeft className="size-4" aria-hidden="true" />
            </Button>
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
              className="min-h-11 gap-1 border-0 px-2 text-muted-foreground shadow-none outline-none hover:bg-destructive/10 hover:text-destructive sm:px-3 lg:hidden"
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
          className="mx-auto w-full max-w-[1440px] min-w-0 overflow-x-clip px-4 pt-24 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:pt-24 lg:pb-8"
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
              <span className="max-w-full truncate leading-4">
                {mobileLabel}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
