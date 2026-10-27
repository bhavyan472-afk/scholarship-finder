// Single source of truth for enum-like domain values. The DB stores these as strings
// (portable across SQLite/Postgres); Zod schemas in lib/validators.ts enforce them.

export const ROLES = ["STUDENT", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PROVIDER_TYPES = ["GOVERNMENT", "PRIVATE", "INTERNATIONAL"] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const EDUCATION_LEVELS = ["CLASS_10", "CLASS_12", "DIPLOMA", "UG", "PG", "PHD"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const COURSES = [
  "ENGINEERING",
  "MEDICAL",
  "SCIENCE",
  "COMMERCE",
  "ARTS",
  "LAW",
  "MANAGEMENT",
  "AGRICULTURE",
  "OTHER",
] as const;
export type Course = (typeof COURSES)[number];

export const CATEGORIES = ["GENERAL", "OBC", "SC", "ST", "EWS"] as const;
export type Category = (typeof CATEGORIES)[number];

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];

export const MARKS_TYPES = ["PERCENT", "CGPA"] as const;
export type MarksType = (typeof MARKS_TYPES)[number];

export const APPLICATION_STATUSES = ["SAVED", "APPLYING", "APPLIED", "RESULT"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const OUTCOMES = ["AWARDED", "REJECTED"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const REMINDER_KINDS = ["DAYS_7", "DAYS_1"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const LABELS = {
  providerType: { GOVERNMENT: "Government", PRIVATE: "Private", INTERNATIONAL: "International" },
  educationLevel: {
    CLASS_10: "Class 10",
    CLASS_12: "Class 12",
    DIPLOMA: "Diploma",
    UG: "Undergraduate",
    PG: "Postgraduate",
    PHD: "PhD",
  },
  course: {
    ENGINEERING: "Engineering",
    MEDICAL: "Medical",
    SCIENCE: "Science",
    COMMERCE: "Commerce",
    ARTS: "Arts & Humanities",
    LAW: "Law",
    MANAGEMENT: "Management",
    AGRICULTURE: "Agriculture",
    OTHER: "Other",
  },
  category: { GENERAL: "General", OBC: "OBC", SC: "SC", ST: "ST", EWS: "EWS" },
  gender: { MALE: "Male", FEMALE: "Female", OTHER: "Other" },
  status: { SAVED: "Saved", APPLYING: "Applying", APPLIED: "Applied", RESULT: "Result" },
  outcome: { AWARDED: "Awarded", REJECTED: "Not selected" },
} as const;

export const INDIAN_STATES = {
  AN: "Andaman & Nicobar",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CT: "Chhattisgarh",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HP: "Himachal Pradesh",
  HR: "Haryana",
  JH: "Jharkhand",
  JK: "Jammu & Kashmir",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  MH: "Maharashtra",
  ML: "Meghalaya",
  MN: "Manipur",
  MP: "Madhya Pradesh",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha",
  PB: "Punjab",
  PY: "Puducherry",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TG: "Telangana",
  TN: "Tamil Nadu",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UT: "Uttarakhand",
  WB: "West Bengal",
} as const;
export type StateCode = keyof typeof INDIAN_STATES;
export const STATE_CODES = Object.keys(INDIAN_STATES) as StateCode[];

export const COUNTRIES = {
  IN: "India",
  NP: "Nepal",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  US: "United States",
  GB: "United Kingdom",
  OTHER: "Other",
} as const;
export type CountryCode = keyof typeof COUNTRIES;
export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

export const PAGE_SIZE = 12;
