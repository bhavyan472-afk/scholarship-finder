import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { scholarshipData } from "../lib/scholarship-data";
import { slugify } from "../lib/utils";
import { scholarshipSchema } from "../lib/validators";
import { SCHOLARSHIPS } from "./data/scholarships";

const prisma = new PrismaClient();
const DAY = 86_400_000;

// Three modes, all idempotent:
//
//   npm run db:seed               Demo data: sample catalogue + demo admin/student with PUBLISHED passwords.
//                                 Refuses to run against a non-local database unless ALLOW_DEMO_SEED=1.
//   npm run db:seed:admin         Production: only creates/promotes the admin from SEED_ADMIN_EMAIL and
//                                 SEED_ADMIN_PASSWORD. No sample data, no demo accounts.
//   npm run db:seed:scholarships  Any database: inserts sample scholarships whose slug doesn't exist yet.
//                                 Never updates or deletes existing rows and creates no accounts.

/** The seed row as validated create data, with its deadline anchored `days` from `now`. */
function buildScholarship(seed: (typeof SCHOLARSHIPS)[number], now: number) {
  const { days, ...rest } = seed;
  // Validate seed rows through the same schema the admin API uses.
  const input = scholarshipSchema.parse({ ...rest, deadline: new Date(now + days * DAY), rule: rest.rule ?? {} });
  return { ...scholarshipData(input), slug: slugify(input.title) };
}

async function seedScholarshipsOnly() {
  const now = Date.now();
  const existing = new Set((await prisma.scholarship.findMany({ select: { slug: true } })).map((s) => s.slug));
  let created = 0;
  for (const seed of SCHOLARSHIPS) {
    const { scholarship, rule, slug } = buildScholarship(seed, now);
    if (existing.has(slug)) continue;
    await prisma.scholarship.create({ data: { ...scholarship, slug, rule: { create: rule } } });
    created++;
  }
  console.log(`Inserted ${created} scholarships; ${SCHOLARSHIPS.length - created} already existed and were left unchanged.`);
  console.log(`Catalogue now has ${await prisma.scholarship.count()} scholarships.`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!email || !email.includes("@")) throw new Error("Set SEED_ADMIN_EMAIL to the admin's email address.");
  if (password.length < 12) throw new Error("Set SEED_ADMIN_PASSWORD (at least 12 characters).");

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    create: { email, name: "Admin", role: "ADMIN", passwordHash },
    update: { role: "ADMIN", passwordHash },
  });
  console.log(`Admin ready: ${admin.email}`);
}

function assertDemoAllowed() {
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").hostname;
    } catch {
      return "";
    }
  })();
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
  if (!local && process.env.ALLOW_DEMO_SEED !== "1") {
    throw new Error(
      `Refusing to seed demo accounts (known passwords) into non-local database "${host}". ` +
        "Use `npm run db:seed:admin` for production, or set ALLOW_DEMO_SEED=1 for a dev/preview database.",
    );
  }
}

// Scholarships are upserted by slug; deadlines are re-anchored to "now" on every run so the
// demo always has open scholarships.
async function seedDemo() {
  assertDemoAllowed();
  const now = Date.now();
  let count = 0;

  for (const seed of SCHOLARSHIPS) {
    const { scholarship, rule, slug } = buildScholarship(seed, now);
    await prisma.scholarship.upsert({
      where: { slug },
      create: { ...scholarship, slug, rule: { create: rule } },
      update: { ...scholarship, rule: { upsert: { create: rule, update: rule } } },
    });
    count++;
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@scholarsphere.dev" },
    create: {
      email: "admin@scholarsphere.dev",
      name: "Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("Admin@12345", 12),
    },
    update: { role: "ADMIN" },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@scholarsphere.dev" },
    create: {
      email: "student@scholarsphere.dev",
      name: "Ananya Rao",
      passwordHash: await bcrypt.hash("Student@12345", 12),
    },
    update: {},
  });

  const profile = {
    country: "IN",
    state: "KA",
    educationLevel: "UG",
    course: "ENGINEERING",
    marksType: "PERCENT",
    marks: 88,
    familyIncome: 220000,
    category: "SC",
    gender: "FEMALE",
    dateOfBirth: new Date("2006-03-14"),
    onboardedAt: new Date(),
  };
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    create: { userId: student.id, ...profile },
    update: profile,
  });

  // Demo tracker data across every column.
  const demo: Array<[string, string, string | null]> = [
    ["aicte-pragati-scholarship-for-girls-degree", "SAVED", null],
    ["karnataka-ssp-post-matric-scholarship", "APPLYING", null],
    ["kotak-kanya-scholarship", "APPLYING", null],
    ["post-matric-scholarship-for-scheduled-caste-students", "APPLIED", null],
    ["reliance-foundation-undergraduate-scholarship", "RESULT", "AWARDED"],
  ];
  for (const [slug, status, outcome] of demo) {
    const s = await prisma.scholarship.findUnique({ where: { slug } });
    if (!s) throw new Error(`Seed references unknown scholarship slug: ${slug}`);
    await prisma.savedScholarship.upsert({
      where: { userId_scholarshipId: { userId: student.id, scholarshipId: s.id } },
      create: { userId: student.id, scholarshipId: s.id },
      update: {},
    });
    await prisma.application.upsert({
      where: { userId_scholarshipId: { userId: student.id, scholarshipId: s.id } },
      create: { userId: student.id, scholarshipId: s.id, status, outcome },
      update: { status, outcome },
    });
  }

  console.log(`Seeded ${count} scholarships.`);
  console.log(`Admin:   ${admin.email} / Admin@12345`);
  console.log(`Student: ${student.email} / Student@12345`);
}

(process.argv.includes("--admin-only")
  ? seedAdmin()
  : process.argv.includes("--scholarships-only")
    ? seedScholarshipsOnly()
    : seedDemo())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
