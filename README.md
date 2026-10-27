# ScholarSphere – Smart Scholarship Finder

Students build a profile once; ScholarSphere checks every government, state, private and international
scholarship against it, scores each match 0–100, explains **why you match** and **what you're missing**,
and tracks applications and deadlines through to the result.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn-style components on Radix ·
Framer Motion · Lucide · Prisma + PostgreSQL (Neon) · NextAuth (email + Google) ·
bcrypt · Zod · Nodemailer · Vitest

---

## Quick start

Requires Node.js 18.18+ (tested on Node 24).

Requires a PostgreSQL database: a free Neon dev branch, or locally
`docker run -d --name ss-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`.

```bash
npm install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
                              # then set DATABASE_URL and DIRECT_URL (see comments in the file)
npm run db:migrate            # apply migrations (prisma migrate dev); also runs the demo seed
npm run db:seed               # re-run any time: 56 scholarships + demo users
npm run dev                   # http://localhost:3000
```

The demo seed only runs against `localhost` databases unless `ALLOW_DEMO_SEED=1` (e.g. for a Neon dev branch),
because it creates accounts with the published passwords below.

### Demo accounts

| Role    | Email                       | Password        |
|---------|-----------------------------|-----------------|
| Student | `student@scholarsphere.dev` | `Student@12345` |
| Admin   | `admin@scholarsphere.dev`   | `Admin@12345`   |

The demo student (B.Tech, Karnataka, SC, female, 88%, ₹2.2L income) already has tracker cards in every column.

### Scripts

| Command             | What it does                                                  |
|---------------------|---------------------------------------------------------------|
| `npm run dev`       | Dev server                                                    |
| `npm run build`     | `prisma generate` + production build                          |
| `npm run vercel-build` | What Vercel runs: generate + `prisma migrate deploy` + build |
| `npm start`         | Serve the production build                                    |
| `npm test`          | Vitest unit tests (matching engine, reminders, CSV import)    |
| `npm run typecheck` | `tsc --noEmit`                                                |
| `npm run lint`      | ESLint (Next.js core-web-vitals rules)                        |
| `npm run db:migrate`| Create/apply migrations in dev (`prisma migrate dev`)         |
| `npm run db:deploy` | Apply pending migrations (`prisma migrate deploy`)            |
| `npm run db:seed`   | Demo seed (local DBs only) — re-anchors demo deadlines to "now" |
| `npm run db:seed:admin` | Production: create/promote admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` |
| `npm run db:reset`  | Drop all data, re-apply migrations, reseed (`prisma migrate reset`) |
| `npm run db:studio` | Prisma Studio                                                 |

> Seed deadlines are relative to the time you seed, so re-run `npm run db:seed` if demo deadlines have passed.

---

## Folder structure

```
app/
  (site)/                  public site: header + footer layout
    page.tsx               landing (hero, how-it-works, featured, stats, testimonials, FAQ)
    login/ signup/         auth pages
    onboarding/            4-step profile wizard
    scholarships/          search page + [id] detail page (accepts id or slug)
  dashboard/               overview · matches · tracker (Kanban) · profile
  admin/                   stats overview · scholarships CRUD + CSV import
  api/                     REST route handlers (see below)
  sitemap.ts robots.ts opengraph-image.tsx not-found.tsx error.tsx
components/
  ui/                      button, input/select/textarea, dialog, dropdown, tabs, primitives
  layout/ landing/ auth/ profile/ scholarships/ dashboard/ admin/
lib/
  matching/                ★ pure matching engine + tests (no DB / framework imports)
  api.ts                   route wrapper, error contract, requireUser/requireAdmin
  auth.ts                  NextAuth config (credentials + Google, JWT sessions)
  validators.ts            Zod schemas for every API input
  scholarships.ts          shared data access (search, matches, serialisers)
  reminders.ts mail.ts     deadline-reminder planning + email
  csv.ts rate-limit.ts constants.ts profile.ts utils.ts …
