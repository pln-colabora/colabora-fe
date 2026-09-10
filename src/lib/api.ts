import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

const TOKEN_KEY = "colabora_tokens";
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export type Tokens = { access_token: string; refresh_token: string };
export type ApiEnvelope<T> = {
  data: T;
  status: boolean | string;
  message: string;
  error?: unknown;
  pagination?: { page: number; max_page: number; total: number };
};

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    skipRefresh?: boolean;
    retriedAfterRefresh?: boolean;
  }

  interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    skipRefresh?: boolean;
    retriedAfterRefresh?: boolean;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function saveTokens(tokens: Tokens) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
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

function getErrorDetail(body: unknown) {
  if (!body || typeof body !== "object") return "";
  const envelope = body as Partial<ApiEnvelope<unknown>>;
  if (typeof envelope.error === "string") return envelope.error;
  if (envelope.error && typeof envelope.error === "object") {
    return Object.values(envelope.error)
      .filter((value) => typeof value === "string")
      .join("; ");
  }
  return typeof envelope.message === "string" ? envelope.message : "";
}

function toApiError(error: AxiosError) {
  if (!error.response) {
    return new Error(
      "Tidak dapat menghubungi API COLABORA. Periksa koneksi lalu coba lagi.",
    );
  }
  return new ApiError(
    getErrorDetail(error.response.data) ||
      `Permintaan gagal (${error.response.status}).`,
    error.response.status,
  );
}

export const apiClient = axios.create({
  baseURL,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (!baseURL) throw new Error("NEXT_PUBLIC_API_BASE_URL belum dikonfigurasi.");
  if (!config.url?.startsWith("/api/"))
    throw new Error("Path API tidak valid.");

  config.headers = AxiosHeaders.from(config.headers);
  if (config.data && !(config.data instanceof FormData)) {
    config.headers.setContentType("application/json");
  }
  if (!config.skipAuth) {
    const tokens = readTokens();
    if (!tokens)
      throw new ApiError("Sesi berakhir. Silakan masuk kembali.", 401);
    config.headers.setAuthorization(`Bearer ${tokens.access_token}`);
  }
  return config;
});

let refreshing: Promise<void> | undefined;

async function refreshAccessToken() {
  const tokens = readTokens();
  if (!tokens)
    throw new ApiError("Sesi berakhir. Silakan masuk kembali.", 401);

  const response = await apiClient.post<ApiEnvelope<Tokens>>(
    "/api/auth/refresh",
    { refresh_token: tokens.refresh_token },
    { skipAuth: true, skipRefresh: true },
  );
  saveTokens(response.data.data);
}

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as Partial<ApiEnvelope<unknown>> | undefined;
    if (body?.status === false) {
      throw new ApiError(
        getErrorDetail(body) || `Permintaan gagal (${response.status}).`,
        response.status,
      );
    }
    return response;
  },
  async (error: unknown) => {
    if (error instanceof ApiError) throw error;
    if (!axios.isAxiosError(error)) throw error;

    const config = error.config as InternalAxiosRequestConfig | undefined;
    const canRefresh =
      error.response?.status === 401 &&
      config &&
      !config.skipAuth &&
      !config.skipRefresh &&
      !config.retriedAfterRefresh &&
      config.url !== "/api/auth/logout";

    if (!canRefresh) {
      if (error.response?.status === 401 && !config?.skipAuth) clearSession();
      throw toApiError(error);
    }

    config.retriedAfterRefresh = true;
    if (!refreshing) {
      refreshing = refreshAccessToken()
        .catch((refreshError: unknown) => {
          if (
            refreshError instanceof ApiError &&
            (refreshError.status === 400 || refreshError.status === 401)
          ) {
            clearSession();
            throw new ApiError("Sesi berakhir. Silakan masuk kembali.", 401);
          }
          throw refreshError;
        })
        .finally(() => {
          refreshing = undefined;
        });
    }
    await refreshing;
    const refreshed = readTokens();
    config.headers.setAuthorization(`Bearer ${refreshed?.access_token}`);
    return apiClient.request(config);
  },
);

export async function apiRequest<T>(
  path: string,
  config: Omit<AxiosRequestConfig, "baseURL" | "url"> = {},
  authenticated = true,
): Promise<ApiEnvelope<T>> {
  const requestConfig: AxiosRequestConfig = {
    ...config,
    url: path,
    skipAuth: !authenticated,
  };
  return (await apiClient.request<ApiEnvelope<T>>(requestConfig)).data;
}
