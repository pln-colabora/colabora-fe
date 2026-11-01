"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { toast } from "sonner";

import { AppShell } from "@/components/dashboard/app-shell";
import { ErrorNotice } from "@/components/dashboard/error-notice";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useSession } from "@/hooks/use-session";
import {
  listPdkbSchedules,
  savePdkbSchedule,
  deletePdkbSchedule,
  type PdkbSchedule,
} from "@/lib/pdkb-schedules";
import { formatApiDate, startOfToday } from "@/lib/utils";

function dateValue(date: Date) {
  return date.toLocaleDateString("sv-SE");
}

export default function PdkbSchedulePage() {
  const { user, error: sessionError } = useSession();
  const [month, setMonth] = useState(startOfToday);
  const [selected, setSelected] = useState<Date | undefined>(startOfToday);
  const [rows, setRows] = useState<PdkbSchedule[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);
  const { confirm: confirmAction, dialog } = useConfirmDialog();
  const selectedValue = selected ? dateValue(selected) : "";
  const item = rows.find((row) => row.date === selectedValue);
  useEffect(() => {
    setTitle(item?.title ?? "");
  }, [item, selectedValue]);
  useEffect(() => {
    if (user?.role !== "pdkb") return;
    let cancelled = false;
    setLoading(true);
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    listPdkbSchedules(dateValue(from), dateValue(to))
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role, month, version]);
  async function save() {
    if (!selectedValue || !title.trim()) return;
    setSaving(true);
    try {
      await savePdkbSchedule(item?.id ?? null, selectedValue, title);
      setVersion((value) => value + 1);
      toast.success("Jadwal berhasil disimpan.");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (
      !item ||
      !(await confirmAction({
        title: "Hapus kegiatan?",
        description: `Hapus kegiatan ${item.title} pada ${formatApiDate(item.date, { day: "numeric", month: "short", year: "numeric" })}?`,
        confirmLabel: "Hapus",
      }))
    )
      return;
    setSaving(true);
    try {
      await deletePdkbSchedule(item.id);
      setVersion((value) => value + 1);
      toast.success("Kegiatan dihapus.");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }
  return (
    <AppShell active="schedule" roleId={user?.role ?? "user"} user={user}>
      {dialog}
      <h1 className="font-display text-2xl font-semibold">
        Jadwal kegiatan PDKB
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Satu kegiatan per tanggal. Booking dari WO Konstruksi terkunci.
      </p>
      {Boolean(sessionError || error) && (
        <div className="mt-4">
          <ErrorNotice
            error={sessionError || error}
            onRetry={() => setVersion((value) => value + 1)}
          />
        </div>
      )}
      {user && user.role !== "pdkb" ? (
        <p className="mt-6">Menu ini hanya untuk tim PDKB.</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
          <section aria-label="Kalender kegiatan" className="border p-3">
            <Calendar
              mode="single"
              month={month}
              onMonthChange={(date) => {
                setMonth(date);
                setSelected(undefined);
              }}
              selected={selected}
              onSelect={setSelected}
              modifiers={{
                occupied: (date) =>
                  rows.some((row) => row.date === dateValue(date)),
                booked: (date) =>
                  rows.some(
                    (row) => row.locked && row.date === dateValue(date),
                  ),
              }}
              modifiersClassNames={{
                occupied: "bg-amber-100 text-amber-950 underline",
                booked: "bg-muted text-muted-foreground",
              }}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              Tanggal bergaris bawah: terisi. Booking WO ditandai pada daftar.
            </p>
          </section>
          <section className="min-w-0">
            <h2 className="font-medium">
              {selectedValue
                ? formatApiDate(selectedValue, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Pilih tanggal"}
            </h2>
            {loading ? (
              <p className="mt-3 text-sm" role="status">
                Memuat jadwal…
              </p>
            ) : (
              selectedValue && (
                <form
                  className="mt-3 space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void save();
                  }}
                >
                  {item?.locked ? (
                    <p className="text-sm">
                      {item.title} · Booking WO terkunci.
                      {item.permohonan_id && (
                        <Link
                          className="ml-2 underline"
                          href={`/permohonan/${item.permohonan_id}`}
                        >
                          Lihat permohonan
                        </Link>
                      )}
                    </p>
                  ) : (
                    <>
                      <label className="block text-sm" htmlFor="event-title">
                        Nama kegiatan
                      </label>
                      <Input
                        id="event-title"
                        value={title}
                        maxLength={200}
                        required
                        onChange={(event) => setTitle(event.target.value)}
                        disabled={
                          saving || selectedValue < dateValue(startOfToday())
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          disabled={
                            saving ||
                            Boolean(error) ||
                            selectedValue < dateValue(startOfToday())
                          }
                        >
                          Simpan kegiatan
                        </Button>
                        {item && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={saving}
                            onClick={() => void remove()}
                          >
                            Hapus kegiatan
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </form>
              )
            )}
            <h2 className="mt-8 font-medium">Kegiatan bulan ini</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Kegiatan</th>
                    <th className="p-2">Sumber</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && !rows.length && (
                    <tr>
                      <td colSpan={3} className="text-muted-foreground p-4">
                        Belum ada kegiatan pada bulan ini.
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="p-2">
                        <button
                          className="underline"
                          onClick={() =>
                            setSelected(new Date(`${row.date}T00:00:00`))
                          }
                        >
                          {formatApiDate(row.date, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </button>
                      </td>
                      <td className="p-2">{row.title}</td>
                      <td className="p-2">
                        {row.locked ? "WO · terkunci" : "Kegiatan manual"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
