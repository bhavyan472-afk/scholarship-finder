"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, GraduationCap, HandCoins, UserRound, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Checkbox, FieldError, Label, Progress } from "@/components/ui/primitives";
import {
  CATEGORIES,
  COUNTRIES,
  COURSES,
  EDUCATION_LEVELS,
  GENDERS,
  INDIAN_STATES,
  LABELS,
} from "@/lib/constants";
import { api, fieldErrors } from "@/lib/fetcher";
import { profileCompleteness, type ProfileValues } from "@/lib/profile";

import { cn, formatInr } from "@/lib/utils";

const STEPS = [
  { id: "about", title: "About you", description: "Nationality and residence decide which national and state schemes apply.", icon: UserRound },
  { id: "education", title: "Education", description: "Your current level, stream and most recent marks.", icon: GraduationCap },
  { id: "background", title: "Background", description: "Used only for eligibility checks. Never shared.", icon: HandCoins },
  { id: "review", title: "Review", description: "Check everything looks right.", icon: BellRing },
] as const;

const INCOME_PRESETS = [100000, 250000, 450000, 800000];

const toPayload = (v: ProfileValues) => ({
  country: v.country,
  state: v.country === "IN" && v.state ? v.state : null,
  gender: v.gender || null,
  dateOfBirth: v.dateOfBirth || null,
  educationLevel: v.educationLevel || null,
  course: v.course || null,
  marksType: v.marksType,
  marks: v.marks === "" ? null : Number(v.marks),
  familyIncome: v.familyIncome === "" ? null : Math.round(Number(v.familyIncome)),
  category: v.category || null,
  isMinority: v.isMinority,
  disability: v.disability,
  emailReminders: v.emailReminders,
});

