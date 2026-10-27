// List fields are stored as JSON strings for SQLite/Postgres portability.

export function parseList<T = string>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function toList(value: readonly unknown[] | null | undefined): string {
  return JSON.stringify(value ?? []);
}
