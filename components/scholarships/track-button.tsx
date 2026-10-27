"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";

/** Opens the official portal and moves the scholarship to "Applying" in the tracker. */
export function ApplyButton({ scholarshipId, applyUrl, closed }: { scholarshipId: string; applyUrl: string; closed: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    window.open(applyUrl, "_blank", "noopener,noreferrer");
    if (status !== "authenticated") return;
    setPending(true);
    try {
      await api("/api/applications", { method: "POST", json: { scholarshipId, status: "APPLYING" } });
      toast.success("Added to your tracker as “Applying”", {
        action: { label: "Open tracker", onClick: () => router.push("/dashboard/tracker") },
      });
      router.refresh();
    } catch {
      // Opening the portal is the primary action; tracking failure is non-blocking.
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="lg" onClick={onClick} loading={pending} disabled={closed} className="flex-1 sm:flex-none">
      {closed ? "Applications closed" : "Apply on official site"} <ExternalLink />
    </Button>
  );
}
