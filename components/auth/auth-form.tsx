"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/primitives";
import { api, fieldErrors } from "@/lib/fetcher";
import { signupSchema } from "@/lib/validators";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.8-3.8h-4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.2 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z" />
    </svg>
  );
}

export function AuthForm({ mode, googleEnabled }: { mode: "login" | "signup"; googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || (mode === "signup" ? "/onboarding" : "/dashboard");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    if (mode === "signup") {
      const parsed = signupSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(Object.fromEntries(Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])));
        return;
      }
    }

    setPending(true);
    try {
      if (mode === "signup") {
        await api("/api/auth/signup", { method: "POST", json: form });
      }
      const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (!res || res.error) {
        setFormError(
          res?.error === "RATE_LIMITED"
            ? "Too many attempts. Please wait a few minutes and try again."
            : "Incorrect email or password.",
        );
        return;
      }
      toast.success(mode === "signup" ? "Account created — let's build your profile" : "Welcome back");
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) setErrors(fe);
      else setFormError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {googleEnabled && (
        <>
          <Button variant="outline" size="lg" type="button" onClick={() => signIn("google", { callbackUrl })}>
            <GoogleIcon /> Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {formError && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {formError}
          </div>
        )}
        {mode === "signup" && (
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby="name-error" />
            <FieldError id="name-error" message={errors.name} />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby="email-error"
          />
          <FieldError id="email-error" message={errors.email} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby="password-error password-hint"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {mode === "signup" && !errors.password && (
            <p id="password-hint" className="text-xs text-muted-foreground">
              At least 8 characters, with a letter and a number.
            </p>
          )}
          <FieldError id="password-error" message={errors.password} />
        </div>
        <Button type="submit" size="lg" loading={pending} className="mt-2">
          {mode === "signup" ? "Create account" : "Log in"}
        </Button>
        {mode === "signup" && (
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? "Already have an account? " : "New to ScholarSphere? "}
        <Link
          href={`${mode === "signup" ? "/login" : "/signup"}${params.get("callbackUrl") ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {mode === "signup" ? "Log in" : "Create one free"}
        </Link>
      </p>
    </div>
  );
}
