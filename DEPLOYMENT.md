# Deployment checklist — Vercel + Neon

Work through this top to bottom the first time. Later deploys are just `git push`.

## 1. Before you start

- [ ] Fill in the operator name, jurisdiction and date in `lib/site.ts` (`operator`, `jurisdiction`, `legalUpdated`).
- [ ] Have the Privacy Policy, Terms and Disclaimer (`app/(site)/{privacy,terms,disclaimer}`) reviewed by someone
      qualified. They describe what the app does today; the 30-day backup and response promises must hold for your setup.
- [ ] Decide on the catalogue. `prisma/data/scholarships.ts` is **demo data** (approximate amounts, fake relative
      deadlines) and is not loaded in production. Prepare a verified CSV for the admin importer (template:
      Admin → Scholarships → Import), including `lastVerifiedAt`.
- [ ] Push the repo to GitHub/GitLab/Bitbucket. Check `.env` is **not** committed (`git ls-files .env` prints nothing).

## 2. Neon database

- [ ] Create a Neon project in the region closest to your Vercel functions (e.g. AWS `ap-southeast-1` Singapore for
      `sin1`, or `us-east-1` for the default `iad1`).
- [ ] From **Connection details**, copy two strings for the `main` branch:
  - **Pooled** (toggle "Connection pooling" on; host has `-pooler`) → `DATABASE_URL`. Append
    `&pgbouncer=true&connect_timeout=15`.
  - **Direct** (pooling off) → `DIRECT_URL`. Append `&connect_timeout=15`.
- [ ] Optional: install the Neon ↔ Vercel integration to get a database branch per preview deployment. Otherwise
      create a separate `preview` branch and use its strings for the Preview environment. **Never point Preview at the
      production branch** — preview builds run migrations too.

## 3. Email (SMTP)

- [ ] Create an account with an SMTP provider (Resend, Postmark, SES, Brevo…).
- [ ] Verify your sending domain (SPF + DKIM DNS records) and note host/port/user/password.

## 4. Google sign-in (optional)

- [ ] Google Cloud Console → OAuth consent screen (External, publish it) → Credentials → OAuth client (Web).
- [ ] Authorized redirect URI: `https://YOUR-DOMAIN/api/auth/callback/google`.

## 5. Vercel project

- [ ] Vercel → Add New → Project → import the repo. Framework is detected as Next.js; `vercel.json` sets the build
      command to `npm run vercel-build` (generate → `prisma migrate deploy` → `next build`).
- [ ] Settings → Functions → set the region to match Neon.
- [ ] Settings → Environment Variables — for **Production** (and Preview with its own values):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled string |
| `DIRECT_URL` | Neon direct string |
| `NEXTAUTH_URL` | `https://YOUR-DOMAIN` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` (different per environment) |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-DOMAIN` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | a monitored inbox |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` `EMAIL_FROM` | from step 3 |
| `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` | from step 4 (optional) |

  Do **not** set `SEED_*` or `ALLOW_DEMO_SEED` on Vercel.

- [ ] Deploy. In the build log, confirm `All migrations have been successfully applied` (or `No pending migrations`).

## 6. Domain

- [ ] Settings → Domains → add your domain, set the DNS records Vercel shows, wait for the certificate.
- [ ] If the domain differs from what you put in `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`, fix them and **redeploy**
      (`NEXT_PUBLIC_*` values are baked in at build time).

## 7. Create the admin (from your machine, once)

```bash
# PowerShell: $env:DATABASE_URL="<direct string>"; $env:SEED_ADMIN_EMAIL="you@…"; $env:SEED_ADMIN_PASSWORD="<12+ chars>"; npm run db:seed:admin
DATABASE_URL="<direct string>" SEED_ADMIN_EMAIL="you@your-domain.com" SEED_ADMIN_PASSWORD="<12+ chars>" npm run db:seed:admin
```

- [ ] Clear those variables from your shell history afterwards. To promote a Google-only account instead, use its email —
      the script sets the role (and a password) on the existing user.

## 8. Smoke test production

- [ ] `/`, `/scholarships`, `/privacy`, `/terms`, `/disclaimer` load; a bad URL shows the 404 page.
- [ ] Sign up a test student → onboarding → dashboard. Check the "agree to Terms" line on sign-up.
- [ ] Log in as admin → `/admin` works. As the student, `/admin` redirects and `GET /api/admin/stats` returns 403.
- [ ] Admin → import your verified CSV (or add one scholarship); the detail page shows **Last verified on …**.
- [ ] Rate limit: 11 wrong passwords for one email → "Too many attempts".
- [ ] Cron: `curl -i https://YOUR-DOMAIN/api/cron/reminders` → `401`; with
      `-H "Authorization: Bearer $CRON_SECRET"` → `200` JSON. Then Vercel → Settings → Cron Jobs shows the job;
      use "Run" once and check the function log.
- [ ] Reminder email: save a scholarship closing within 7 days as the test student, trigger the cron, check delivery
      (and spam folder).
- [ ] `https://YOUR-DOMAIN/robots.txt` allows crawling and lists the sitemap; a preview URL's `robots.txt` says
      `Disallow: /`.
- [ ] Share a link in a chat app / opengraph.xyz → the preview card image appears.

## 9. After launch

- [ ] Google Search Console: verify the domain, submit `/sitemap.xml`.
- [ ] Neon: confirm point-in-time restore retention matches the Privacy Policy promise ("removed from backups within 30 days"); the window depends on your plan.
- [ ] Vercel: enable log retention/alerts; consider Vercel Analytics (if you add it, update the cookie section of the
      Privacy Policy).
- [ ] Delete the test student account.
- [ ] Re-verify listings regularly; each edit updates the public "last verified" date.

## Notes

- **Cron on the Hobby plan** runs once a day within the scheduled hour (03:30 UTC ≈ 09:00 IST), not at the exact minute.
- **Reminder throughput:** the cron sends emails one by one within a 60 s function limit. That's fine for hundreds
  of reminders a day; beyond that, batch through your provider's bulk API or a queue.
- **Schema changes:** `npm run db:migrate -- --name <change>` locally, commit `prisma/migrations/`, push. Migrations
  run during the build, before the new code goes live; keep them backwards compatible (add columns as nullable
  first, drop in a later release).
- **Rollback:** Vercel → Deployments → "Promote" an earlier build. That does not roll back the database, which is
  another reason to keep migrations additive.
