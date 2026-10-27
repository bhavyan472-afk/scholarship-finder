import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Overline + serif display heading. Wrap words in <em> for the italic accent. */
export function SectionHeading({
  overline,
  title,
  lede,
  id,
  align = "left",
  className,
}: {
  overline: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  id?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p className="eyebrow">{overline}</p>
      <h2 id={id} className="display mt-5 text-[clamp(2.5rem,5.5vw,4.5rem)] [&_em]:text-highlight">
        {title}
      </h2>
      {lede && <p className={cn("mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground", align === "center" && "mx-auto")}>{lede}</p>}
    </Reveal>
  );
}
