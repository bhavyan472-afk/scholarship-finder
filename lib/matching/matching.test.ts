import { describe, expect, it } from "vitest";
import {
  INELIGIBLE_CAP,
  WEIGHTS,
  ageFrom,
  marksToPercent,
  matchScholarship,
  rankMatches,
  toMatchProfile,
  toMatchScholarship,
  type MatchProfile,
  type MatchRule,
  type MatchScholarship,
} from "./index";

const NOW = new Date("2026-06-01T00:00:00Z");
const inDays = (d: number) => new Date(NOW.getTime() + d * 86_400_000);

const rule = (overrides: Partial<MatchRule> = {}): MatchRule => ({
  categories: [],
  minorityOnly: false,
  states: [],
  genders: [],
  courses: [],
  educationLevels: [],
  countries: [],
  disabilityRequired: false,
  ...overrides,
});

const scholarship = (overrides: Partial<MatchScholarship> = {}): MatchScholarship => ({
  id: "s1",
  amountInr: 50_000,
  deadline: inDays(30),
  rule: rule(),
  ...overrides,
});

const student: MatchProfile = {
  country: "IN",
  state: "KA",
  educationLevel: "UG",
  course: "ENGINEERING",
  marksPercent: 85,
  familyIncome: 200_000,
  category: "SC",
  isMinority: false,
  gender: "FEMALE",
  disability: false,
  age: 20,
};

describe("hard filters", () => {
  it("is eligible when every specified rule passes", () => {
    const r = matchScholarship(
      student,
      scholarship({
        rule: rule({
          maxFamilyIncome: 250_000,
          minMarksPercent: 60,
          categories: ["SC", "ST"],
          states: ["KA"],
          genders: ["FEMALE"],
          courses: ["ENGINEERING"],
          educationLevels: ["UG"],
          countries: ["IN"],
        }),
      }),
      NOW,
    );
    expect(r.status).toBe("eligible");
    expect(r.missing).toEqual([]);
    expect(r.reasons).toHaveLength(8);
  });

  it.each([
    ["income above limit", { maxFamilyIncome: 150_000 }, "Family income must be under"],
    ["marks below minimum", { minMarksPercent: 90 }, "Requires at least 90%"],
    ["category not allowed", { categories: ["GENERAL" as const] }, "Only for General"],
    ["wrong state", { states: ["MH"] }, "Only for residents of Maharashtra"],
    ["wrong gender", { genders: ["MALE" as const] }, "Only for male"],
    ["wrong course", { courses: ["MEDICAL" as const] }, "Only for Medical"],
    ["wrong level", { educationLevels: ["PG" as const] }, "Only for Postgraduate"],
    ["wrong nationality", { countries: ["US"] }, "Only for nationals of United States"],
    ["disability required", { disabilityRequired: true }, "benchmark disabilities"],
    ["minority only", { minorityOnly: true }, "minority"],
    ["age above max", { maxAge: 18 }, "Age limit is up to 18"],
  ])("rejects when %s", (_label, overrides, message) => {
    const r = matchScholarship(student, scholarship({ rule: rule(overrides as Partial<MatchRule>) }), NOW);
    expect(r.status).toBe("ineligible");
    expect(r.missing.join(" ")).toContain(message);
  });

  it("treats income exactly at the limit as eligible", () => {
    const r = matchScholarship(student, scholarship({ rule: rule({ maxFamilyIncome: 200_000 }) }), NOW);
    expect(r.status).toBe("eligible");
  });

  it("rejects scholarships whose deadline has passed", () => {
    const r = matchScholarship(student, scholarship({ deadline: inDays(-1) }), NOW);
    expect(r.status).toBe("ineligible");
    expect(r.missing[0]).toMatch(/closed/i);
  });

  it("caps the score of ineligible scholarships", () => {
    const r = matchScholarship(
      student,
      scholarship({ amountInr: 2_000_000, rule: rule({ genders: ["MALE"] }) }),
      NOW,
    );
    expect(r.score).toBeLessThanOrEqual(INELIGIBLE_CAP);
  });
});

describe("unknown profile data", () => {
  it("marks a match as 'likely' and lists what to add", () => {
    const r = matchScholarship(
      { country: "IN" },
      scholarship({ rule: rule({ maxFamilyIncome: 250_000, minMarksPercent: 60 }) }),
      NOW,
    );
    expect(r.status).toBe("likely");
    expect(r.missing).toEqual(
      expect.arrayContaining([expect.stringMatching(/Add your family income/), expect.stringMatching(/Add your marks/)]),
    );
  });

  it("never lets unknown data out-score known passing data", () => {
    const s = scholarship({ rule: rule({ maxFamilyIncome: 250_000, minMarksPercent: 60, states: ["KA"] }) });
    const known = matchScholarship(student, s, NOW);
    const unknown = matchScholarship({ country: "IN" }, s, NOW);
    expect(known.score).toBeGreaterThan(unknown.score);
  });

  it("works with an empty profile and a rule-less scholarship", () => {
    const r = matchScholarship({}, scholarship({ rule: null }), NOW);
    expect(r.status).toBe("eligible");
    expect(r.score).toBeGreaterThan(0);
  });
});

