"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

export function SaveButton({
  scholarshipId,
  title,
  initialSaved,
  compact,
  onChange,
  ...props
}: {
  scholarshipId: string;
  title: string;
  initialSaved: boolean;
  compact?: boolean;
  onChange?: (saved: boolean) => void;
} & Omit<ButtonProps, "onChange">) {
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      toast("Sign in to save scholarships", { description: "We'll remind you before deadlines." });
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = !saved;
    setSaved(next); // optimistic
    setPending(true);
    try {
      if (next) await api("/api/saved", { method: "POST", json: { scholarshipId } });
      else await api(`/api/saved?scholarshipId=${encodeURIComponent(scholarshipId)}`, { method: "DELETE" });
      onChange?.(next);
      toast.success(next ? "Saved to your tracker" : "Removed from saved", {
        description: next ? `We'll email you 7 days and 1 day before the deadline.` : title,
      });
      router.refresh();
    } catch (err) {
      setSaved(!next);
      toast.error("Couldn't update saved list", { description: (err as Error).message });
    } finally {
      setPending(false);
    }
  }

  const Icon = saved ? BookmarkCheck : Bookmark;
  const label = saved ? `Remove ${title} from saved` : `Save ${title}`;

  if (compact)
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        aria-label={label}
        className={cn(saved && "text-primary", props.className)}
      >
        <Icon className={cn(saved && "fill-current")} />
      </Button>
    );

  return (
    <Button variant={saved ? "secondary" : "outline"} onClick={toggle} disabled={pending} aria-pressed={saved} {...props}>
      <Icon className={cn(saved && "fill-current text-primary")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
