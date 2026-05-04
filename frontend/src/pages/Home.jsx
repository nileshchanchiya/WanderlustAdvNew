import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo, { businessSchema, faqSchema } from "@/components/Seo";
import {
  ArrowUpRight,
  Compass,
  Plane,
  Hotel,
  FileCheck,
  Clock,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Route as RouteIcon,
  Quote,
  Star,
  MapPin,
  HelpCircle,
} from "lucide-react";

const FAQ = [
  {
    q: "What is the best travel agency in Rajkot?",
    a: "Wanderlust Adventure, founded in 2021 by Nilesh Chanchiya, is one of Rajkot's most trusted travel agencies located at Everest Park, Kalawad Road. We offer domestic and international tour packages, visa assistance, flight bookings, and customised itinerary planning. Call us at +91 8160317044.",
  },
  {
    q: "Does Wanderlust Adventure offer international tour packages?",
    a: "Yes. We specialise in international packages to Dubai, Bali, Thailand, Europe and more. All packages include visa assistance, flights, hotels and guided tours.",
  },
  {
    q: "What is the starting price for tour packages from Rajkot?",
    a: "Domestic packages start from ₹8,000 per person and international packages start from ₹25,000. We offer budget, standard and luxury options for every traveller.",
  },
  {
    q: "Do you offer a travel itinerary maker?",
    a: "Yes — Wanderlust Adventure offers a free online itinerary maker where you can plan day-by-day travel itineraries for any destination in India or abroad. Create an account and start planning in minutes.",
  },
  {
    q: "How do I contact Wanderlust Adventure?",
    a: "Call or WhatsApp us at +91 8160317044, email info@wanderlustadventure.in, or visit us at Everest Park, Kalawad Road, Rajkot 360005, Gujarat.",
  },
];

const HIGHLIGHTS = [
  { icon: Sparkles, title: "Customised Packages", desc: "Tailor-made trips that fit your style & budget." },
  { icon: Compass, title: "Domestic & International", desc: "From Kerala backwaters to the Maldives." },
  { icon: RouteIcon, title: "Expert Guidance", desc: "Destination know-how from real travellers." },
  { icon: Plane, title: "Flights + Hotels", desc: "Best deals, seamlessly booked for you." },
  { icon: FileCheck, title: "Visa & Insurance", desc: "Hassle-free documentation support." },
  { icon: Clock, title: "Save Time & Money", desc: "Smart itineraries that maximise every day." },
];

const WHY_US = [
  { icon: Sparkles, title: "Personalised itineraries", desc: "Not generic templates — every trip is built around you." },
  { icon: PiggyBank, title: "Transparent pricing", desc: "No hidden fees. Clear quotes before you commit." },
  { icon: ShieldCheck, title: "End-to-end support", desc: "Flights, stays, visas, on-trip help — we handle it all." },
  { icon: Compass, title: "Real-world recommendations", desc: "Vetted properties and experiences we've tested ourselves." },
];

const INTERNATIONAL = [
  {
    name: "Dubai",
    tag: "Luxury · Skyline",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Bali",
    tag: "Beaches · Culture",
    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Europe",
    tag: "Classic · Heritage",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Maldives",
    tag: "Honeymoon · Luxury",
    img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80",
  },
];

