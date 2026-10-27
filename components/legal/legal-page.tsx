import { SITE } from "@/lib/site";

/** Shared layout for Privacy / Terms / Disclaimer. Children are plain h2/p/ul elements. */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <article className="container max-w-3xl py-12 sm:py-16">
      <header className="border-b pb-8">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">{intro}</p>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: {SITE.legalUpdated}</p>
      </header>
      <div className="text-[15px] [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground">
        {children}
      </div>
    </article>
  );
}

export function ContactLink() {
  return <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
}
