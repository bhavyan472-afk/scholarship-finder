import { describe, expect, it } from "vitest";
import { dueReminderKind, planReminders, reminderKey } from "./reminders";

const NOW = new Date("2026-06-01T03:30:00Z");
const inDays = (d: number) => new Date(NOW.getTime() + d * 86_400_000);

describe("dueReminderKind", () => {
  it.each([
    [10, null],
    [7, "DAYS_7"],
    [3.5, "DAYS_7"],
    [1.01, "DAYS_7"],
    [1, "DAYS_1"],
    [0.2, "DAYS_1"],
    [0, null],
    [-2, null],
  ])("%s days left → %s", (days, kind) => {
    expect(dueReminderKind(inDays(days), NOW)).toBe(kind);
  });
});

describe("planReminders", () => {
  it("skips reminders that were already sent", () => {
    const saved = [
      { userId: "u1", scholarshipId: "a", deadline: inDays(5) },
      { userId: "u1", scholarshipId: "b", deadline: inDays(0.5) },
      { userId: "u2", scholarshipId: "a", deadline: inDays(5) },
      { userId: "u2", scholarshipId: "c", deadline: inDays(30) },
    ];
    const sent = new Set([reminderKey("u2", "a", "DAYS_7")]);
    expect(planReminders(saved, sent, NOW)).toEqual([
      { userId: "u1", scholarshipId: "a", kind: "DAYS_7" },
      { userId: "u1", scholarshipId: "b", kind: "DAYS_1" },
    ]);
  });
});
