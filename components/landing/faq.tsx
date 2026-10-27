import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "Is ScholarSphere free?",
    a: "Yes. Students never pay to search, match, save or track scholarships. We never charge application fees — if anyone asks you to pay to apply for a scholarship, treat it as a red flag.",
  },
  {
    q: "How is my match score calculated?",
    a: "First we apply hard eligibility filters — income limit, minimum marks, category, state, gender, course, level, nationality and more. Eligible scholarships are then scored 0–100 on five weighted factors: eligibility fit (40), academic strength (20), financial need (15), award value (15) and time left to apply (10). Every score comes with the reasons behind it.",
  },
  {
    q: "What does “likely eligible” mean?",
    a: "Nothing in your profile rules you out, but we're missing a detail needed to confirm — for example your date of birth for an age-limited scheme. Complete your profile and these become definite.",
  },
  {
    q: "Do you submit applications for me?",
    a: "No. We link you to the official portal (NSP, state portals, foundation sites) so you always apply at the source. You can track every application's progress on your dashboard.",
  },
  {
    q: "How do deadline reminders work?",
    a: "Save a scholarship and we'll email you 7 days and 1 day before it closes. You can switch reminders off in your profile anytime.",
  },
  {
    q: "Is my data safe?",
    a: "Your profile is only used to compute matches. Passwords are hashed with bcrypt, and we never sell or share your information.",
  },
];

export function Faq() {
  return (
    <div className="divide-y rounded-xl border bg-card shadow-soft">
      {FAQS.map((f) => (
        <details key={f.q} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
            {f.q}
            <Plus className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" aria-hidden />
          </summary>
          <p className="-mt-1 pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
