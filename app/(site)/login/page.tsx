import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { authOptions, googleEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage() {
  if (await getServerSession(authOptions)) redirect("/dashboard");
  return (
    <AuthShell title="Welcome back" subtitle="Log in to see your matches and upcoming deadlines.">
      <AuthForm mode="login" googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
