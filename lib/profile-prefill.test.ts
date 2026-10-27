import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE } from "./profile";
import { applyPrefill, parseProfileText, prefillFromParams, prefillToParams } from "./profile-prefill";

describe("parseProfileText", () => {
  it("reads the landing-page example", () => {
    expect(parseProfileText("B.Tech, Telangana, 82%")).toEqual({
      level: "UG",
      course: "ENGINEERING",
      state: "TG",
      marks: 82,
      marksType: "PERCENT",
    });
  });

  it("reads CGPA, income, gender and category", () => {
    expect(parseProfileText("MSc physics girl from West Bengal, 8.4 CGPA, OBC, income 2.5 lakh")).toEqual({
      level: "PG",
      course: "SCIENCE",
      state: "WB",
      marks: 8.4,
      marksType: "CGPA",
      income: 250000,
      gender: "FEMALE",
      category: "OBC",
    });
  });

  it("does not read the 'Sc' in B.Sc as a category", () => {
    const p = parseProfileText("B.Sc maths, Kerala");
    expect(p.category).toBeUndefined();
    expect(p).toMatchObject({ level: "UG", course: "SCIENCE", state: "KL" });
  });

  it("prefers the longer state name", () => {
    expect(parseProfileText("Class 12, Andhra Pradesh").state).toBe("AP");
    expect(parseProfileText("Class 12, Andhra Pradesh").level).toBe("CLASS_12");
  });

  it("ignores text it doesn't understand", () => {
    expect(parseProfileText("hello there")).toEqual({});
  });
});

describe("prefill params", () => {
  it("round-trips through URL params", () => {
    const p = parseProfileText("B.Com, Maharashtra, 76%, SC");
    const params = Object.fromEntries(prefillToParams(p));
    expect(prefillFromParams(params)).toMatchObject(p);
  });

  it("drops invalid values", () => {
    expect(prefillFromParams({ level: "NOPE", state: "XX", marks: "180", income: "-5" })).toEqual({
      level: undefined,
      course: undefined,
      state: undefined,
      gender: undefined,
      category: undefined,
    });
  });

  it("only fills empty fields", () => {
    const values = applyPrefill({ ...EMPTY_PROFILE, state: "KA" }, { state: "TG", level: "UG", marks: 82, marksType: "PERCENT" });
    expect(values.state).toBe("KA");
    expect(values.educationLevel).toBe("UG");
    expect(values.marks).toBe("82");
  });
});
