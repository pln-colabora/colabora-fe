"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ArrowLeft, Eye, LockKeyhole } from "lucide-react";

import { ActionForm } from "@/components/dashboard/action-form";
import { AppShell } from "@/components/dashboard/app-shell";
import { FormPageSkeleton } from "@/components/dashboard/page-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApplication } from "@/hooks/use-application";
import { useSession } from "@/hooks/use-session";
import {
  getActivity,
  getOwner,
  getRole,
} from "@/lib/workflow";

export default function SurveyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user, error: sessionError } = useSession();
  const router = useRouter();
  const roleId = user?.role ?? "user";
  const { application, loading, error, reload } = useApplication(id, !!user);
  const ready = !!application || !loading;

  if (!ready) {
    return (
      <AppShell active="applications" roleId={roleId} user={user}>
        {sessionError ? (
          <div role="alert" aria-live="assertive" className="space-y-4">
            <p className="text-destructive text-sm">{sessionError}</p>
            <Button onClick={() => window.location.reload()}>Coba lagi</Button>
          </div>
        ) : (
          <FormPageSkeleton />
        )}
      </AppShell>
    );
  }

  if (!application) {
    return (
      <AppShell active="applications" roleId={roleId} user={user}>
        <div className="mx-auto max-w-3xl border px-6 py-16 text-center">
          <h1 className="font-display text-xl font-semibold">
            Detail survei belum tersedia
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {error || "Permohonan tidak ditemukan."}
          </p>
          <Button
            variant="outline"
            className="mt-6 mr-2"
            onClick={reload}
          >
            Coba lagi
          </Button>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard?view=all">Kembali ke permohonan</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const surveyActivity = getActivity("2")!;
  const ownerId = getOwner(surveyActivity, application);
  const owner = getRole(ownerId);
  const action = application.availableActions.find(
    (action) => action.workflow_node === "survei",
  );
  const isActive = application.nodes.some(
    (node) =>
      node.workflow_node === "survei" &&
      (node.status === "available" || node.status === "in_progress"),
  );
  const ownsAction = !!action;
  const isMonitoring = roleId === "super-user";

  return (
    <AppShell active="applications" roleId={roleId} user={user}>
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <Link
          href={`/permohonan/${application.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke detail permohonan
        </Link>

        <header className="mt-5 border-b pb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Survei Perluasan Jaringan
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {application.customer} · {application.connectionType} ·{" "}
            <span className="font-mono text-xs">{application.id}</span>
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            PIC survei: {owner.lane} — {owner.label}
          </p>
        </header>

        {!isActive ? (
          <Notice
            icon={LockKeyhole}
            title="Aktivitas survei tidak aktif"
            body="Permohonan ini tidak sedang menunggu aktivitas survei. Buka detail permohonan untuk melihat tahap yang sedang berjalan."
          />
        ) : isMonitoring ? (
          <Notice
            icon={Eye}
            title="Mode monitoring"
            body={`Survei berada pada ${owner.lane} — ${owner.label}. Super User dapat memantau tanpa mengisi formulir.`}
          />
        ) : !ownsAction ? (
          <Notice
            icon={LockKeyhole}
            title="Menunggu tindakan PIC survei"
            body={`Survei dikerjakan oleh ${owner.lane} — ${owner.label} sesuai jenis sambungan ${application.connectionType}.`}
          />
        ) : (
          <Card className="mt-6 rounded-lg">
            <CardContent className="p-5 sm:p-6">
              <ActionForm
                key={application.id}
                application={application}
                action={action!}
                embedded
                onCancel={() => router.push(`/permohonan/${id}`)}
                onSaved={() => router.push(`/permohonan/${id}`)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Notice({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof LockKeyhole;
  title: string;
  body: string;
}) {
  return (
    <section
      className="bg-card mt-6 rounded-lg px-5 py-4"
      aria-labelledby="survey-notice-title"
    >
      <div className="flex items-start gap-3">
        <Icon
          className="text-muted-foreground mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <h2 id="survey-notice-title" className="font-display font-semibold">
            {title}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{body}</p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link href="/dashboard?view=all">Lihat daftar permohonan</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
