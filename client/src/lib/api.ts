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

// Access token lives only in memory (not localStorage) to limit XSS exposure.
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
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
  /** Skip the one-shot refresh-on-401 (used by refresh/login themselves). */
  skipRefresh?: boolean;
}

async function rawRequest(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (!opts.formData && opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    credentials: "include",
    body:
      opts.body === undefined
        ? undefined
        : opts.formData
          ? (opts.body as BodyInit)
          : JSON.stringify(opts.body),
  });
}

/** Attempt a single refresh; returns the new access token or null. */
async function tryRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: "{}",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

/** Core JSON request: attaches the token and refreshes once on a 401. */
export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, opts);

  if (res.status === 401 && !opts.skipRefresh) {
    const newToken = await tryRefresh();
    if (newToken) {
      res = await rawRequest(path, opts);
    } else {
      setAccessToken(null);
      onUnauthorized?.();
      throw await parseError(res);
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Fetch a binary resource (e.g. a credential document) as a Blob with the
 * access token attached, refreshing once on a 401. Used for authenticated
 * file viewing, since the token lives in memory and cannot ride an <a> tag.
 */
export async function apiBlob(path: string): Promise<Blob> {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: "include",
    });

  let res = await doFetch();
  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      res = await doFetch();
    } else {
      setAccessToken(null);
      onUnauthorized?.();
      throw await parseError(res);
    }
  }
  if (!res.ok) throw await parseError(res);
  return res.blob();
}
