import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { PageTransition } from "@/components/motion";
import { ProfileForm } from "@/components/profile/profile-form";
import { authOptions } from "@/lib/auth";
import { getProfileFormValues } from "@/lib/profile-server";

export const metadata: Metadata = { title: "Build your profile", robots: { index: false } };

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/onboarding");
  const initial = await getProfileFormValues(session.user.id);

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
