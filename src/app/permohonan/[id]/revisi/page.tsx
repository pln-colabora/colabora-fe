"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { ArrowLeft, Eye, LockKeyhole } from "lucide-react";

import { ActivityRevisionForm } from "@/components/dashboard/activity-revision-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { DetailSkeleton } from "@/components/dashboard/page-skeletons";
import { Button } from "@/components/ui/button";
import { useApplication } from "@/hooks/use-application";
import { useSession } from "@/hooks/use-session";
import { getDashboardReturnPath } from "@/lib/navigation";
import { getActivity, getOwner, getRole } from "@/lib/workflow";

type RevisionNode = "survei" | "wo_konstruksi";

export default function RevisionPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnTo = getDashboardReturnPath(searchParams.get("returnTo"));
  const node = parseRevisionNode(searchParams.get("node"));
  const detailHref = `/permohonan/${id}?returnTo=${encodeURIComponent(returnTo)}`;
  const { user, error: sessionError } = useSession();
  const roleId = user?.role ?? "user";
  const { application, loading, error, reload } = useApplication(id, !!user);

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

  const activity = node
    ? getActivity(node === "survei" ? "2" : "7")
    : null;
  const ownsRevision =
    !!node &&
    !!activity &&
    getOwner(activity, application) === roleId &&
    (roleId !== "teknik" || user.unit === application.unit);
  const completed = !!node && application.nodes.some(
    (item) => item.workflow_node === node && item.status === "completed",
  );
  const isMonitoring = roleId === "super-user";

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
            {activity ? revisionTitle(node!, activity.label) : "Edit revisi"}
          </h1>
        </header>

        {!node || !activity || !completed ? (
          <RevisionNotice
            icon={LockKeyhole}
            title="Revisi tidak tersedia"
            body="Aktivitas ini belum selesai atau tidak tersedia untuk permohonan ini."
            returnTo={detailHref}
          />
        ) : isMonitoring ? (
          <RevisionNotice
            icon={Eye}
            title="Mode monitoring"
            body={`Revisi hanya dapat dilakukan oleh ${getRole(getOwner(activity, application)).lane} — ${getRole(getOwner(activity, application)).label}.`}
            returnTo={detailHref}
          />
        ) : !ownsRevision ? (
          <RevisionNotice
            icon={LockKeyhole}
            title="Anda tidak memiliki akses revisi"
            body="Revisi hanya dapat dilakukan oleh PIC aktivitas dan unit yang sesuai."
            returnTo={detailHref}
          />
        ) : (
          <section className="bg-card mt-6 rounded-lg border p-5 sm:p-6">
            <ActivityRevisionForm
              id={application.id}
              node={node}
              standalone
              onSaved={() => router.replace(detailHref)}
            />
          </section>
        )}
      </div>
    </AppShell>
  );
}

function parseRevisionNode(value: string | null): RevisionNode | null {
  return value === "survei" || value === "wo_konstruksi" ? value : null;
}

function revisionTitle(node: RevisionNode, activityLabel: string) {
  return node === "survei"
    ? `Edit revisi ${activityLabel}`
    : `Edit revisi lampiran ${activityLabel}`;
}

function RevisionNotice({
  icon: Icon,
  title,
  body,
  returnTo,
}: {
  icon: typeof LockKeyhole;
  title: string;
  body: string;
  returnTo: string;
}) {
  return (
    <section className="bg-card mt-6 rounded-lg border px-5 py-4">
      <div className="flex items-start gap-3">
        <Icon
          className="text-muted-foreground mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <h2 className="font-display font-semibold">{title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{body}</p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link href={returnTo}>Kembali ke detail</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
