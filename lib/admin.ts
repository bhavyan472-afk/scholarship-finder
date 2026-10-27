import "server-only";
import { prisma } from "@/lib/prisma";

export async function getAdminStats(now: Date = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const [users, newUsers, onboarded, scholarships, active, saved, byStatus, topSaved, remindersSent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.studentProfile.count({ where: { onboardedAt: { not: null } } }),
    prisma.scholarship.count(),
    prisma.scholarship.count({ where: { isActive: true, deadline: { gte: now } } }),
    prisma.savedScholarship.count(),
    prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.scholarship.findMany({
      orderBy: { saved: { _count: "desc" } },
      take: 5,
      select: { id: true, title: true, _count: { select: { saved: true } } },
    }),
    prisma.reminder.count(),
  ]);

  return {
    users,
    newUsers,
    onboarded,
    scholarships,
    activeScholarships: active,
    saved,
    remindersSent,
    applicationsByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Record<string, number>,
    topSaved: topSaved.map((s) => ({ id: s.id, title: s.title, saves: s._count.saved })),
  };
}
