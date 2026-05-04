import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_URL = process.env.REACT_APP_SITE_URL || "https://wanderlustadventure.in";
const SITE_NAME = "Wanderlust Adventure";
const DEFAULT_OG = "https://wanderlustadventure.in/og-image.png";

/**
 * SEO / Helmet wrapper. Pass title, description, path (for canonical),
 * ogImage, noIndex, and optional jsonLd array for structured data.
 */
export default function Seo({
  title,
  description,
  path = "/",
  ogImage = DEFAULT_OG,
  noIndex = false,
  jsonLd = [],
}) {
  const canonical = `${SITE_URL}${path.startsWith("/") ? path : "/" + path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Geo */}
      <meta name="geo.region" content="IN-GJ" />
      <meta name="geo.placename" content="Rajkot" />
      <meta name="geo.position" content="22.3039;70.8022" />
      <meta name="ICBM" content="22.3039, 70.8022" />

      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}

export const SITE = {
  url: SITE_URL,
  name: SITE_NAME,
  phone: "+91 8160317044",
  phoneE164: "+918160317044",
  email: "info@wanderlustadventure.in",
  whatsapp: "918160317044",
  address: {
    street: "Everest Park, Kalawad Road",
    city: "Rajkot",
    region: "Gujarat",
    postal: "360005",
    country: "IN",
    lat: 22.3039,
    lng: 70.8022,
  },
  foundingDate: "2021",
  founder: "Nilesh Chanchiya",
};

/** LocalBusiness + TravelAgency schema for the homepage. */
export const businessSchema = () => ({
  "@context": "https://schema.org",
  "@type": ["TravelAgency", "LocalBusiness"],
  name: SITE.name,
  description:
    "Best travel agency in Rajkot offering domestic and international tour packages, itinerary planning, visa assistance and honeymoon packages.",
  url: SITE.url,
  logo: `${SITE.url}/logo.png`,
  image: DEFAULT_OG,
  telephone: SITE.phoneE164,
  email: SITE.email,
  foundingDate: SITE.foundingDate,
  founder: { "@type": "Person", name: SITE.founder },
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.city,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postal,
    addressCountry: SITE.address.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: SITE.address.lat,
    longitude: SITE.address.lng,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "19:00",
    },
  ],
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: "Cash, UPI, Bank Transfer, Credit Card",
  areaServed: ["Rajkot", "Gujarat", "India"],
  sameAs: [
    "https://www.facebook.com/wanderlustadventures.in/",
    "https://www.crunchbase.com/organization/wanderlust-adventure",
  ],
});

export const faqSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((q) => ({
    "@type": "Question",
    name: q.q,
    acceptedAnswer: { "@type": "Answer", text: q.a },
  })),
});

export const breadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((x, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: x.name,
    item: `${SITE.url}${x.path}`,
  })),
});
