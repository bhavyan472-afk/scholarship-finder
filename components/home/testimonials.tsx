import { SectionHeading } from "./section-heading";
import { Stagger, StaggerItem } from "./reveal";

// PLACEHOLDER testimonials — replace with real, consented student stories before relying on them.
// While `placeholder` is true the page labels them as illustrative so they're never presented as real.
const TESTIMONIALS = [
  {
    quote: "I'd only ever heard of the central portal. ScholarSphere found three state and CSR scholarships I qualified for.",
    name: "Student name",
    course: "B.Tech, Karnataka",
    amount: "₹1,20,000 awarded",
    placeholder: true,
  },
  {
    quote: "The 'what you're missing' list told me I needed an income certificate before I wasted a week on the portal.",
    name: "Student name",
    course: "B.Com, Uttar Pradesh",
    amount: "₹30,000 awarded",
    placeholder: true,
  },
  {
    quote: "Seeing every deadline in one calendar is the only reason I applied to all of them on time.",
    name: "Student name",
    course: "MA applicant, Telangana",
    amount: "₹2,50,000 awarded",
    placeholder: true,
  },
];

export function Testimonials() {
  const illustrative = TESTIMONIALS.some((t) => t.placeholder);
  return (
    <section aria-labelledby="stories-title" className="border-t">
      <div className="container py-24 sm:py-32">
        <SectionHeading id="stories-title" overline="Student stories" title={<>Built for the students <em>who need it most.</em></>} />
        <Stagger className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {TESTIMONIALS.map((t, i) => (
            <StaggerItem key={i}>
              <figure className="flex h-full flex-col">
                <span aria-hidden className="font-serif text-7xl leading-[0.6] text-gold">
                  &ldquo;
                </span>
                <blockquote className="mt-4 flex-1 font-serif text-[1.65rem] leading-[1.25] tracking-[-0.01em]">{t.quote}</blockquote>
                <figcaption className="mt-8 border-t pt-5 text-sm">
                  <p className="font-medium">{t.name}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {t.course} · <span className="text-gold-ink">{t.amount}</span>
                  </p>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
        {illustrative && (
          <p className="mt-12 text-xs text-muted-foreground">Illustrative stories — to be replaced with real student testimonials.</p>
        )}
      </div>
    </section>
  );
}
