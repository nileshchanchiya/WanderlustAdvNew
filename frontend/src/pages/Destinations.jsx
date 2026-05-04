import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import AddDestinationModal from "@/components/AddDestinationModal";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { MapPin, ArrowUpRight, Plus, Trash2, Sparkles } from "lucide-react";

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
  const { user } = useAuth();
  const [region, setRegion] = useState("all");
  const [theme, setTheme] = useState("all");
  const [budget, setBudget] = useState("all");
  const [customs, setCustoms] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const isAdmin = user && user !== false && user !== null && user.role === "admin";

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/destinations");
        setCustoms(data);
      } catch (e) {
        // public endpoint — quiet fail so anon visitors don't see toast
        console.error(e);
      }
    })();
  }, []);

  const onCreated = (d) => {
    setCustoms((prev) => [d, ...prev]);
    setShowAdd(false);
    toast.success("Destination published");
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this destination? It will disappear for all visitors.")) return;
    try {
      await api.delete(`/destinations/${id}`);
      setCustoms((prev) => prev.filter((c) => c.id !== id));
      toast.success("Destination removed");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  // Normalise user customs to the shape we render
  const customEntries = useMemo(
    () =>
      customs.map((c) => ({
        id: c.id,
        region: c.region,
        name: c.name,
        tag: c.tag || c.theme || "Custom",
        img: c.image_url || "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
        budget: c.budget || "mid",
        theme: c.theme || "family",
        custom: true,
      })),
    [customs]
  );

  const allEntries = useMemo(() => [...customEntries, ...DESTS], [customEntries]);

  const filtered = useMemo(
    () =>
      allEntries.filter(
        (d) =>
          (region === "all" || d.region === region) &&
          (theme === "all" || d.theme === theme) &&
          (budget === "all" || d.budget === budget)
      ),
    [allEntries, region, theme, budget]
  );

  return (
    <div className="min-h-screen bg-ink-0">
      <Seo
        title="Tour Package Destinations from Rajkot | Wanderlust Adventure"
        description="Explore curated domestic and international destinations from Rajkot — Dubai, Bali, Maldives, Kerala, Goa, Kashmir and more. Filter by region, theme & budget."
        path="/destinations"
      />
      <Navbar />

      <section className="border-b border-fog/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="label-caps text-gold">Destinations</div>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-ocean mt-4 leading-[1.02] tracking-tight">
            Places we <em className="italic font-normal">love planning</em> for.
          </h1>
          <p className="mt-5 text-driftwood max-w-2xl leading-relaxed font-body text-lg">
            Filter by region, theme and budget — every destination below is one we have real experience with and curated partners on the ground.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white border border-fog/60 rounded-2xl p-5 shadow-lift flex flex-wrap items-center gap-4">
          <FilterGroup label="Region" value={region} onChange={setRegion} options={REGIONS} testid="filter-region" />
          <FilterGroup label="Theme" value={theme} onChange={setTheme} options={THEMES} testid="filter-theme" />
          <FilterGroup label="Budget" value={budget} onChange={setBudget} options={BUDGETS} testid="filter-budget" />
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-driftwood font-mono">{filtered.length} results</div>
            {isAdmin && (
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 bg-sunset text-charcoal rounded-full px-4 py-2 font-label text-xs font-semibold uppercase tracking-wider shadow-lift hover:shadow-float transition-all"
                data-testid="add-destination-btn"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                Add Destination
              </button>
            )}
          </div>
        </div>
        {isAdmin && (
          <p className="mt-3 text-xs text-driftwood flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
            Admin mode — destinations you add are visible to every visitor.
          </p>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-fog rounded-2xl py-16 text-center shadow-lift">
            <p className="font-serif text-2xl font-bold text-ocean">No matches</p>
            <p className="text-driftwood mt-2 font-body">Try loosening a filter — or tell us what you have in mind.</p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 bg-ocean hover:bg-ocean-light text-white rounded-full px-6 py-2.5 font-label text-sm font-semibold uppercase tracking-wider"
            >
              Ask us directly <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((d) => (
              <DestCard key={d.id || d.name} d={d} onDelete={onDelete} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </section>

      {showAdd && isAdmin && (
        <AddDestinationModal onClose={() => setShowAdd(false)} onCreated={onCreated} />
      )}

      <Footer />
    </div>
  );
}

function DestCard({ d, onDelete, isAdmin }) {
  const href = d.custom ? null : "/contact";
  const Inner = (
    <>
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={d.img}
          alt={d.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/85 via-ocean-deep/10 to-transparent" />
      <div className="absolute top-4 left-4 flex gap-1.5">
        {d.custom ? (
          <Badge variant="gold">New</Badge>
        ) : (
          <Badge>{d.region === "international" ? "International" : "Domestic"}</Badge>
        )}
        {!d.custom && <Badge variant="gold">{capitalize(d.budget)}</Badge>}
      </div>
      {d.custom && isAdmin && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(d.id);
          }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 rounded-full bg-white/90 text-danger hover:bg-white transition-all"
          data-testid={`delete-dest-${d.id}`}
          aria-label="delete"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <div className="flex items-center gap-1.5 text-xs text-gold font-label uppercase tracking-wider font-semibold">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
          {d.tag}
        </div>
        <div className="font-display text-3xl mt-1 leading-none">{d.name}</div>
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/80 group-hover:text-gold font-label uppercase tracking-wider font-semibold transition-colors">
          Plan this trip <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </>
  );
  const className =
    "group relative overflow-hidden rounded-2xl border border-fog/60 bg-white block shadow-lift hover:shadow-hover transition-all duration-300 hover:-translate-y-1";

  if (href) {
    return (
      <Link to={href} className={className} data-testid={`dest-${d.name.toLowerCase().replace(/\s+/g, "-")}`}>
        {Inner}
      </Link>
    );
  }
  return (
    <Link to="/contact" className={className} data-testid={`dest-custom-${d.id}`}>
      {Inner}
    </Link>
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
            className={`font-label text-xs font-semibold uppercase tracking-wider rounded-md px-3 py-1.5 border transition-colors ${
              value === o.k
                ? "bg-ocean text-white border-ocean"
                : "bg-white text-charcoal border-fog hover:bg-sand"
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
      className={`font-label text-[10px] uppercase tracking-[0.12em] font-semibold rounded-md px-2 py-1 ${
        variant === "gold" ? "bg-gold text-charcoal" : "bg-white/90 text-ocean"
      }`}
    >
      {children}
    </span>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
