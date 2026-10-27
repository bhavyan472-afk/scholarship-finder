import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { PageTransition } from "@/components/motion";
import { ProfileForm } from "@/components/profile/profile-form";
import { authOptions } from "@/lib/auth";
import { applyPrefill, prefillFromParams, prefillToParams } from "@/lib/profile-prefill";
import { getProfileFormValues } from "@/lib/profile-server";

export const metadata: Metadata = { title: "Build your profile", robots: { index: false } };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  // Prefill comes from the landing-page search ("B.Tech, Telangana, 82%") and only fills blank fields.
  const prefill = prefillFromParams(searchParams);
  const session = await getServerSession(authOptions);
  if (!session) {
    const query = prefillToParams(prefill).toString();
    redirect(`/login?callbackUrl=${encodeURIComponent(`/onboarding${query ? `?${query}` : ""}`)}`);
  }
  const initial = applyPrefill(await getProfileFormValues(session.user.id), prefill);

  return (
    <div className="relative">
      <div className="mesh pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70" aria-hidden />
      <PageTransition className="container relative max-w-2xl py-12 sm:py-16">
        <p className="text-sm font-semibold text-primary">Welcome{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Let&apos;s find what you qualify for.</h1>
        <p className="mt-2 text-muted-foreground">
          Four quick steps. Skip anything you&apos;re unsure of — you can complete it later from your dashboard.
        </p>
        <div className="mt-8">
          <ProfileForm initial={initial} mode="wizard" />
        </div>
      </PageTransition>
    </div>
  );
}
