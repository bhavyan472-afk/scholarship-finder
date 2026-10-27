import Link from "next/link";
import { ArrowRight, BellRing, ClipboardCheck, Quote, ScanSearch, UserRoundPen } from "lucide-react";
import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { FadeIn } from "@/components/motion";
import { ScholarshipCard } from "@/components/scholarships/scholarship-card";
import { Button } from "@/components/ui/button";
import { DbUnavailable } from "@/components/errors/db-unavailable";
import { prisma, withDbFallback } from "@/lib/prisma";
import { serializeScholarship } from "@/lib/scholarships";
import { formatInrCompact } from "@/lib/utils";

export const revalidate = 300;

async function queryLandingData() {
  const now = new Date();
  const open = { isActive: true, deadline: { gte: now } };
  const [featured, activeCount, sum, providers] = await Promise.all([
    prisma.scholarship.findMany({ where: { ...open, featured: true }, include: { rule: true }, orderBy: { deadline: "asc" }, take: 6 }),
    prisma.scholarship.count({ where: open }),
    prisma.scholarship.aggregate({ where: open, _sum: { amountInr: true } }),
    prisma.scholarship.groupBy({ by: ["provider"], where: open }),
  ]);
  return {
    featured: featured.map((s) => ({ ...serializeScholarship(s), match: null, saved: false })),
    activeCount,
    totalValue: sum._sum.amountInr ?? 0,
    providerCount: providers.length,
  };
}

/** Null when the database is unreachable — the static parts of the page still render. */
const getLandingData = () => withDbFallback(queryLandingData, null);

const STEPS = [
  {
    icon: UserRoundPen,
    title: "Build your profile",
    body: "Education, marks, family income, category, state — a two-minute wizard. Only what eligibility rules actually check.",
  },
  {
    icon: ScanSearch,
    title: "Get ranked matches",
    body: "Our engine filters out what you can't get, then scores the rest 0–100 and tells you why you fit and what you're missing.",
  },
  {
    icon: ClipboardCheck,
    title: "Apply & track",
    body: "Save scholarships, move them across your tracker from Applying to Result, and get emailed before every deadline.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I'd only ever heard of NSP. ScholarSphere found three state and CSR scholarships I qualified for — I'm now funded through my second year.",
    name: "Priya S.",
    meta: "B.Tech, Karnataka",
  },
  {
    quote: "The 'what you're missing' list is the best part. It told me I needed an income certificate before I wasted a week on the portal.",
    name: "Rahul M.",
    meta: "B.Com, Uttar Pradesh",
  },
  {
    quote: "Comparing Chevening, Commonwealth and DAAD side-by-side with deadlines in one calendar saved my application season.",
    name: "Fatima K.",
    meta: "MA applicant, Telangana",
  },
];

export default async function LandingPage() {
  const data = await getLandingData();
  const activeCount = data?.activeCount ?? null;

  const stats = [
    { value: data ? String(data.activeCount) : "—", label: "open scholarships" },
    { value: data ? formatInrCompact(data.totalValue) : "—", label: "in annual awards indexed" },
    { value: data ? String(data.providerCount) : "—", label: "government, CSR & global providers" },
    { value: "12", label: "eligibility rules checked per match" },
  ];

  return (
    <>
      <Hero activeCount={activeCount} />

      <section aria-label="Platform statistics" className="border-y bg-muted/30">
        <dl className="container grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.05} className="px-2 md:border-l md:px-6 md:first:border-l-0 md:first:pl-0">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <p className="text-3xl font-semibold tracking-tight tabular">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </dd>
            </FadeIn>
          ))}
        </dl>
      </section>

      <section id="how-it-works" className="container scroll-mt-20 py-24">
        <FadeIn className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">From profile to funded in three steps.</h2>
        </FadeIn>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.08}>
              <li className="relative h-full rounded-xl border bg-card p-6 shadow-soft">
                <span className="absolute right-5 top-5 font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            </FadeIn>
          ))}
        </ol>
      </section>

      <section className="border-y bg-muted/30 py-24">
        <div className="container">
          <FadeIn className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">Featured</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Closing soon, worth your time.</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/scholarships">
                View all{activeCount !== null && ` ${activeCount}`} <ArrowRight />
              </Link>
            </Button>
          </FadeIn>
          {data ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.featured.map((s, i) => (
                <FadeIn key={s.id} delay={i * 0.05} className="h-full">
                  <ScholarshipCard item={s} />
                </FadeIn>
              ))}
            </div>
          ) : (
            <DbUnavailable retryHref="/" className="mt-10" />
          )}
        </div>
      </section>

      <section className="container py-24" aria-labelledby="testimonials">
        <FadeIn className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Students</p>
          <h2 id="testimonials" className="mt-2 text-3xl font-semibold sm:text-4xl">
            Built for the students who need it most.
          </h2>
        </FadeIn>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-xl border bg-card p-6 shadow-soft">
                <Quote className="size-5 text-accent" aria-hidden />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-6 border-t pt-4 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground"> · {t.meta}</span>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </section>

      <section id="faq" className="container scroll-mt-20 pb-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <FadeIn>
            <p className="text-sm font-semibold text-primary">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Questions, answered.</h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Still unsure? Write to us at{" "}
              <a className="font-medium text-foreground underline-offset-4 hover:underline" href="mailto:hello@scholarsphere.app">
                hello@scholarsphere.app
              </a>
              .
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <Faq />
          </FadeIn>
        </div>
      </section>

      <section className="container pb-24">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl bg-navy px-6 py-14 text-center text-white sm:px-12">
            <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(50%_80%_at_20%_0%,hsl(236_80%_55%/0.5),transparent),radial-gradient(40%_70%_at_90%_100%,hsl(38_95%_55%/0.35),transparent)]" />
            <div className="relative">
              <BellRing className="mx-auto size-6 text-accent" aria-hidden />
              <h2 className="mx-auto mt-4 max-w-xl text-3xl font-semibold sm:text-4xl">Never miss another deadline.</h2>
              <p className="mx-auto mt-3 max-w-md text-white/75">
                Create your free profile and see every scholarship you qualify for in under two minutes.
              </p>
              <Button asChild size="lg" variant="accent" className="mt-8">
                <Link href="/signup">
                  Get my matches <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
