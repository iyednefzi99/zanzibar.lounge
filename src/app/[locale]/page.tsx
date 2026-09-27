import { notFound } from "next/navigation";

import { HeroSection } from "@/components/hero/hero-section";
import { AboutSection } from "@/components/about/about-section";
import { MenuSection } from "@/components/menu/menu-section";
import { InfoSection } from "@/components/info/info-section";
import { ReviewCarousel } from "@/components/reviews/review-carousel";
import { CtaSection } from "@/components/cta/cta-section";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return (
    <>
      <HeroSection locale={typedLocale} dictionary={dictionary} />
      <AboutSection locale={typedLocale} dictionary={dictionary} />
      <MenuSection locale={typedLocale} dictionary={dictionary} />
      <InfoSection locale={typedLocale} dictionary={dictionary} />
      <ReviewCarousel locale={typedLocale} dictionary={dictionary} />
      <CtaSection locale={typedLocale} dictionary={dictionary} />
    </>
  );
}
