"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { ActionForm } from "@/components/dashboard/action-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { DetailSkeleton } from "@/components/dashboard/page-skeletons";
import { Button } from "@/components/ui/button";
import { useApplication } from "@/hooks/use-application";
import { useSession } from "@/hooks/use-session";
import { getDashboardReturnPath } from "@/lib/navigation";
import { getActivity, getOwner, getRole, nodeActions } from "@/lib/workflow";

export default function ActivityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const node = searchParams.get("node") ?? "";
  const { user, error: sessionError } = useSession();
  const roleId = user?.role ?? "user";
  const { application, loading, error, reload } = useApplication(id, !!user);
  const listReturnTo = getDashboardReturnPath(null);
  const requestedReturnTo = searchParams.get("returnTo") ?? "";
  const detailHref =
    requestedReturnTo.startsWith(`/permohonan/${id}?`) &&
    !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : `/permohonan/${id}?returnTo=${encodeURIComponent(listReturnTo)}`;

  if (!user || loading) {
    return (
      <AppShell active="applications" roleId={roleId} user={user}>
        {sessionError ? (
          <ErrorNotice
            error={sessionError}
            onRetry={() => window.location.reload()}
          />
        ) : (
          <DetailSkeleton />
        )}
      </AppShell>
    );
  }

  if (!application) {
    return (
      <AppShell active="applications" roleId={roleId} user={user}>
        <div className="mx-auto max-w-3xl">
          <ErrorNotice
            error={error ?? new Error("Permohonan tidak ditemukan.")}
            onRetry={reload}
            backHref={detailHref}
          />
        </div>
      </AppShell>
    );
  }

  const action = application.availableActions
    .filter((item) => !item.path.endsWith("/vendor-assignments"))
    .find((item) => item.workflow_node === node);
  const activity = action
    ? getActivity(nodeActions[action.workflow_node])
    : null;

  if (!action || !activity || application.completed || application.rejected) {
    return (
      <AppShell active="applications" roleId={roleId} user={user}>
        <div className="bg-card mx-auto max-w-3xl rounded-lg border p-6">
          <h1 className="font-display text-xl font-semibold">
            Aktivitas tidak tersedia
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Aktivitas ini tidak tersedia untuk akun atau status permohonan saat
            ini.
          </p>
          <Button asChild variant="outline" className="mt-5 min-h-11">
            <Link href={detailHref}>Kembali ke detail</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="applications" roleId={roleId} user={user}>
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <Link
          href={detailHref}
          className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke detail permohonan
        </Link>
        <header className="mt-3 border-b pb-5">
          <p className="text-muted-foreground text-sm">
            {application.number} · {application.customer}
          </p>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight">
            {activity.label}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {activity.description}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            PIC: {getRole(getOwner(activity, application)).lane} ·{" "}
            {getRole(getOwner(activity, application)).label}
          </p>
        </header>
        <section
          className="bg-card mt-5 rounded-lg border p-4 sm:p-6"
          aria-label={`Form ${activity.label}`}
        >
          <ActionForm
            application={application}
            action={action}
            onCancel={() => router.push(detailHref)}
            onSaved={() => router.replace(detailHref)}
          />
        </section>
      </div>
    </AppShell>
  );
}
