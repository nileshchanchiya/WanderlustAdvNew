import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
} from "lucide-react";

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
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80"
            alt="mountain range"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/85 via-navy/65 to-navy-deep/20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-36 lg:py-44">
          <div className="max-w-2xl text-white animate-fade-up">
            <div className="label-caps text-gold">◆ Wanderlust Adventure</div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal leading-[1.02] tracking-tight mt-5">
              Explore the World <span className="italic text-gold">Your Way</span>
            </h1>
            <p className="mt-6 text-lg text-white/85 leading-relaxed max-w-xl">
              Customised travel experiences designed for you — from flight to return, every detail planned by experts who care.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy rounded-lg px-6 py-3 font-semibold transition-colors"
                data-testid="hero-plan-trip"
              >
                Plan My Trip <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border border-white/30 text-white hover:bg-white hover:text-navy rounded-lg px-6 py-3 font-medium transition-colors"
                data-testid="hero-free-consult"
              >
                Get Free Consultation
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" strokeWidth={1} />
                ))}
                <span className="font-mono ml-1">4.9</span>
              </div>
              <span className="h-4 w-px bg-white/30" />
              <span>1,200+ happy travellers</span>
              <span className="hidden sm:inline h-4 w-px bg-white/30" />
              <span className="hidden sm:inline">50+ destinations</span>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="mb-14 flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="label-caps text-gold-ink">01 — What we do</div>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold mt-3 text-navy leading-tight">
              Everything your trip needs, <br className="hidden sm:block" />
              under one calm roof.
            </h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/10 border border-navy/10 rounded-xl overflow-hidden">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="bg-white p-7 hover:bg-ink-50 transition-colors">
              <h.icon className="h-6 w-6 text-navy mb-4" strokeWidth={1.5} />
              <h3 className="font-serif text-xl font-semibold text-navy">{h.title}</h3>
              <p className="mt-2 text-ink-600 leading-relaxed text-sm">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-navy-soft border-y border-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="label-caps text-gold-ink">02 — Why choose us</div>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold mt-3 text-navy leading-tight">
              Because generic tours don't match <em>your</em> story.
            </h2>
            <p className="mt-5 text-ink-600 leading-relaxed max-w-md">
              We've spent a decade curating travel that feels personal. Tell us what you love — we'll shape the rest.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 mt-8 text-navy font-medium hover:text-gold-ink transition-colors"
            >
              Talk to an expert <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
          <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {WHY_US.map((w) => (
              <li key={w.title} className="bg-white border border-navy/10 rounded-xl p-6 hover:border-gold transition-colors">
                <w.icon className="h-5 w-5 text-gold-ink mb-4" strokeWidth={1.5} />
                <div className="font-semibold text-navy">{w.title}</div>
                <div className="text-sm text-ink-600 mt-2 leading-relaxed">{w.desc}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="mb-12 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="label-caps text-gold-ink">03 — Featured destinations</div>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold mt-3 text-navy leading-tight">
              Journeys our travellers love.
            </h2>
          </div>
          <Link to="/destinations" className="text-sm text-navy hover:text-gold-ink font-medium inline-flex items-center gap-1.5">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-4 label-caps">International</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {INTERNATIONAL.map((d) => <DestinationCard key={d.name} d={d} />)}
        </div>
        <div className="mb-4 label-caps">Domestic</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DOMESTIC.map((d) => <DestinationCard key={d.name} d={d} />)}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-ink-0 border-t border-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="mb-14">
            <div className="label-caps text-gold-ink">04 — Travellers</div>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold mt-3 text-navy leading-tight">
              Real stories, real journeys.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={i}
                className="bg-white border border-navy/10 rounded-xl p-7 flex flex-col"
              >
                <Quote className="h-5 w-5 text-gold" strokeWidth={1.5} />
                <blockquote className="mt-4 text-ink-700 leading-relaxed text-[15px]">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-navy/10 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-navy">{t.name}</div>
                    <div className="text-xs text-ink-500 font-mono mt-0.5">{t.trip}</div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-gold text-gold" strokeWidth={1} />
                    ))}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
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
          <div className="absolute inset-0 bg-navy-deep/75" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center text-white">
          <div className="label-caps text-gold">Ready when you are</div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal mt-4 leading-tight">
            Let's plan your <em className="text-gold">perfect</em> journey today.
          </h2>
          <p className="mt-6 text-white/80 max-w-2xl mx-auto">
            Free consultation. Personalised quote within 24 hours. Zero obligation.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy rounded-lg px-7 py-3.5 font-semibold transition-colors"
              data-testid="cta-plan-trip"
            >
              Plan My Trip <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-white/30 text-white hover:bg-white hover:text-navy rounded-lg px-7 py-3.5 font-medium transition-colors"
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
