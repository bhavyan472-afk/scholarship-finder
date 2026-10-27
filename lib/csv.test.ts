import { describe, expect, it } from "vitest";
import { CSV_TEMPLATE, parseScholarshipCsv } from "./csv";

describe("parseScholarshipCsv", () => {
  it("parses the bundled template", () => {
    const { rows, errors } = parseScholarshipCsv(CSV_TEMPLATE);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].documents).toEqual(["Aadhaar card", "Class 12 marksheet"]);
    expect(rows[0].rule.courses).toEqual(["ENGINEERING"]);
    expect(rows[0].rule.maxFamilyIncome).toBe(600000);
  });

  it("reports invalid rows with their row number", () => {
    const bad = CSV_TEMPLATE.replace("PRIVATE", "CHARITY");
    const { rows, errors } = parseScholarshipCsv(bad);
    expect(rows).toHaveLength(0);
    expect(errors[0].row).toBe(1);
    expect(errors[0].message).toContain("providerType");
  });

  it("rejects files missing required columns", () => {
    const { errors } = parseScholarshipCsv("title,provider\nA,B\n");
    expect(errors[0].message).toMatch(/Missing required columns/);
  });
});
