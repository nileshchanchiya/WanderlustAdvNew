import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { MapPin, Wallet, ListChecks, FileDown, ArrowUpRight, Route, Calendar, Users } from "lucide-react";

const features = [
  {
    icon: Route,
    title: "Timeline planner",
    desc: "Day-by-day structure. Drop in activities, times, and notes without the clutter.",
  },
  {
    icon: MapPin,
    title: "Map every stop",
    desc: "See your itinerary on a clean, silver-styled map — geocoded locations, all connected.",
  },
  {
    icon: Wallet,
    title: "Budget tracker",
    desc: "Log expenses by category. Running totals and a simple breakdown chart — no spreadsheets.",
  },
  {
    icon: ListChecks,
    title: "Packing checklist",
    desc: "Organised lists for clothes, docs, gear. Progress bar so nothing gets left behind.",
  },
  {
    icon: FileDown,
    title: "Export to PDF",
    desc: "One-click export of your full itinerary — perfect for offline or sharing with travel mates.",
  },
  {
    icon: Calendar,
    title: "Works for anything",
    desc: "Travel trips, conferences, or any multi-day plan. Same calm, structured workflow.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-0">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="label-caps mb-6" data-testid="hero-eyebrow">
              ◆ Plan · Organise · Travel lightly
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-ink-900 leading-[0.95]">
              Itineraries that
              <br />
              <span className="italic font-normal text-terracotta">actually</span> stay organised.
            </h1>
            <p className="mt-8 text-lg text-ink-600 max-w-xl leading-relaxed">
              A quiet, structured space for every plan you make. Timelines, maps, budgets
              and packing lists — no bloat, no noise. Whether it's a 3-week trip through Japan
              or a weekend conference, Itinera keeps it tidy.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-6 py-3 font-medium transition-colors"
                data-testid="hero-cta-signup"
              >
                Start planning — free
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-ink-200 text-ink-900 hover:bg-ink-100 rounded-lg px-6 py-3 font-medium transition-colors"
                data-testid="hero-cta-login"
              >
                Log in
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-ink-500">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" strokeWidth={1.5} />
                For solo planners & teams
              </div>
              <div className="font-mono text-xs">v1.0 · 2026</div>
            </div>
          </div>

          <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="relative rounded-xl border border-ink-200 bg-white p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="label-caps">Day 02 · Kyoto</div>
                  <div className="font-display text-2xl font-semibold mt-1">Arashiyama</div>
                </div>
                <div className="font-mono text-xs text-ink-500">18·04 — 22·04</div>
              </div>
              <ul className="relative border-l border-ink-200 ml-2 space-y-5">
                {[
                  ["08:30", "Bamboo Grove walk", "Sagatenryu-ji"],
                  ["10:15", "Tenryu-ji temple", "Susukinobabacho"],
                  ["12:30", "Lunch — Shoraian", "Tofu kaiseki"],
                  ["14:45", "Monkey Park hike", "Iwatayama"],
                ].map(([t, title, place]) => (
                  <li key={t} className="pl-6 relative">
                    <span className="absolute w-2.5 h-2.5 bg-terracotta rounded-full -left-[5.5px] top-1.5 ring-4 ring-white" />
                    <div className="font-mono text-xs text-ink-500">{t}</div>
                    <div className="font-medium text-ink-900">{title}</div>
                    <div className="text-sm text-ink-500">{place}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-ink-200 flex items-center justify-between">
                <div className="label-caps">Spent today</div>
                <div className="font-mono font-medium">¥12,480 / ¥18,000</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="mb-16 max-w-2xl">
          <div className="label-caps">01 — Features</div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-3">
            Everything you need. <span className="text-ink-500">Nothing you don't.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-200 border border-ink-200 rounded-xl overflow-hidden">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-8 hover:bg-ink-50 transition-colors">
              <f.icon className="h-6 w-6 text-terracotta mb-5" strokeWidth={1.5} />
              <h3 className="font-display text-xl font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-ink-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="border border-ink-200 rounded-xl bg-white p-10 sm:p-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="label-caps">Ready when you are</div>
            <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-3">
              Draft your next plan in minutes.
            </h3>
            <p className="mt-4 text-ink-600">
              Create a free account. No credit card. Start from scratch or open a blank trip and go.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-6 py-3 font-medium transition-colors"
              data-testid="cta-signup"
            >
              Create free account
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between text-sm text-ink-500">
          <div>© 2026 Itinera</div>
          <div className="font-mono text-xs">Built for calm planners.</div>
        </div>
      </footer>
    </div>
  );
}
