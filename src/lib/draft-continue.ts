import type { DraftApplicationRequest } from "@/lib/applications";
import {
  exactTariffPowers,
  normalizeGolongan,
  tarifForGolongan,
  type Application,
  type RoleId,
} from "@/lib/workflow";

// Jenis sambungan a role may create, as shown in the form.
export const connectionTypesByRole: Partial<Record<RoleId, string[]>> = {
  "pelayanan-pelanggan": ["JTR", "JTM / Gardu"],
  nps: ["PLG TM <5 GWNG", "PLG TM >5 GWNG"],
};

// Form uses display names; the tarif endpoint and create payload use the API name.
export const toApiJenis = (connectionType: string) =>
  connectionType === "JTM / Gardu" ? "JTM/Gardu" : connectionType;

function findPower(golongan: string | undefined, daya: number | undefined) {
  const code = normalizeGolongan(golongan);
  return exactTariffPowers.find(
    (option) => option.golongan_tarif === code && option.daya_min === daya,
  );
}

function formatDaya(daya: number) {
  return `${new Intl.NumberFormat("id-ID").format(daya)} VA`;
}

/**
 * Why an imported draft cannot be continued as-is, or null when it is ready.
 * Mirrors the checks the single draft form runs; the tariff catalogue is the
 * same for every jenis sambungan, so the static table is authoritative here.
 */
export function draftContinueProblem(draft: Application): string | null {
  if (!draft.customer.trim()) return "Nama pelanggan kosong.";
  if (!draft.phone.trim()) return "No. HP kosong.";
  if (!draft.location.trim()) return "Lokasi kosong.";
  if (!draft.paymentDate) return "Tanggal pembayaran kosong.";
  if (!draft.paymentAmount) return "Nominal pembayaran kosong.";
  if (!draft.jenisPembayaran) return "Jenis pembayaran kosong.";
  if (!draft.golonganTarif) return "Golongan tarif kosong.";
  if (!draft.dayaBaru) return "Daya baru kosong.";
  if (!findPower(draft.golonganTarif, draft.dayaBaru))
    return `Daya ${formatDaya(draft.dayaBaru)} tidak tersedia untuk golongan ${draft.golonganTarif}.`;
  if (draft.requestType === "Perubahan daya") {
    if (!draft.golonganTarifLama || !draft.dayaLama)
      return "Golongan atau daya lama kosong.";
    if (!findPower(draft.golonganTarifLama, draft.dayaLama))
      return `Daya lama ${formatDaya(draft.dayaLama)} tidak tersedia untuk golongan ${draft.golonganTarifLama}.`;
  }
  return null;
}

// The saved-draft payload for continuing a valid draft with a shared jenis
// sambungan. tarif and pembatas follow the golongan, as in the single form.
export function bulkDraftPayload(
  draft: Application,
  connectionType: string,
): DraftApplicationRequest {
  const isPowerChange = draft.requestType === "Perubahan daya";
  const golongan = normalizeGolongan(draft.golonganTarif);
  const golonganLama = normalizeGolongan(draft.golonganTarifLama);
  return {
    jenis_permohonan: isPowerChange ? "Perubahan Daya (PD)" : "Pasang Baru (PB)",
    jenis_sambungan: toApiJenis(connectionType),
    jenis_pembayaran: draft.jenisPembayaran ?? "",
    pelanggan_nama: draft.customer,
    pelanggan_alamat: draft.location,
    pelanggan_no_hp: draft.phone,
    tanggal_pembayaran: draft.paymentDate ?? "",
    nominal_pembayaran: draft.paymentAmount ?? null,
    tarif: draft.tarif || tarifForGolongan(golongan) || null,
    golongan_tarif: golongan || null,
    golongan_tarif_lama: isPowerChange ? golonganLama || null : null,
    daya_baru: draft.dayaBaru ?? null,
    daya_lama: isPowerChange ? (draft.dayaLama ?? null) : null,
    pembatas_baru: findPower(golongan, draft.dayaBaru)?.pembatas ?? null,
    pembatas_lama: isPowerChange
      ? (findPower(golonganLama, draft.dayaLama)?.pembatas ?? null)
      : null,
    ulp_unit: draft.unit,
  };
}
