import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Sparkles,
  Globe,
  Compass,
  Plane,
  FileCheck,
  PiggyBank,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

const SERVICES = [
  {
    icon: Sparkles,
    title: "Customised Travel Packages",
    desc: "Tailor-made trips based on your budget, duration and preferences — designed from scratch, never copy-pasted.",
    points: ["Budget-first planning", "Flexible day-by-day", "Private or group"],
  },
  {
    icon: Globe,
    title: "Domestic & International Packages",
    desc: "Curated options across India and the world. Ready bundles or fully customised routes — your call.",
    points: ["All-India coverage", "50+ global destinations", "Multi-country combos"],
  },
  {
    icon: Compass,
    title: "Expert Travel Consulting",
    desc: "Destination guidance, budget optimisation and smart travel planning from experienced consultants.",
    points: ["Destination know-how", "Budget optimisation", "Seasonality & timing"],
  },
  {
    icon: Plane,
    title: "Flight + Hotel Booking",
    desc: "Best deals across airlines and stays, booked seamlessly on your behalf — confirmed and ready.",
    points: ["Best-fare sweeps", "Vetted properties", "Upgrade negotiation"],
  },
  {
    icon: FileCheck,
    title: "Visa & Insurance Assistance",
    desc: "Hassle-free documentation support. We prepare your paperwork and guide you through every step.",
    points: ["Visa applications", "Travel insurance", "Doc checklists"],
  },
  {
    icon: PiggyBank,
    title: "Cost & Time Optimisation",
    desc: "Smart itineraries that squeeze the most experience out of every day — without rushing you.",
    points: ["Efficient routing", "No wasted days", "Hidden gems included"],
  },
];

export default function Services() {
  return (
    <div className="min-h-screen bg-ink-0">
      <Navbar />

      <section className="border-b border-navy/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="label-caps text-gold-ink">What we do</div>
          <h1 className="font-serif text-5xl sm:text-6xl font-normal text-navy mt-4 leading-[1.02] tracking-tight">
            Our Travel <em className="text-gold">Services.</em>
          </h1>
          <p className="mt-6 text-lg text-ink-600 max-w-2xl leading-relaxed">
            From planning to paperwork, bookings to on-trip support — we handle the details so you can enjoy the journey.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-px bg-navy/10 border border-navy/10 rounded-xl overflow-hidden">
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className="bg-white p-8 lg:p-10 hover:bg-ink-50 transition-colors"
              data-testid={`service-${i}`}
            >
              <div className="flex items-start gap-4">
                <span className="h-11 w-11 shrink-0 rounded-lg bg-navy-soft text-navy grid place-items-center">
                  <s.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div className="flex-1">
                  <div className="font-mono text-xs text-ink-500">0{i + 1}</div>
                  <h2 className="font-serif text-2xl font-semibold text-navy mt-1">{s.title}</h2>
                </div>
              </div>
              <p className="mt-5 text-ink-600 leading-relaxed">{s.desc}</p>
              <ul className="mt-5 space-y-1.5">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-ink-700">
                    <CheckCircle2 className="h-4 w-4 text-gold-ink" strokeWidth={1.5} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="border border-navy/15 rounded-xl bg-navy text-white p-10 sm:p-14 text-center">
          <div className="label-caps text-gold">Ready to plan?</div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal mt-3">
            Start building your trip in minutes.
          </h2>
          <p className="mt-4 text-white/80 max-w-xl mx-auto">
            Create a free account and use our itinerary builder, or book a free consultation and let our experts craft it for you.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-navy rounded-lg px-6 py-3 font-semibold transition-colors"
              data-testid="services-cta-plan"
            >
              Plan My Trip <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-white/30 hover:bg-white hover:text-navy rounded-lg px-6 py-3 font-medium transition-colors"
              data-testid="services-cta-consult"
            >
              Free Consultation
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
