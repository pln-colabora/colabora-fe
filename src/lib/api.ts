const TOKEN_KEY = "colabora_tokens";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

type Tokens = { access_token: string; refresh_token: string };
type Envelope<T> = {
  data: T;
  status: boolean | string;
  message: string;
  error?: unknown;
  pagination?: { page: number; max_page: number; total: number };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function saveTokens(tokens: Tokens) {
  sessionStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    }),
  );
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
}

function readTokens(): Tokens | null {
  const stored = sessionStorage.getItem(TOKEN_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Tokens;
  } catch {
    clearSession();
    return null;
  }
}

let refreshing: Promise<void> | undefined;

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<Envelope<T>> {
  if (!baseUrl)
    throw new Error("NEXT_PUBLIC_API_BASE_URL belum dikonfigurasi.");
  if (!path.startsWith("/api/")) throw new Error("Path API tidak valid.");
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const tokens = authenticated ? readTokens() : null;
  if (authenticated && !tokens)
    throw new ApiError("Sesi berakhir. Silakan masuk kembali.", 401);
  if (tokens) headers.set("Authorization", `Bearer ${tokens.access_token}`);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Tidak dapat menghubungi API COLABORA. Periksa koneksi lalu coba lagi.",
    );
  }
  if (response.status === 401 && tokens && path !== "/api/auth/logout") {
    if (!refreshing) {
      refreshing = apiRequest<Tokens>(
        "/api/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: tokens.refresh_token }),
        },
        false,
      )
        .then(({ data }) => saveTokens(data))
        .catch((error: unknown) => {
          if (
            error instanceof ApiError &&
            (error.status === 400 || error.status === 401)
          ) {
            clearSession();
            throw new ApiError("Sesi berakhir. Silakan masuk kembali.", 401);
          }
          throw error;
        })
        .finally(() => {
          refreshing = undefined;
        });
    }
    await refreshing;
    const refreshed = readTokens();
    headers.set("Authorization", `Bearer ${refreshed?.access_token}`);
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers,
        cache: "no-store",
      });
    } catch {
      throw new Error("Tidak dapat menghubungi API COLABORA. Coba lagi.");
    }
  }
  const body = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || body?.status === false || !body) {
    if (response.status === 401 && authenticated) clearSession();
    const detail =
      typeof body?.error === "string"
        ? body.error
        : body?.error && typeof body.error === "object"
          ? Object.values(body.error)
              .filter((value) => typeof value === "string")
              .join("; ")
          : "";
    throw new ApiError(
      detail || body?.message || `Permintaan gagal (${response.status}).`,
      response.status,
    );
  }
  return body;
}
