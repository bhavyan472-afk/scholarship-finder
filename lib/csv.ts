import Papa from "papaparse";
import { scholarshipSchema, type ScholarshipInput } from "@/lib/validators";

// CSV format for admin bulk import. List cells use "|" as a separator, e.g. "SC|ST".
export const CSV_COLUMNS = [
  "title",
  "provider",
  "providerType",
  "description",
  "amountInr",
  "amountLabel",
  "deadline",
  "applyUrl",
  "documents",
  "benefits",
  "tags",
  "featured",
  "maxFamilyIncome",
  "minMarksPercent",
  "categories",
  "minorityOnly",
  "states",
  "genders",
  "courses",
  "educationLevels",
  "countries",
  "disabilityRequired",
  "minAge",
  "maxAge",
  "lastVerifiedAt",
] as const;

export interface CsvRowError {
  row: number; // 1-based, excluding header
  message: string;
}

const list = (v?: string) =>
  (v ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
const upperList = (v?: string) => list(v).map((s) => s.toUpperCase());
const num = (v?: string) => (v == null || v.trim() === "" ? null : Number(v));
const bool = (v?: string) => /^(true|yes|1)$/i.test((v ?? "").trim());

export function parseScholarshipCsv(text: string): { rows: ScholarshipInput[]; errors: CsvRowError[] } {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const errors: CsvRowError[] = parsed.errors.map((e) => ({ row: (e.row ?? 0) + 1, message: e.message }));
  const missing = CSV_COLUMNS.slice(0, 8).filter((c) => !parsed.meta.fields?.includes(c));
  if (missing.length) return { rows: [], errors: [{ row: 0, message: `Missing required columns: ${missing.join(", ")}` }] };

  const rows: ScholarshipInput[] = [];
  parsed.data.forEach((r, i) => {
    const result = scholarshipSchema.safeParse({
      title: r.title,
      provider: r.provider,
      providerType: r.providerType?.trim().toUpperCase(),
      description: r.description,
      amountInr: num(r.amountInr),
      amountLabel: r.amountLabel?.trim() || null,
      deadline: r.deadline,
      applyUrl: r.applyUrl,
      documents: list(r.documents),
      benefits: list(r.benefits),
      tags: list(r.tags),
      featured: bool(r.featured),
      isActive: true,
      // Column absent or blank → keep the existing value on re-import.
      lastVerifiedAt: r.lastVerifiedAt?.trim() || undefined,
      rule: {
        maxFamilyIncome: num(r.maxFamilyIncome),
        minMarksPercent: num(r.minMarksPercent),
        categories: upperList(r.categories),
        minorityOnly: bool(r.minorityOnly),
        states: upperList(r.states),
        genders: upperList(r.genders),
        courses: upperList(r.courses),
        educationLevels: upperList(r.educationLevels),
        countries: upperList(r.countries),
        disabilityRequired: bool(r.disabilityRequired),
        minAge: num(r.minAge),
        maxAge: num(r.maxAge),
      },
    });
    if (result.success) rows.push(result.data);
    else
      errors.push({
        row: i + 1,
        message: result.error.issues.map((iss) => `${iss.path.join(".") || "row"}: ${iss.message}`).join("; "),
      });
  });
  return { rows, errors };
}

export const CSV_TEMPLATE =
  CSV_COLUMNS.join(",") +
  "\n" +
  [
    "Sample Merit Scholarship",
    "Sample Foundation",
    "PRIVATE",
    "\"Merit scholarship for engineering undergraduates.\"",
    "50000",
    "\"₹50,000/yr\"",
    "2026-12-31",
    "https://example.org/apply",
    "Aadhaar card|Class 12 marksheet",
    "Mentorship",
    "merit|engineering",
    "false",
    "600000",
    "70",
    "",
    "false",
    "",
    "",
    "ENGINEERING",
    "UG",
    "IN",
    "false",
    "",
    "",
    "2026-10-01",
  ].join(",") +
  "\n";
