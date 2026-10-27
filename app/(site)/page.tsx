import { BeforeAfter } from "@/components/home/before-after";
import { BigNumbers } from "@/components/home/big-numbers";
import { Faq } from "@/components/home/faq";
import { FeaturedRow } from "@/components/home/featured-row";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Marquee } from "@/components/home/marquee";
import { MatchStack } from "@/components/home/match-stack";
import { Testimonials } from "@/components/home/testimonials";
import { getHomeData } from "@/lib/home-data";

export const revalidate = 300;

export default async function LandingPage() {
  const data = await getHomeData();

  return (
    <>
      <Hero openCount={data?.openCount ?? null} />
      <MatchStack teasers={data?.teasers.slice(0, 3) ?? []} />
      {data && <Marquee items={data.teasers} />}
      {data && data.openCount > 0 && (
        <BigNumbers openCount={data.openCount} totalValue={data.totalValue} providerCount={data.providerCount} />
      )}
      <HowItWorks />
      <BeforeAfter />
      <FeaturedRow categories={data?.categories ?? null} />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
