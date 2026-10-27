/**
 * Client IP for rate-limit keys. On Vercel, `x-forwarded-for` / `x-real-ip` are set by the
 * edge network and can't be spoofed by the client; elsewhere, put the app behind a proxy that does the same.
 */
export function ipFromHeaders(get: (name: string) => string | null | undefined): string {
  return get("x-real-ip")?.trim() || get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
