// Client-side fetch helper that unwraps { data } and throws on { error }.

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body?.error;
    throw new FetchError(err?.message ?? `Request failed (${res.status})`, res.status, err?.code, err?.details);
  }
  return body?.data as T;
}

/** Pull the first field-level message out of a Zod-flattened VALIDATION_ERROR. */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof FetchError) || err.code !== "VALIDATION_ERROR") return {};
  const fe = (err.details as { fieldErrors?: Record<string, string[]> })?.fieldErrors ?? {};
  return Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v[0]]));
}
