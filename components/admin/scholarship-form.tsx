"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Checkbox, FieldError, Label } from "@/components/ui/primitives";
import {
  CATEGORIES,
  COUNTRIES,
  COURSES,
  EDUCATION_LEVELS,
  GENDERS,
  INDIAN_STATES,
  LABELS,
  PROVIDER_TYPES,
} from "@/lib/constants";
import { api, fieldErrors } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { ScholarshipDTO } from "@/types";

type ListKey = "categories" | "states" | "genders" | "courses" | "educationLevels" | "countries";

interface FormState {
  title: string;
  provider: string;
  providerType: string;
  description: string;
  amountInr: string;
  amountLabel: string;
  deadline: string;
  applyUrl: string;
  documents: string;
  benefits: string;
  tags: string;
  featured: boolean;
  isActive: boolean;
  lastVerifiedAt: string;
  maxFamilyIncome: string;
  minMarksPercent: string;
  minAge: string;
  maxAge: string;
  minorityOnly: boolean;
  disabilityRequired: boolean;
  lists: Record<ListKey, string[]>;
}

/** YYYY-MM-DD in IST, for <input type="date">. */
const isoDay = (d: Date) => new Date(d.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);

const fromDTO = (s: ScholarshipDTO | null): FormState => ({
  title: s?.title ?? "",
  provider: s?.provider ?? "",
  providerType: s?.providerType ?? "GOVERNMENT",
  description: s?.description ?? "",
  amountInr: s ? String(s.amountInr) : "",
  amountLabel: s?.amountLabel ?? "",
  deadline: s ? s.deadline.slice(0, 10) : "",
  applyUrl: s?.applyUrl ?? "",
  documents: s?.documents.join("\n") ?? "",
  benefits: s?.benefits.join("\n") ?? "",
  tags: s?.tags.join(", ") ?? "",
  featured: s?.featured ?? false,
  isActive: s?.isActive ?? true,
  lastVerifiedAt: s?.lastVerifiedAt ? isoDay(new Date(s.lastVerifiedAt)) : "",
  maxFamilyIncome: s?.rule?.maxFamilyIncome != null ? String(s.rule.maxFamilyIncome) : "",
  minMarksPercent: s?.rule?.minMarksPercent != null ? String(s.rule.minMarksPercent) : "",
  minAge: s?.rule?.minAge != null ? String(s.rule.minAge) : "",
  maxAge: s?.rule?.maxAge != null ? String(s.rule.maxAge) : "",
  minorityOnly: s?.rule?.minorityOnly ?? false,
  disabilityRequired: s?.rule?.disabilityRequired ?? false,
  lists: {
    categories: s?.rule?.categories ?? [],
    states: s?.rule?.states ?? [],
    genders: s?.rule?.genders ?? [],
    courses: s?.rule?.courses ?? [],
    educationLevels: s?.rule?.educationLevels ?? [],
    countries: s?.rule?.countries ?? [],
  },
});

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const lines = (v: string, sep: RegExp) =>
  v
    .split(sep)
    .map((x) => x.trim())
    .filter(Boolean);

const toPayload = (f: FormState) => ({
  title: f.title,
  provider: f.provider,
  providerType: f.providerType,
  description: f.description,
  amountInr: Number(f.amountInr),
  amountLabel: f.amountLabel || null,
  // End of day IST so "closes on 31 Dec" includes the whole day.
  deadline: f.deadline ? `${f.deadline}T23:59:59+05:30` : "",
  applyUrl: f.applyUrl,
  documents: lines(f.documents, /\n/),
  benefits: lines(f.benefits, /\n/),
  tags: lines(f.tags, /,/),
  featured: f.featured,
  isActive: f.isActive,
  lastVerifiedAt: f.lastVerifiedAt ? `${f.lastVerifiedAt}T12:00:00+05:30` : null,
  rule: {
    maxFamilyIncome: num(f.maxFamilyIncome),
    minMarksPercent: num(f.minMarksPercent),
    minAge: num(f.minAge),
    maxAge: num(f.maxAge),
    minorityOnly: f.minorityOnly,
    disabilityRequired: f.disabilityRequired,
    ...f.lists,
  },
});

const LIST_OPTIONS: Array<{ key: ListKey; label: string; options: Array<[string, string]> }> = [
  { key: "educationLevels", label: "Education levels", options: EDUCATION_LEVELS.map((l) => [l, LABELS.educationLevel[l]]) },
  { key: "courses", label: "Courses", options: COURSES.map((c) => [c, LABELS.course[c]]) },
  { key: "categories", label: "Categories", options: CATEGORIES.map((c) => [c, LABELS.category[c]]) },
  { key: "genders", label: "Genders", options: GENDERS.map((g) => [g, LABELS.gender[g]]) },
  { key: "countries", label: "Nationalities", options: Object.entries(COUNTRIES) },
  { key: "states", label: "States", options: Object.entries(INDIAN_STATES) },
];

