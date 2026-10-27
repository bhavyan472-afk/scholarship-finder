// Profile completeness — pure, safe for client and server.

export interface ProfileLike {
  country?: string | null;
  state?: string | null;
  educationLevel?: string | null;
  course?: string | null;
  marks?: number | null;
  familyIncome?: number | null;
  category?: string | null;
  gender?: string | null;
  dateOfBirth?: Date | string | null;
}

const FIELDS: Array<{ key: keyof ProfileLike; label: string; weight: number }> = [
  { key: "educationLevel", label: "Education level", weight: 15 },
  { key: "course", label: "Course / stream", weight: 15 },
  { key: "marks", label: "Marks / CGPA", weight: 15 },
  { key: "familyIncome", label: "Family income", weight: 15 },
  { key: "category", label: "Category", weight: 10 },
  { key: "state", label: "State", weight: 10 },
  { key: "gender", label: "Gender", weight: 10 },
  { key: "dateOfBirth", label: "Date of birth", weight: 5 },
  { key: "country", label: "Nationality", weight: 5 },
];

export function profileCompleteness(p: ProfileLike | null | undefined) {
  if (!p) return { percent: 0, missing: FIELDS.map((f) => f.label) };
  const isIndia = (p.country ?? "IN") === "IN";
  const relevant = FIELDS.filter((f) => isIndia || f.key !== "state");
  const total = relevant.reduce((s, f) => s + f.weight, 0);
  const filled = relevant.filter((f) => p[f.key] != null && p[f.key] !== "");
  return {
    percent: Math.round((filled.reduce((s, f) => s + f.weight, 0) / total) * 100),
    missing: relevant.filter((f) => !filled.includes(f)).map((f) => f.label),
  };
}

/** Form-state shape shared by the onboarding wizard and profile editor. */
export interface ProfileValues {
  country: string;
  state: string;
  gender: string;
  dateOfBirth: string;
  educationLevel: string;
  course: string;
  marksType: "PERCENT" | "CGPA";
  marks: string;
  familyIncome: string;
  category: string;
  isMinority: boolean;
  disability: boolean;
  emailReminders: boolean;
}

export const EMPTY_PROFILE: ProfileValues = {
  country: "IN",
  state: "",
  gender: "",
  dateOfBirth: "",
  educationLevel: "",
  course: "",
  marksType: "PERCENT",
  marks: "",
  familyIncome: "",
  category: "",
  isMinority: false,
  disability: false,
  emailReminders: true,
};