describe("soft scoring", () => {
  it("keeps scores within 0..100 and breakdown weights summing to 100", () => {
    const r = matchScholarship(student, scholarship(), NOW);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.breakdown.reduce((s, f) => s + f.weight, 0)).toBe(100);
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
    for (const f of r.breakdown) expect(f.points).toBeLessThanOrEqual(f.weight);
  });

  it("scores higher academic headroom higher", () => {
    const s = scholarship({ rule: rule({ minMarksPercent: 60 }) });
    const strong = matchScholarship({ ...student, marksPercent: 95 }, s, NOW);
    const borderline = matchScholarship({ ...student, marksPercent: 61 }, s, NOW);
    expect(strong.score).toBeGreaterThan(borderline.score);
  });

  it("scores higher financial need higher under an income cap", () => {
    const s = scholarship({ rule: rule({ maxFamilyIncome: 800_000 }) });
    const needy = matchScholarship({ ...student, familyIncome: 100_000 }, s, NOW);
    const near = matchScholarship({ ...student, familyIncome: 790_000 }, s, NOW);
    expect(needy.score).toBeGreaterThan(near.score);
  });

  it("scores larger awards higher", () => {
    const small = matchScholarship(student, scholarship({ amountInr: 10_000 }), NOW);
    const large = matchScholarship(student, scholarship({ amountInr: 500_000 }), NOW);
    expect(large.score).toBeGreaterThan(small.score);
  });

  it("penalises deadlines too close to apply comfortably", () => {
    const rushed = matchScholarship(student, scholarship({ deadline: inDays(1) }), NOW);
    const comfy = matchScholarship(student, scholarship({ deadline: inDays(30) }), NOW);
    expect(comfy.score).toBeGreaterThan(rushed.score);
  });

  it("rewards targeted scholarships the student fits over open-to-all ones", () => {
    const targeted = matchScholarship(
      student,
      scholarship({ rule: rule({ categories: ["SC"], states: ["KA"], genders: ["FEMALE"], courses: ["ENGINEERING"] }) }),
      NOW,
    );
    const open = matchScholarship(student, scholarship(), NOW);
    expect(targeted.score).toBeGreaterThan(open.score);
  });
});

describe("rankMatches", () => {
  const list: MatchScholarship[] = [
    scholarship({ id: "closed", deadline: inDays(-3) }),
    scholarship({ id: "small", amountInr: 8_000 }),
    scholarship({ id: "big", amountInr: 600_000 }),
    scholarship({ id: "needs-data", amountInr: 600_000, rule: rule({ minAge: 18 }) }),
    scholarship({ id: "male-only", rule: rule({ genders: ["MALE"] }) }),
  ];

  it("excludes ineligible by default and orders eligible before likely", () => {
    const ranked = rankMatches({ ...student, age: null }, list, { now: NOW });
    expect(ranked.map((r) => r.scholarship.id)).toEqual(["big", "small", "needs-data"]);
  });

  it("can include ineligible results at the end", () => {
    const ranked = rankMatches(student, list, { now: NOW, includeIneligible: true });
    expect(ranked).toHaveLength(5);
    expect(ranked.slice(-2).every((r) => r.match.status === "ineligible")).toBe(true);
  });
});

describe("adapters", () => {
  it("converts CGPA to percentage and caps at 100", () => {
    expect(marksToPercent(8.2, "CGPA")).toBe(77.9);
    expect(marksToPercent(10.6, "CGPA")).toBe(100);
    expect(marksToPercent(72, "PERCENT")).toBe(72);
    expect(marksToPercent(null, "PERCENT")).toBeNull();
  });

  it("computes age correctly around birthdays", () => {
    expect(ageFrom(new Date("2006-06-02T00:00:00Z"), NOW)).toBe(19);
    expect(ageFrom(new Date("2006-05-31T00:00:00Z"), NOW)).toBe(20);
  });

  it("maps DB rows with JSON list columns", () => {
    const s = toMatchScholarship({
      id: "x",
      amountInr: 1000,
      deadline: NOW,
      rule: {
        maxFamilyIncome: null,
        minMarksPercent: 50,
        categories: '["SC"]',
        minorityOnly: false,
        states: "not json",
        genders: "[]",
        courses: "[]",
        educationLevels: '["UG","PG"]',
        countries: "[]",
        disabilityRequired: false,
        minAge: null,
        maxAge: null,
      },
    });
    expect(s.rule?.categories).toEqual(["SC"]);
    expect(s.rule?.states).toEqual([]);
    expect(s.rule?.educationLevels).toEqual(["UG", "PG"]);

    const p = toMatchProfile({
      country: "IN",
      state: null,
      educationLevel: "UG",
      course: null,
      marks: 9,
      marksType: "CGPA",
      familyIncome: null,
      category: null,
      isMinority: false,
      gender: null,
      disability: false,
      dateOfBirth: null,
    });
    expect(p.marksPercent).toBe(85.5);
    expect(p.age).toBeNull();
  });
});
