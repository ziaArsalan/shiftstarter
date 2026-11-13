import { supabase } from "./supabase";

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Array<{ path: string; message: string }>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let code = "ERROR";
  let message = res.statusText || "Request failed";
  let details: ApiError["details"];
  try {
    const body = await res.json();
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      details = body.error.details;
    }
  } catch {
    /* non-JSON response */
  }
  return new ApiError(res.status, code, message, details);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Set true for multipart/FormData bodies (no JSON content-type). */
  formData?: boolean;
}

async function currentToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function rawRequest(path: string, opts: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {};
  if (!opts.formData && opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body:
      opts.body === undefined
        ? undefined
        : opts.formData
          ? (opts.body as BodyInit)
          : JSON.stringify(opts.body),
  });
}

/** Core JSON request: attaches the Supabase token and refreshes once on a 401. */
export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  let token = await currentToken();
  let res = await rawRequest(path, opts, token);

  if (res.status === 401) {
    const { data } = await supabase.auth.refreshSession();
    token = data.session?.access_token ?? null;
    if (token) {
      res = await rawRequest(path, opts, token);
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Fetch a binary resource (e.g. a credential document) as a Blob with the
 * Supabase access token attached, refreshing once on a 401.
 */
export async function apiBlob(path: string): Promise<Blob> {
  let token = await currentToken();
  let res = await rawRequest(path, {}, token);
  if (res.status === 401) {
    const { data } = await supabase.auth.refreshSession();
    token = data.session?.access_token ?? null;
    if (token) res = await rawRequest(path, {}, token);
  }
  if (!res.ok) throw await parseError(res);
  return res.blob();
}
