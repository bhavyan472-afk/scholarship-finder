// Fails the Vercel build when required environment variables are missing, so a misconfigured
// deployment never goes live (e.g. middleware redirecting every protected page to
// /api/auth/error?error=Configuration because NEXTAUTH_SECRET is unset). Prints names only, never values.

const required = ["DATABASE_URL", "DIRECT_URL"];
const isProduction = process.env.VERCEL_ENV === "production";
// Production must not point at localhost; when unset, NextAuth and lib/site.ts fall back to the Vercel domain.
const productionUrls = ["NEXTAUTH_URL", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"];

const problems = required.filter((name) => !process.env[name]?.trim()).map((name) => `${name} is not set`);
if (!process.env.NEXTAUTH_SECRET?.trim() && !process.env.AUTH_SECRET?.trim()) problems.push("NEXTAUTH_SECRET is not set");

if (isProduction) {
  for (const name of productionUrls) {
    const value = process.env[name];
    if (value && /localhost|127\.0\.0\.1/.test(value)) problems.push(`${name} points at localhost`);
  }
}

if (problems.length) {
  console.error("\n✖ Environment check failed:");
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    `\nSet these in Vercel → Project → Settings → Environment Variables (${process.env.VERCEL_ENV ?? "unknown"} environment), then redeploy. See .env.example.\n`,
  );
  process.exit(1);
}

console.log("✓ Environment check passed");
