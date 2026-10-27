import type { ReminderKind } from "@/lib/constants";

const DAY = 86_400_000;

/**
 * Which reminder (if any) is due for a deadline. Windows are inclusive so a daily cron
 * never misses one: DAYS_7 fires when 1 < daysLeft ≤ 7, DAYS_1 when 0 < daysLeft ≤ 1.
 * Idempotency is enforced by the Reminder table's unique key.
 */
export function dueReminderKind(deadline: Date, now: Date): ReminderKind | null {
  const daysLeft = (deadline.getTime() - now.getTime()) / DAY;
  if (daysLeft <= 0) return null;
  if (daysLeft <= 1) return "DAYS_1";
  if (daysLeft <= 7) return "DAYS_7";
  return null;
}

export interface PendingReminder {
  userId: string;
  scholarshipId: string;
  kind: ReminderKind;
}

export function planReminders(
  saved: Array<{ userId: string; scholarshipId: string; deadline: Date }>,
  alreadySent: Set<string>,
  now: Date,
): PendingReminder[] {
  const out: PendingReminder[] = [];
  for (const s of saved) {
    const kind = dueReminderKind(s.deadline, now);
    if (kind && !alreadySent.has(reminderKey(s.userId, s.scholarshipId, kind))) {
      out.push({ userId: s.userId, scholarshipId: s.scholarshipId, kind });
    }
  }
  return out;
}

export const reminderKey = (userId: string, scholarshipId: string, kind: string) =>
  `${userId}:${scholarshipId}:${kind}`;
