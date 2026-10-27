import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { authOptions, googleEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create your free account",
  description: "Sign up to get matched with scholarships you're eligible for.",
};

export default async function SignupPage() {
  if (await getServerSession(authOptions)) redirect("/dashboard");
  return (
    <AuthShell title="Create your free account" subtitle="Two minutes to your first ranked list of scholarships.">
      <AuthForm mode="signup" googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
