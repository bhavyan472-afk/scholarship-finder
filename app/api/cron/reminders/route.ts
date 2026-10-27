import { timingSafeEqual } from "node:crypto";
import { ApiError, handler, ok } from "@/lib/api";
import { deadlineReminderEmail, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { pruneRateLimits } from "@/lib/rate-limit";
import { planReminders, reminderKey } from "@/lib/reminders";
import { absoluteUrl, daysUntil, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Fails closed when the secret is unset. */
function authorize(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const valid =
    Boolean(secret) &&
    header.length === expected.length &&
    timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  if (!valid) throw new ApiError(401, "UNAUTHORIZED", "Invalid cron secret");
}

/**
 * Sends 7-day and 1-day deadline reminders for saved scholarships.
 * Run daily (vercel.json). Idempotent via the Reminder (userId, scholarshipId, kind) unique key.
 */
async function run(req: Request) {
  authorize(req);
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 86_400_000);

  const saved = await prisma.savedScholarship.findMany({
    where: {
      scholarship: { isActive: true, deadline: { gt: now, lte: horizon } },
      user: { OR: [{ profile: null }, { profile: { emailReminders: true } }] },
    },
    include: { user: { select: { id: true, email: true, name: true } }, scholarship: true },
  });

  const sent = await prisma.reminder.findMany({
    where: { scholarshipId: { in: saved.map((s) => s.scholarshipId) } },
    select: { userId: true, scholarshipId: true, kind: true },
  });
  const sentKeys = new Set(sent.map((r) => reminderKey(r.userId, r.scholarshipId, r.kind)));

  const plan = planReminders(
    saved.map((s) => ({ userId: s.userId, scholarshipId: s.scholarshipId, deadline: s.scholarship.deadline })),
    sentKeys,
    now,
  );

  const byKey = new Map(saved.map((s) => [`${s.userId}:${s.scholarshipId}`, s]));
  let delivered = 0;
  const failures: string[] = [];

  for (const p of plan) {
    const s = byKey.get(`${p.userId}:${p.scholarshipId}`)!;
    try {
      // Claim the reminder first; a concurrent run hitting the unique key will skip.
      await prisma.reminder.create({ data: { userId: p.userId, scholarshipId: p.scholarshipId, kind: p.kind } });
    } catch {
      continue;
    }
    try {
      const email = deadlineReminderEmail({
        name: s.user.name,
        title: s.scholarship.title,
        provider: s.scholarship.provider,
        daysLeft: Math.max(1, daysUntil(s.scholarship.deadline, now)),
        deadline: formatDate(s.scholarship.deadline),
        url: absoluteUrl(`/scholarships/${s.scholarship.slug}`),
        applyUrl: s.scholarship.applyUrl,
      });
      await sendMail({ to: s.user.email, ...email });
      delivered++;
    } catch (err) {
      // Release the claim so the next run retries.
      await prisma.reminder.deleteMany({ where: { userId: p.userId, scholarshipId: p.scholarshipId, kind: p.kind } });
      failures.push(`${s.user.email}: ${(err as Error).message}`);
    }
  }

  const { count: rateLimitsPruned } = await pruneRateLimits(now);

  return ok({ checked: saved.length, planned: plan.length, delivered, failed: failures.length, failures, rateLimitsPruned });
}

export const GET = handler(run);
export const POST = handler(run);
