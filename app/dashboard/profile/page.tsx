import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { PageTransition } from "@/components/motion";
import { ProfileForm } from "@/components/profile/profile-form";
import { authOptions } from "@/lib/auth";
import { getProfileFormValues } from "@/lib/profile-server";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = (await getServerSession(authOptions))!;
  const initial = await getProfileFormValues(session.user.id);
  return (
    <PageTransition className="max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>
        <p className="mt-1 text-muted-foreground">Changes instantly re-score every scholarship.</p>
      </header>
      <ProfileForm initial={initial} mode="edit" />
    </PageTransition>
  );
}
