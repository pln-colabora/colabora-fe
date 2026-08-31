"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ROLE_STORAGE_KEY,
  getRole,
  resetWorkflowDemo,
  roles,
  type RoleId,
} from "@/lib/workflow";

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

  function changeRole(nextRole: RoleId) {
    window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
    onRoleChange(nextRole);
  }

  function logout() {
    window.localStorage.removeItem(ROLE_STORAGE_KEY);
    router.push("/login");
  }

  return (
    <div className="bg-muted/25 min-h-dvh w-full max-w-full overflow-x-clip lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="bg-background sticky top-0 hidden h-dvh border-r lg:flex lg:flex-col">
        <div className="border-b px-6 py-5">
          <Link
            href="/dashboard"
            className="font-display text-lg font-semibold tracking-tight"
          >
            COLABORA
          </Link>
          <p className="text-muted-foreground mt-1 text-xs">
            Ruang kerja operasional
          </p>
        </div>

        <nav aria-label="Navigasi utama" className="space-y-1 px-3 py-5">
          <NavLink
            href="/dashboard"
            active={active === "dashboard"}
            icon={LayoutDashboard}
          >
            Dashboard
          </NavLink>
          <NavLink
            href="/dashboard?view=all"
            active={active === "applications"}
            icon={ClipboardList}
          >
            Permohonan
          </NavLink>
        </nav>

        <div className="mt-auto border-t p-4">
          <label
            htmlFor="role-switcher"
            className="text-muted-foreground mb-2 block text-xs font-medium"
          >
            Simulasi role
          </label>
          <select
            id="role-switcher"
            value={roleId}
            onChange={(event) => changeRole(event.target.value as RoleId)}
            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
          >
            {roles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.lane} — {item.label}
              </option>
            ))}
          </select>

          <div className="mt-4 flex items-center gap-3 border-t pt-4">
            <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
              {role.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{role.label}</p>
              <p className="text-muted-foreground text-xs">{role.lane}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Keluar"
              onClick={logout}
            >
              <LogOut aria-hidden="true" />
            </Button>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground mt-3 flex items-center gap-2 text-xs"
            onClick={() => {
              resetWorkflowDemo();
              window.location.reload();
            }}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset data demo
          </button>
        </div>
      </aside>

      <div className="w-full max-w-full min-w-0">
        <header className="bg-background sticky top-0 z-20 flex h-15 items-center gap-3 border-b px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="font-display mr-auto font-semibold lg:hidden"
          >
            COLABORA
          </Link>
          <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
            <Search className="size-4" aria-hidden="true" />
            <span>Monitoring permohonan PB/PD</span>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <label htmlFor="mobile-role-switcher" className="sr-only">
              Simulasi role
            </label>
            <select
              id="mobile-role-switcher"
              value={roleId}
              onChange={(event) => changeRole(event.target.value as RoleId)}
              className="border-input bg-background h-9 max-w-32 min-w-0 rounded-md border px-2 text-xs sm:max-w-56"
            >
              {roles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.lane} — {item.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Keluar"
              onClick={logout}
            >
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </header>

        <nav
          aria-label="Navigasi seluler"
          className="bg-background flex border-b px-4 lg:hidden"
        >
          <MobileNavLink href="/dashboard" active={active === "dashboard"}>
            Dashboard
          </MobileNavLink>
          <MobileNavLink
            href="/dashboard?view=all"
            active={active === "applications"}
          >
            Permohonan
          </MobileNavLink>
        </nav>

        <main className="w-full max-w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: typeof LayoutDashboard;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`border-b-2 px-3 py-3 text-sm font-medium ${
        active
          ? "border-foreground text-foreground"
          : "text-muted-foreground border-transparent"
      }`}
    >
      {children}
    </Link>
  );
}
