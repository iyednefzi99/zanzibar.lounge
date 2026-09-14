import { site } from "@/content/site";

export function RestaurantJsonLd({ locale }: { locale: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: site.name,
    description: "Café, cuisine et chicha à Medjez el Bab",
    url: baseUrl,
    telephone: site.contact.phone,
    email: site.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: "TN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.address.lat,
      longitude: site.address.lng,
    },
    openingHoursSpecification: site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][h.day],
      opens: h.open,
      closes: h.close,
    })),
    priceRange: "$$",
    servesCuisine: ["Tunisian", "Mediterranean", "Cafe"],
    hasMenu: `${baseUrl}/${locale}/carte`,
    acceptsReservations: "True",
    sameAs: [
      site.social.instagram,
      site.social.facebook,
      site.social.tripadvisor,
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
