import { z } from "zod";
import {
  APPLICATION_STATUSES,
  CATEGORIES,
  COUNTRY_CODES,
  COURSES,
  EDUCATION_LEVELS,
  GENDERS,
  MARKS_TYPES,
  OUTCOMES,
  PROVIDER_TYPES,
  STATE_CODES,
} from "@/lib/constants";

// Zod schemas for every API input. Shared by route handlers and client forms.

const nonEmpty = (max = 200) => z.string().trim().min(1).max(max);

export const signupSchema = z.object({
  name: nonEmpty(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Include a letter")
    .regex(/[0-9]/, "Include a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

export const profileSchema = z
  .object({
    country: z.enum(COUNTRY_CODES as [string, ...string[]]),
    state: z.enum(STATE_CODES as [string, ...string[]]).nullable().optional(),
    educationLevel: z.enum(EDUCATION_LEVELS).nullable().optional(),
    course: z.enum(COURSES).nullable().optional(),
    marksType: z.enum(MARKS_TYPES).default("PERCENT"),
    marks: z.number().min(0).max(100).nullable().optional(),
    familyIncome: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
    category: z.enum(CATEGORIES).nullable().optional(),
    isMinority: z.boolean().default(false),
    gender: z.enum(GENDERS).nullable().optional(),
    disability: z.boolean().default(false),
    dateOfBirth: z.coerce.date().max(new Date(), "Date of birth can't be in the future").nullable().optional(),
    emailReminders: z.boolean().default(true),
    completeOnboarding: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.marksType === "CGPA" && v.marks != null && v.marks > 10) {
      ctx.addIssue({ code: "custom", path: ["marks"], message: "CGPA must be between 0 and 10" });
    }
    if (v.country !== "IN" && v.state) {
      ctx.addIssue({ code: "custom", path: ["state"], message: "State applies to Indian residents only" });
    }
  });
export type ProfileInput = z.infer<typeof profileSchema>;

const csvBool = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => v === true || v === "true");

/** Comma-separated query param → validated enum list. */
const csvEnum = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : []))
    .pipe(z.array(z.enum(values)));

export const scholarshipQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  providerType: csvEnum(PROVIDER_TYPES),
  level: csvEnum(EDUCATION_LEVELS),
  state: z.enum(STATE_CODES as [string, ...string[]]).optional(),
  minAmount: z.coerce.number().int().min(0).optional(),
  maxAmount: z.coerce.number().int().min(0).optional(),
  deadlineWithin: z.coerce.number().int().min(1).max(365).optional(), // days
  eligibleOnly: csvBool.optional(),
  sort: z.enum(["match", "deadline", "amount"]).default("match"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ScholarshipQuery = z.infer<typeof scholarshipQuerySchema>;

export const ruleSchema = z.object({
  maxFamilyIncome: z.number().int().min(0).nullable().optional(),
  minMarksPercent: z.number().min(0).max(100).nullable().optional(),
  categories: z.array(z.enum(CATEGORIES)).default([]),
  minorityOnly: z.boolean().default(false),
  states: z.array(z.enum(STATE_CODES as [string, ...string[]])).default([]),
  genders: z.array(z.enum(GENDERS)).default([]),
  courses: z.array(z.enum(COURSES)).default([]),
  educationLevels: z.array(z.enum(EDUCATION_LEVELS)).default([]),
  countries: z.array(z.enum(COUNTRY_CODES as [string, ...string[]])).default([]),
  disabilityRequired: z.boolean().default(false),
  minAge: z.number().int().min(0).max(100).nullable().optional(),
  maxAge: z.number().int().min(0).max(100).nullable().optional(),
});
export type RuleInput = z.infer<typeof ruleSchema>;

export const scholarshipSchema = z.object({
  title: nonEmpty(160),
  provider: nonEmpty(120),
  providerType: z.enum(PROVIDER_TYPES),
  description: nonEmpty(4000),
  amountInr: z.number().int().min(0).max(100_000_000),
  amountLabel: z.string().trim().max(120).nullable().optional(),
  deadline: z.coerce.date(),
  applyUrl: z.string().trim().url().max(500),
  documents: z.array(nonEmpty(160)).max(30).default([]),
  benefits: z.array(nonEmpty(160)).max(20).default([]),
  tags: z.array(nonEmpty(40)).max(15).default([]),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // Omitted = leave unchanged on update; null = clear.
  lastVerifiedAt: z.coerce
    .date()
    .refine((d) => d.getTime() <= Date.now() + 86_400_000, "Verification date can't be in the future")
    .nullable()
    .optional(),
  rule: ruleSchema.default({}),
});
export type ScholarshipInput = z.infer<typeof scholarshipSchema>;

export const savedSchema = z.object({ scholarshipId: z.string().min(1).max(64) });

export const createApplicationSchema = z.object({
  scholarshipId: z.string().min(1).max(64),
  status: z.enum(APPLICATION_STATUSES).default("APPLYING"),
});

export const updateApplicationSchema = z
  .object({
    id: z.string().min(1).max(64),
    status: z.enum(APPLICATION_STATUSES),
    outcome: z.enum(OUTCOMES).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((v) => v.status === "RESULT" || !v.outcome, {
    path: ["outcome"],
    message: "Outcome is only allowed once status is RESULT",
  });
