import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, ArrowUpRight } from "lucide-react";

const DESTS = [
  { region: "international", name: "Dubai", tag: "Luxury · Skyline", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80", budget: "luxury", theme: "family" },
  { region: "international", name: "Bali", tag: "Beaches · Culture", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "honeymoon" },
  { region: "international", name: "Europe", tag: "Classic · Heritage", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80", budget: "luxury", theme: "family" },
  { region: "international", name: "Maldives", tag: "Islands · Honeymoon", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80", budget: "luxury", theme: "honeymoon" },
  { region: "international", name: "Thailand", tag: "Beach · Adventure", img: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "friends" },
  { region: "international", name: "Singapore", tag: "City · Family", img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "family" },
  { region: "domestic", name: "Goa", tag: "Beach · Nightlife", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80", budget: "budget", theme: "friends" },
  { region: "domestic", name: "Manali", tag: "Mountains · Adventure", img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80", budget: "budget", theme: "friends" },
  { region: "domestic", name: "Kashmir", tag: "Snow · Serenity", img: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "honeymoon" },
  { region: "domestic", name: "Kerala", tag: "Backwaters · Nature", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "family" },
  { region: "domestic", name: "Ladakh", tag: "High Altitude · Biking", img: "https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "friends" },
  { region: "domestic", name: "Rajasthan", tag: "Royal · Culture", img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80", budget: "luxury", theme: "family" },
];

const THEMES = [
  { k: "all", label: "All" },
  { k: "honeymoon", label: "Honeymoon" },
  { k: "family", label: "Family" },
  { k: "friends", label: "Friends" },
];

const BUDGETS = [
  { k: "all", label: "Any budget" },
  { k: "budget", label: "Budget" },
  { k: "mid", label: "Mid-range" },
  { k: "luxury", label: "Luxury" },
];

const REGIONS = [
  { k: "all", label: "Worldwide" },
  { k: "international", label: "International" },
  { k: "domestic", label: "Domestic" },
];

export default function Destinations() {
  const [region, setRegion] = useState("all");
  const [theme, setTheme] = useState("all");
  const [budget, setBudget] = useState("all");

  const filtered = useMemo(
    () =>
      DESTS.filter(
        (d) =>
          (region === "all" || d.region === region) &&
          (theme === "all" || d.theme === theme) &&
          (budget === "all" || d.budget === budget)
      ),
    [region, theme, budget]
  );

  return (
    <div className="min-h-screen bg-ink-0">
      <Navbar />

      <section className="border-b border-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="label-caps text-gold-ink">Destinations</div>
          <h1 className="font-serif text-5xl sm:text-6xl font-normal text-navy mt-4 leading-[1.02] tracking-tight">
            Places we <em className="text-gold">love planning</em> for.
          </h1>
          <p className="mt-5 text-ink-600 max-w-2xl leading-relaxed">
            Filter by region, theme and budget — every destination below is one we have real experience with and curated partners on the ground.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white border border-navy/10 rounded-xl p-5 flex flex-wrap items-center gap-4">
          <FilterGroup label="Region" value={region} onChange={setRegion} options={REGIONS} testid="filter-region" />
          <FilterGroup label="Theme" value={theme} onChange={setTheme} options={THEMES} testid="filter-theme" />
          <FilterGroup label="Budget" value={budget} onChange={setBudget} options={BUDGETS} testid="filter-budget" />
          <div className="ml-auto text-sm text-ink-500 font-mono">{filtered.length} results</div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-navy/15 rounded-xl py-16 text-center">
            <p className="font-serif text-2xl font-semibold text-navy">No matches</p>
            <p className="text-ink-500 mt-2">Try loosening a filter — or tell us what you have in mind.</p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white rounded-lg px-5 py-2.5 font-medium"
            >
              Ask us directly <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((d) => (
              <Link
                key={d.name}
                to="/contact"
                className="group relative overflow-hidden rounded-xl border border-navy/10 bg-white block"
                data-testid={`dest-${d.name.toLowerCase()}`}
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={d.img} alt={d.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/10 to-transparent" />
                <div className="absolute top-4 left-4 flex gap-1.5">
                  <Badge>{d.region === "international" ? "International" : "Domestic"}</Badge>
                  <Badge variant="gold">{capitalize(d.budget)}</Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <div className="flex items-center gap-1.5 text-xs text-gold">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {d.tag}
                  </div>
                  <div className="font-serif text-2xl mt-1">{d.name}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/80 group-hover:text-gold transition-colors">
                    Plan this trip <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function FilterGroup({ label, value, onChange, options, testid }) {
  return (
    <div className="flex items-center gap-2">
      <span className="label-caps">{label}</span>
      <div className="flex flex-wrap gap-1.5" data-testid={testid}>
        {options.map((o) => (
          <button
            key={o.k}
            onClick={() => onChange(o.k)}
            className={`text-xs rounded-md px-3 py-1.5 border transition-colors ${
              value === o.k
                ? "bg-navy text-white border-navy"
                : "bg-white text-ink-700 border-navy/15 hover:bg-navy-soft"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, variant }) {
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.18em] font-semibold rounded-md px-2 py-1 ${
        variant === "gold" ? "bg-gold text-navy" : "bg-white/90 text-navy"
      }`}
    >
      {children}
    </span>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