export function ScholarshipFormDialog({
  open,
  onOpenChange,
  scholarship,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  scholarship: ScholarshipDTO | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => fromDTO(scholarship));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const editing = Boolean(scholarship);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: ListKey, v: string) =>
    setForm((f) => ({
      ...f,
      lists: { ...f.lists, [k]: f.lists[k].includes(v) ? f.lists[k].filter((x) => x !== v) : [...f.lists[k], v] },
    }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      await api(editing ? `/api/admin/scholarships/${scholarship!.id}` : "/api/admin/scholarships", {
        method: editing ? "PUT" : "POST",
        json: toPayload(form),
      });
      toast.success(editing ? "Scholarship updated" : "Scholarship created");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error("Couldn't save scholarship", { description: (err as Error).message });
    } finally {
      setPending(false);
    }
  }

  const field = (id: keyof FormState, label: string, input: React.ReactNode, className?: string) => (
    <div className={cn("grid content-start gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {input}
      <FieldError message={errors[id]} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit scholarship" : "New scholarship"}</DialogTitle>
          <DialogDescription>Eligibility rules drive the matching engine. Leave a rule empty for “no restriction”.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("title", "Title", <Input id="title" required value={form.title} onChange={(e) => set("title", e.target.value)} />, "sm:col-span-2")}
            {field("provider", "Provider", <Input id="provider" required value={form.provider} onChange={(e) => set("provider", e.target.value)} />)}
            {field(
              "providerType",
              "Provider type",
              <Select id="providerType" value={form.providerType} onChange={(e) => set("providerType", e.target.value)}>
                {PROVIDER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LABELS.providerType[t]}
                  </option>
                ))}
              </Select>,
            )}
            {field(
              "description",
              "Description",
              <Textarea id="description" required value={form.description} onChange={(e) => set("description", e.target.value)} />,
              "sm:col-span-2",
            )}
            {field("amountInr", "Amount (₹ / year, for sorting)", <Input id="amountInr" type="number" min={0} required value={form.amountInr} onChange={(e) => set("amountInr", e.target.value)} />)}
            {field("amountLabel", "Amount label (optional)", <Input id="amountLabel" placeholder="e.g. ₹50,000/yr for 4 years" value={form.amountLabel} onChange={(e) => set("amountLabel", e.target.value)} />)}
            {field("deadline", "Deadline", <Input id="deadline" type="date" required value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />)}
            {field("applyUrl", "Official apply URL", <Input id="applyUrl" type="url" required value={form.applyUrl} onChange={(e) => set("applyUrl", e.target.value)} />)}
            {field("documents", "Documents (one per line)", <Textarea id="documents" value={form.documents} onChange={(e) => set("documents", e.target.value)} />)}
            {field("benefits", "Benefits (one per line)", <Textarea id="benefits" value={form.benefits} onChange={(e) => set("benefits", e.target.value)} />)}
            {field("tags", "Tags (comma separated)", <Input id="tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} />)}
            {field(
              "lastVerifiedAt",
              "Last verified against official source",
              <div className="flex gap-2">
                <Input
                  id="lastVerifiedAt"
                  type="date"
                  max={isoDay(new Date())}
                  value={form.lastVerifiedAt}
                  onChange={(e) => set("lastVerifiedAt", e.target.value)}
                />
                <Button type="button" variant="outline" onClick={() => set("lastVerifiedAt", isoDay(new Date()))}>
                  Today
                </Button>
              </div>,
            )}
          </div>

          <fieldset className="grid gap-4 rounded-xl border p-4">
            <legend className="px-1 text-sm font-semibold">Eligibility rules</legend>
            <div className="grid gap-4 sm:grid-cols-4">
              {field("maxFamilyIncome", "Max income (₹)", <Input id="maxFamilyIncome" type="number" min={0} value={form.maxFamilyIncome} onChange={(e) => set("maxFamilyIncome", e.target.value)} />)}
              {field("minMarksPercent", "Min marks (%)", <Input id="minMarksPercent" type="number" min={0} max={100} value={form.minMarksPercent} onChange={(e) => set("minMarksPercent", e.target.value)} />)}
              {field("minAge", "Min age", <Input id="minAge" type="number" min={0} value={form.minAge} onChange={(e) => set("minAge", e.target.value)} />)}
              {field("maxAge", "Max age", <Input id="maxAge" type="number" min={0} value={form.maxAge} onChange={(e) => set("maxAge", e.target.value)} />)}
            </div>
            {LIST_OPTIONS.map(({ key, label, options }) => (
              <div key={key} className="grid gap-2">
                <p className="text-sm font-medium" id={`lbl-${key}`}>
                  {label} <span className="font-normal text-muted-foreground">({form.lists[key].length || "any"})</span>
                </p>
                <div role="group" aria-labelledby={`lbl-${key}`} className={cn("flex flex-wrap gap-1.5", key === "states" && "max-h-32 overflow-y-auto")}>
                  {options.map(([value, text]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={form.lists[key].includes(value)}
                      onClick={() => toggle(key, value)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted",
                        form.lists[key].includes(value) && "border-primary/50 bg-primary/[0.08] font-medium text-primary",
                      )}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              <Checkbox label="Minority communities only" checked={form.minorityOnly} onChange={(e) => set("minorityOnly", e.target.checked)} />
              <Checkbox label="Disability required" checked={form.disabilityRequired} onChange={(e) => set("disabilityRequired", e.target.checked)} />
            </div>
          </fieldset>

          <div className="grid gap-2 sm:grid-cols-2">
            <Checkbox label="Featured on landing page" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
            <Checkbox label="Active (visible to students)" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {editing ? "Save changes" : "Create scholarship"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