prisma/
  schema.prisma            data model
  seed.ts data/            seed script + 56-scholarship catalogue
types/                     shared DTOs + NextAuth type augmentation
middleware.ts              page protection, admin gate, onboarding redirect
```

## Data model

```
User ─┬─ 1:1 StudentProfile      country, state, level, course, marks(+type), income, category,
      │                          minority, gender, disability, DOB, emailReminders, onboardedAt
      ├─ 1:n SavedScholarship    @@unique(userId, scholarshipId)
      ├─ 1:n Application         status SAVED→APPLYING→APPLIED→RESULT, outcome AWARDED|REJECTED
      ├─ 1:n Reminder            kind DAYS_7|DAYS_1, @@unique(userId, scholarshipId, kind)
      └─ Account / Session       NextAuth adapter tables (+ VerificationToken)

Scholarship ── 1:1 EligibilityRule   maxFamilyIncome, minMarksPercent, categories[], minorityOnly,
                                      states[], genders[], courses[], educationLevels[], countries[],
                                      disabilityRequired, minAge, maxAge
```

Indexes cover deadline, provider type, amount, `(isActive, deadline)`, featured, `(userId, status)`.

**Storage decision:** enum-like fields are `String` (validated by Zod against `lib/constants.ts`) and list
fields are JSON strings (`lib/json.ts`) — a holdover from the original SQLite schema that keeps validation in one
place. `Scholarship.lastVerifiedAt` records when an admin last checked a listing against its official source.

---

## Matching engine (`lib/matching`)

Pure, deterministic (takes `now` as a parameter), framework-free and fully unit-tested.

1. **Hard filters** — 12 checks: deadline open, nationality, education level, course, min marks, income cap,
   category, minority, state, gender, disability, age. Each returns `pass`, `fail` or `unknown`
   (profile field missing). Any `fail` → **ineligible**; only `unknown`s → **likely eligible**.
2. **Soft score (0–100)** from five weighted factors:

   | Factor            | Weight | Signal                                                         |
   |-------------------|-------:|----------------------------------------------------------------|
   | Eligibility fit   | 40     | share of specified rules you pass (unknown = 0.4), boosted for targeted schemes |
   | Academic strength | 20     | headroom above the marks bar                                    |
   | Financial need    | 15     | how far under the income cap you are                            |
   | Award value       | 15     | log-scaled amount (₹5K → 0, ₹10L+ → 1)                          |
   | Time to apply     | 10     | penalises < 7 days left; ideal 7–60 days                        |

   Ineligible scholarships are capped at 35 so they always sort below viable ones.
3. **Explanations** — `reasons[]` (passed rules in plain English) and `missing[]` (failed rules +
   profile data needed), plus a per-criterion list and per-factor breakdown for the detail page.

CGPA is converted to % with the CBSE convention (× 9.5).

## API

All endpoints return `{ data }` on success and `{ error: { code, message, details? } }` on failure.
Every input is validated with Zod; protected routes call `requireUser()` / `requireAdmin()`.

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET/POST | `/api/auth/*` | – | NextAuth (credentials, Google) |
| POST | `/api/auth/signup` | – | Rate-limited: 5 / hour per IP |
| GET, PUT | `/api/profile` | user | `completeOnboarding: true` marks onboarding done |
| GET | `/api/scholarships` | optional | `q, providerType, level, state, minAmount, maxAmount, deadlineWithin, eligibleOnly, sort=match\|deadline\|amount, page, pageSize` |
| GET | `/api/scholarships/[id]` | optional | id or slug; includes full match when signed in |
| GET | `/api/match` | user | ranked eligible + likely matches |
| GET, POST, DELETE | `/api/saved` | user | save also adds a tracker card |
| GET, POST, PATCH | `/api/applications` | user | PATCH `{ id, status, outcome? }` |
| GET, POST | `/api/admin/scholarships` | admin | list (incl. hidden) / create |
| GET, PUT, DELETE | `/api/admin/scholarships/[id]` | admin | |
| GET, POST | `/api/admin/scholarships/import` | admin | GET = CSV template; POST multipart `file` or raw `text/csv` |
| GET | `/api/admin/stats` | admin | |
| GET/POST | `/api/cron/reminders` | `Bearer CRON_SECRET` | idempotent 7-day / 1-day emails |

Login attempts are rate-limited inside the credentials provider: 10 / 15 min per IP + email and 30 / 15 min per IP.
Counters live in the Postgres `RateLimit` table (hashed keys), so limits hold across serverless instances;
the daily cron prunes expired rows.

### CSV import format

Columns (header row required): `title, provider, providerType, description, amountInr, amountLabel, deadline,
applyUrl, documents, benefits, tags, featured, maxFamilyIncome, minMarksPercent, categories, minorityOnly,
states, genders, courses, educationLevels, countries, disabilityRequired, minAge, maxAge`.
List cells use `|` (e.g. `SC|ST`). Rows are upserted by title; invalid rows are reported with row numbers
and don't abort the import. Download the template from the admin import dialog.

## Deadline reminders

`/api/cron/reminders` finds saved scholarships closing within 7 days and sends a **DAYS_7** email
(1 < days ≤ 7) and a **DAYS_1** email (≤ 1 day). The `Reminder` unique key makes runs idempotent; a reminder is
claimed before sending and released if the send fails, so the next run retries it. Students can opt out
in their profile.

- **Dev:** leave `SMTP_HOST` empty — emails are printed to the server console.
- **Trigger manually:** `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders`
- **Vercel:** `vercel.json` schedules it daily at 03:30 UTC (09:00 IST); Vercel sends the bearer token automatically.

---

## Testing

```bash
npm test             # 41 unit tests
npm run typecheck
npm run lint
```

- `lib/matching/matching.test.ts` — every hard filter, unknown-data handling, score bounds and ordering
  properties, ranking, CGPA/age adapters.
- `lib/reminders.test.ts` — reminder windows and idempotency planning.
- `lib/csv.test.ts` — template round-trip, row-level errors, missing columns.

## Accessibility & design notes

- WCAG AA contrast for all token pairs in light and dark; visible focus rings; skip link.
- Native `<select>`, radios and checkboxes for robust keyboard and screen-reader support.
- Kanban cards can be moved by drag-and-drop **or** the per-card "Move to" select (keyboard accessible).
- Live regions announce result counts; countdown uses `role="timer"`; `prefers-reduced-motion` respected.
- Award figures use tabular numerals; a single "award gold" accent marks scores and highlights.

---

## Deploy (Vercel + Neon)

See **DEPLOYMENT.md** for the full step-by-step checklist. In short: set the env vars from `.env.example` in
Vercel; the build (`vercel-build`) runs `prisma migrate deploy` before `next build`; create the admin once with
`npm run db:seed:admin`; the reminder cron in `vercel.json` runs daily at 03:30 UTC (09:00 IST).

**Schema changes:** edit `prisma/schema.prisma`, run `npm run db:migrate -- --name <change>` locally, commit the
generated folder in `prisma/migrations/`. The next deploy applies it.

## Decisions & assumptions

- **Seed data** is modelled on real schemes (NSP, AICTE, state portals, CSR foundations, Chevening, Fulbright…)
  with representative amounts and rules; it links to the official sites. Always verify details there.
- **Amounts** are normalised to INR per year (`amountInr`) for filtering/sorting; `amountLabel` holds the
  human-readable/original-currency text.
- **Search & ranking** runs in memory after DB filtering — fine for hundreds or low thousands of schemes.
  For much larger catalogues, precompute per-user scores.
- **shadcn/ui:** components are hand-authored in the shadcn style on Radix primitives (same ownership model as
  the CLI output) to avoid the interactive generator.
- **Sessions** use JWT (required by NextAuth's credentials provider); role and onboarding state live in the token
  and refresh on `session.update()`.
- **Prisma 5.22** is pinned: Prisma 6/7 change client generation and config.