const DOMESTIC = [
  {
    name: "Goa",
    tag: "Beach · Nightlife",
    img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Manali",
    tag: "Mountains · Adventure",
    img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Kashmir",
    tag: "Snow · Serenity",
    img: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Kerala",
    tag: "Backwaters · Nature",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "They planned our 10-day Europe trip to the minute — and still left room for surprises. Hotels, trains, everything was ready when we landed.",
    name: "Aanya & Rohit",
    trip: "Europe · Honeymoon",
  },
  {
    quote:
      "Went to Bali as a family of five. The itinerary, villa and drivers were perfect. Will only travel through Wanderlust from now on.",
    name: "The Kapoors",
    trip: "Bali · Family",
  },
  {
    quote:
      "Honestly, the best part was how transparent the pricing was. No last-minute surprises, and the service was impeccable.",
    name: "Neha S.",
    trip: "Maldives · Luxury",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-ink-0">
      <Seo
        title="Best Travel Agency in Rajkot | Wanderlust Adventure"
        description="Wanderlust Adventure is Rajkot's most trusted travel agency offering domestic & international tour packages, itinerary planning, visa assistance, and honeymoon packages. Call +91 8160317044 today."
        path="/"
        jsonLd={[businessSchema(), faqSchema(FAQ)]}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden min-h-[90vh] lg:min-h-[92vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80"
            alt="mountain range"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ocean-deep/85 via-ocean/60 to-ocean-deep/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/70 via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full">
          <div className="max-w-3xl text-white animate-fade-up">
            <div className="label-caps text-gold">◆ Wanderlust Adventure</div>
            <h1 className="font-display text-[56px] sm:text-[72px] lg:text-[88px] font-light leading-[0.98] tracking-tight mt-6">
              Explore the World <br className="hidden sm:block" />
              <em className="italic font-normal text-gold">Your Way.</em>
            </h1>
            <p className="mt-7 font-body text-lg sm:text-xl text-white/85 leading-relaxed max-w-xl">
              Customised travel experiences designed for you — from flight to return, every detail planned by experts who care.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-sunset text-charcoal rounded-full px-8 py-4 font-label font-semibold uppercase tracking-wider text-sm shadow-float hover:shadow-hover transition-all hover:-translate-y-0.5"
                data-testid="hero-plan-trip"
              >
                Plan My Trip <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border-[1.5px] border-white/60 text-white hover:bg-white hover:text-ocean rounded-full px-8 py-4 font-label font-semibold uppercase tracking-wider text-sm transition-colors"
                data-testid="hero-free-consult"
              >
                Get Free Consultation
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-white/85">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" strokeWidth={1} />
                ))}
                <span className="font-mono ml-2 font-medium">4.9</span>
              </div>
              <span className="h-4 w-px bg-white/30" />
              <span className="font-body">1,200+ happy travellers</span>
              <span className="hidden sm:inline h-4 w-px bg-white/30" />
              <span className="hidden sm:inline font-body">50+ destinations</span>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="mb-14 flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="label-caps text-gold">01 — What we do</div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mt-4 text-ocean leading-[1.1] tracking-tight">
              Everything your trip needs, <br className="hidden sm:block" />
              <em className="italic font-normal text-driftwood">under one calm roof.</em>
            </h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.title}
              className="bg-white rounded-2xl p-8 border border-fog/60 shadow-lift hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-gold-soft grid place-items-center">
                <h.icon className="h-5 w-5 text-ocean" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl font-bold text-ocean mt-5">{h.title}</h3>
              <p className="mt-2 text-driftwood leading-relaxed text-[15px]">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-sand-gradient border-y border-fog/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="label-caps text-gold">02 — Why choose us</div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mt-4 text-ocean leading-[1.08] tracking-tight">
              Because generic tours don't match <em className="italic font-normal">your</em> story.
            </h2>
            <p className="mt-6 text-driftwood leading-relaxed font-body text-lg max-w-md">
              We've spent a decade curating travel that feels personal. Tell us what you love — we'll shape the rest.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 mt-8 text-ocean font-label uppercase tracking-wider text-sm font-semibold hover:text-gold transition-colors"
            >
              Talk to an expert <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
          <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
            {WHY_US.map((w) => (
              <li key={w.title} className="bg-white rounded-2xl p-7 border border-fog/60 shadow-lift hover:shadow-float hover:border-gold/40 transition-all">
                <w.icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
                <div className="font-serif text-xl font-bold text-ocean mt-4">{w.title}</div>
                <div className="text-driftwood mt-2 leading-relaxed text-[15px]">{w.desc}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="mb-12 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="label-caps text-gold">03 — Featured destinations</div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mt-4 text-ocean leading-[1.08] tracking-tight">
              Journeys our travellers <em className="italic font-normal">love</em>.
            </h2>
          </div>
          <Link to="/destinations" className="font-label text-sm text-ocean hover:text-gold uppercase tracking-wider font-semibold inline-flex items-center gap-1.5 transition-colors">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <span className="label-caps">International</span>
          <span className="h-px flex-1 bg-fog/60" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {INTERNATIONAL.map((d) => <DestinationCard key={d.name} d={d} />)}
        </div>
        <div className="mb-5 flex items-center gap-2">
          <span className="label-caps">Domestic</span>
          <span className="h-px flex-1 bg-fog/60" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DOMESTIC.map((d) => <DestinationCard key={d.name} d={d} />)}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-sand border-t border-fog/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="mb-14">
            <div className="label-caps text-gold">04 — Travellers</div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mt-4 text-ocean leading-[1.08] tracking-tight">
              Real stories, <em className="italic font-normal">real</em> journeys.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={i}
                className="bg-white rounded-2xl p-8 shadow-lift hover:shadow-float transition-all flex flex-col"
              >
                <Quote className="h-6 w-6 text-gold" strokeWidth={1.5} />
                <blockquote className="mt-5 text-charcoal leading-[1.7] italic font-body text-[15px]">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-7 pt-5 border-t border-fog/60 flex items-center justify-between">
                  <div>
                    <div className="font-body font-bold text-charcoal text-[15px]">{t.name}</div>
                    <div className="font-label text-[11px] text-driftwood uppercase tracking-[0.12em] font-semibold mt-1">{t.trip}</div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-gold text-gold" strokeWidth={1} />
                    ))}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="mb-12 text-center">
          <div className="label-caps text-gold">05 — FAQ</div>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mt-4 text-ocean leading-[1.1] tracking-tight">
            Questions travellers <em className="italic font-normal">ask</em>.
          </h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group bg-white border border-fog/60 rounded-2xl p-6 shadow-lift hover:shadow-float transition-all open:border-gold/60"
              data-testid={`faq-${i}`}
            >
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                <span className="font-serif text-lg font-bold text-ocean">{item.q}</span>
                <HelpCircle
                  className="h-5 w-5 text-gold shrink-0 group-open:rotate-180 transition-transform"
                  strokeWidth={1.5}
                />
              </summary>
              <p className="mt-4 text-driftwood leading-relaxed font-body">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-driftwood font-body">
            More questions? Call us at{" "}
            <a href="tel:+918160317044" className="font-mono text-ocean hover:text-gold">
              +91 8160317044
            </a>
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80"
            alt="tropical beach"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ocean-deep/75" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center text-white">
          <div className="label-caps text-gold">Ready when you are</div>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light mt-6 leading-[0.98] tracking-tight">
            Let's plan your <em className="italic text-gold">perfect</em> journey today.
          </h2>
          <p className="mt-6 text-white/80 max-w-2xl mx-auto font-body text-lg">
            Free consultation. Personalised quote within 24 hours. Zero obligation.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-sunset text-charcoal rounded-full px-8 py-4 font-label font-semibold uppercase tracking-wider text-sm shadow-float hover:shadow-hover transition-all hover:-translate-y-0.5"
              data-testid="cta-plan-trip"
            >
              Plan My Trip <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border-[1.5px] border-white/60 text-white hover:bg-white hover:text-ocean rounded-full px-8 py-4 font-label font-semibold uppercase tracking-wider text-sm transition-colors"
              data-testid="cta-free-consult"
            >
              Get Free Consultation
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function DestinationCard({ d }) {
  return (
    <Link
      to="/destinations"
      className="group relative overflow-hidden rounded-xl border border-navy/10 bg-white block"
      data-testid={`dest-card-${d.name.toLowerCase()}`}
    >
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={d.img}
          alt={d.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <div className="flex items-center gap-1.5 text-xs text-gold">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
          {d.tag}
        </div>
        <div className="font-serif text-2xl mt-1">{d.name}</div>
      </div>
    </Link>
  );
}
