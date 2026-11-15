"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { CreateForm } from "@/app/permohonan/baru/page";
import {
  AppShell,
  canCreatePermohonan,
} from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { DetailSkeleton } from "@/components/dashboard/page-skeletons";
import { useApplication } from "@/hooks/use-application";
import { useSession } from "@/hooks/use-session";

export default function DraftEditPage() {
  const { id } = useParams<{ id: string }>();
  const { user, error: sessionError } = useSession();
  const roleId = user?.role ?? "user";
  const { application, loading, error, reload } = useApplication(id, !!user);
  return (
    <AppShell active="applications" roleId={roleId} user={user}>
      <div className="mx-auto max-w-3xl">
        <Link
          href="/permohonan/draft"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Daftar draft
        </Link>
        <header className="mt-5 border-b pb-6">
          <h1 className="font-display text-2xl font-semibold">
            Lengkapi draft
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {application?.number ?? "Permohonan import EIS"}
          </p>
        </header>
        {Boolean(sessionError) && (
          <ErrorNotice
            error={sessionError}
            onRetry={() => window.location.reload()}
          />
        )}
        {loading && <DetailSkeleton />}
        {!loading && Boolean(error) && (
          <ErrorNotice error={error} onRetry={reload} />
        )}
      {!loading && application && application.status !== "draft" && (
          <p className="mt-6">
            Permohonan ini sudah aktif.{" "}
            <Link className="text-primary underline" href={`/permohonan/${id}`}>
              Buka detail permohonan
            </Link>
            .
          </p>
        )}
        {!loading &&
          application?.status === "draft" &&
          !canCreatePermohonan(roleId) && (
            <p className="mt-6">Peran Anda tidak dapat melengkapi draft.</p>
          )}
        {!loading &&
          application?.status === "draft" &&
          canCreatePermohonan(roleId) && (
            <CreateForm
              draft={application}
              roleId={roleId}
              returnTo="/permohonan/draft"
              onDirtyChange={() => {}}
            />
          )}
      </div>
    </AppShell>
  );
}
