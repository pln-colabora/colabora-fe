import { ApiError } from "@/lib/api";

export type ErrorAction = "login" | "retry" | "back" | "none";

export type ErrorPresentation = {
  message: string;
  action: ErrorAction;
};

export function presentApiError(
  error: unknown,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
  context?: "login",
): ErrorPresentation {
  if (error instanceof ApiError) {
    if (error.status === 401 && context === "login")
      return { message: "Email atau kata sandi tidak cocok.", action: "retry" };
    if (error.status === 401)
      return {
        message: "Sesi Anda berakhir. Silakan masuk kembali.",
        action: "login",
      };
    if (error.status === 403)
      return {
        message: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
        action: "back",
      };
    if (error.status === 404)
      return {
        message: "Data yang diminta tidak ditemukan.",
        action: "back",
      };
    if (error.status >= 500)
      return {
        message: "Layanan COLABORA sedang bermasalah. Coba lagi beberapa saat.",
        action: "retry",
      };
    return { message: error.message, action: "none" };
  }

  if (
    error instanceof Error &&
    /Tidak dapat menghubungi API|network|fetch/i.test(error.message)
  )
    return {
      message: "Tidak dapat terhubung ke layanan COLABORA. Periksa koneksi lalu coba lagi.",
      action: "retry",
    };

  return {
    message: error instanceof Error ? error.message : fallback,
    action: "retry",
  };
}