export function ProfileForm({ initial, mode }: { initial: ProfileValues; mode: "wizard" | "edit" }) {
  const router = useRouter();
  const { update } = useSession();
  const [values, setValues] = useState<ProfileValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [pending, setPending] = useState(false);

  const set = <K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const completeness = useMemo(() => profileCompleteness(toPayload(values)), [values]);

  function validateStep(i: number): boolean {
    const e: Record<string, string> = {};
    if (STEPS[i].id === "about" && values.country === "IN" && !values.state) e.state = "Select your state to see state schemes";
    if (STEPS[i].id === "education") {
      if (!values.educationLevel) e.educationLevel = "Select your education level";
      if (!values.course) e.course = "Select your course or stream";
      if (values.marks !== "") {
        const m = Number(values.marks);
        const max = values.marksType === "CGPA" ? 10 : 100;
        if (Number.isNaN(m) || m < 0 || m > max) e.marks = `Enter a value between 0 and ${max}`;
      }
    }
    if (STEPS[i].id === "background" && values.familyIncome !== "" && Number(values.familyIncome) < 0) {
      e.familyIncome = "Income can't be negative";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const go = (to: number) => {
    if (to > step && !validateStep(step)) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

  async function submit() {
    if (mode === "edit" && ![0, 1, 2].every((i) => validateStep(i))) return;
    setPending(true);
    try {
      await api("/api/profile", { method: "PUT", json: { ...toPayload(values), completeOnboarding: mode === "wizard" } });
      await update(); // refresh JWT so middleware sees onboarded = true
      if (mode === "wizard") {
        toast.success("Profile saved", { description: "Here are your matches." });
        router.push("/dashboard");
      } else {
        toast.success("Profile updated", { description: "Your match scores have been recalculated." });
      }
      router.refresh();
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      toast.error("Couldn't save your profile", { description: (err as Error).message });
    } finally {
      setPending(false);
    }
  }

  const sections: Record<(typeof STEPS)[number]["id"], React.ReactNode> = {
    about: (
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nationality" htmlFor="country">
          <Select id="country" value={values.country} onChange={(e) => set("country", e.target.value)}>
            {Object.entries(COUNTRIES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        {values.country === "IN" && (
          <Field label="State / UT of residence" htmlFor="state" error={errors.state}>
            <Select id="state" value={values.state} onChange={(e) => set("state", e.target.value)} aria-invalid={!!errors.state}>
              <option value="">Select state</option>
              {Object.entries(INDIAN_STATES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Gender" htmlFor="gender" hint="Some schemes are reserved for girls and women.">
          <Choice
            name="gender"
            value={values.gender}
            onChange={(v) => set("gender", v)}
            options={GENDERS.map((g) => ({ value: g, label: LABELS.gender[g] }))}
          />
        </Field>
        <Field label="Date of birth" htmlFor="dob" hint="Used for age limits (e.g. Rhodes, Inlaks)." error={errors.dateOfBirth}>
          <Input
            id="dob"
            type="date"
            value={values.dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => set("dateOfBirth", e.target.value)}
          />
        </Field>
      </div>
    ),
    education: (
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Current education level" htmlFor="level" error={errors.educationLevel}>
          <Select
            id="level"
            value={values.educationLevel}
            onChange={(e) => set("educationLevel", e.target.value)}
            aria-invalid={!!errors.educationLevel}
          >
            <option value="">Select level</option>
            {EDUCATION_LEVELS.map((l) => (
              <option key={l} value={l}>
                {LABELS.educationLevel[l]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Course / stream" htmlFor="course" error={errors.course}>
          <Select id="course" value={values.course} onChange={(e) => set("course", e.target.value)} aria-invalid={!!errors.course}>
            <option value="">Select course</option>
            {COURSES.map((c) => (
              <option key={c} value={c}>
                {LABELS.course[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Score format" htmlFor="marksType">
          <Choice
            name="marksType"
            value={values.marksType}
            onChange={(v) => set("marksType", v as ProfileValues["marksType"])}
            options={[
              { value: "PERCENT", label: "Percentage" },
              { value: "CGPA", label: "CGPA (10-pt)" },
            ]}
          />
        </Field>
        <Field
          label={values.marksType === "CGPA" ? "Latest CGPA" : "Latest percentage"}
          htmlFor="marks"
          error={errors.marks}
          hint={values.marksType === "CGPA" ? "Converted to % as CGPA × 9.5." : "From your most recent exam or semester."}
        >
          <div className="relative">
            <Input
              id="marks"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              max={values.marksType === "CGPA" ? 10 : 100}
              value={values.marks}
              onChange={(e) => set("marks", e.target.value)}
              aria-invalid={!!errors.marks}
              className="pr-14"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-muted-foreground">
              {values.marksType === "CGPA" ? "/ 10" : "%"}
            </span>
          </div>
        </Field>
      </div>
    ),
    background: (
      <div className="grid gap-5">
        <Field label="Annual family income" htmlFor="income" error={errors.familyIncome} hint="Total yearly income of parents/guardians, in ₹.">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-muted-foreground">₹</span>
            <Input
              id="income"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={values.familyIncome}
              onChange={(e) => set("familyIncome", e.target.value)}
              className="pl-7 font-mono tabular"
              placeholder="250000"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Common income thresholds">
            {INCOME_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("familyIncome", String(p))}
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-xs transition-colors hover:bg-muted",
                  Number(values.familyIncome) === p && "border-primary/50 bg-primary/5 text-primary",
                )}
              >
                ≤ {formatInr(p)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Category" htmlFor="category" hint="Determines eligibility for reserved-category schemes.">
          <Choice
            name="category"
            value={values.category}
            onChange={(v) => set("category", v)}
            options={CATEGORIES.map((c) => ({ value: c, label: LABELS.category[c] }))}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox
            label="I belong to a notified minority community"
            description="Muslim, Christian, Sikh, Buddhist, Jain or Parsi"
            checked={values.isMinority}
            onChange={(e) => set("isMinority", e.target.checked)}
          />
          <Checkbox
            label="I have a benchmark disability"
            description="40% or more, with a UDID / disability certificate"
            checked={values.disability}
            onChange={(e) => set("disability", e.target.checked)}
          />
        </div>
      </div>
    ),
    review: (
      <div className="grid gap-5">
        <dl className="grid gap-x-6 gap-y-3 rounded-xl border bg-muted/30 p-5 text-sm sm:grid-cols-2">
          {[
            ["Nationality", COUNTRIES[values.country as keyof typeof COUNTRIES]],
            ["State", values.state ? INDIAN_STATES[values.state as keyof typeof INDIAN_STATES] : "—"],
            ["Gender", values.gender ? LABELS.gender[values.gender as keyof typeof LABELS.gender] : "—"],
            ["Date of birth", values.dateOfBirth || "—"],
            ["Level", values.educationLevel ? LABELS.educationLevel[values.educationLevel as keyof typeof LABELS.educationLevel] : "—"],
            ["Course", values.course ? LABELS.course[values.course as keyof typeof LABELS.course] : "—"],
            ["Marks", values.marks ? `${values.marks}${values.marksType === "CGPA" ? " CGPA" : "%"}` : "—"],
            ["Family income", values.familyIncome ? formatInr(Number(values.familyIncome)) : "—"],
            ["Category", values.category ? LABELS.category[values.category as keyof typeof LABELS.category] : "—"],
            ["Minority / Disability", `${values.isMinority ? "Yes" : "No"} / ${values.disability ? "Yes" : "No"}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-dashed pb-2 last:border-0 sm:[&:nth-last-child(2)]:border-0">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <Checkbox
          label="Email me deadline reminders"
          description="7 days and 1 day before saved scholarships close."
          checked={values.emailReminders}
          onChange={(e) => set("emailReminders", e.target.checked)}
        />
      </div>
    ),
  };

  if (mode === "edit") {
    return (
      <div className="grid gap-6">
        {STEPS.slice(0, 3).map((s) => (
          <section key={s.id} className="rounded-xl border bg-card p-5 shadow-soft sm:p-6" aria-labelledby={`sec-${s.id}`}>
            <header className="mb-5">
              <h2 id={`sec-${s.id}`} className="font-semibold">
                {s.title}
              </h2>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </header>
            {sections[s.id]}
          </section>
        ))}
        <section className="rounded-xl border bg-card p-5 shadow-soft sm:p-6">
          <Checkbox
            label="Email me deadline reminders"
            description="7 days and 1 day before saved scholarships close."
            checked={values.emailReminders}
            onChange={(e) => set("emailReminders", e.target.checked)}
          />
        </section>
        <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-xl border bg-background/85 p-3 pl-5 shadow-lift backdrop-blur">
          <p className="text-sm text-muted-foreground">
            Profile <span className="font-mono font-medium text-foreground">{completeness.percent}%</span> complete
          </p>
          <Button onClick={submit} loading={pending}>
            Save changes
          </Button>
        </div>
      </div>
    );
  }

  const current = STEPS[step];
  return (
    <div className="rounded-2xl border bg-card shadow-lift">
      <div className="border-b p-5 sm:p-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step <span className="font-mono text-foreground">{step + 1}</span> of {STEPS.length}
          </span>
          <span>
            <span className="font-mono text-foreground">{completeness.percent}%</span> complete
          </span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} label="Onboarding progress" className="mt-3" />
        <ol className="mt-4 hidden grid-cols-4 gap-2 sm:grid" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => i < step && go(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 text-left text-xs font-medium transition-colors",
                  i === step ? "text-foreground" : i < step ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/60",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border text-[10px]",
                    i < step && "border-primary bg-primary text-primary-foreground",
                    i === step && "border-primary text-primary",
                  )}
                >
                  {i < step ? <Check className="size-3" /> : i + 1}
                </span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative overflow-hidden p-5 sm:p-6">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={current.id}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="mb-6 flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <current.icon className="size-4" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold">{current.title}</h2>
                <p className="text-sm text-muted-foreground">{current.description}</p>
              </div>
            </header>
            {sections[current.id]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3 border-t p-4 sm:px-6">
        <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
          <ArrowLeft /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => go(step + 1)}>
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button onClick={submit} loading={pending}>
            See my matches <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <FieldError message={error} /> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Segmented radio group — keyboard accessible via native radios. */
function Choice({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div role="radiogroup" id={name} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            value === o.value && "border-primary/50 bg-primary/[0.06] font-medium text-primary",
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
