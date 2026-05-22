import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import AddDestinationModal from "@/components/AddDestinationModal";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { MapPin, ArrowUpRight, Plus, Trash2, Sparkles, Heart, Search, Star, SlidersHorizontal, ArrowDownAZ, ArrowUpDown } from "lucide-react";
import { DESTINATIONS } from "@/lib/destinationData";

const THEMES = [
  { k: "all", label: "All" },
  { k: "honeymoon", label: "Honeymoon" },
  { k: "family", label: "Family" },
  { k: "friends", label: "Friends" },
  { k: "solo", label: "Solo" },
  { k: "adventure", label: "Adventure" },
  { k: "luxury", label: "Luxury" },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [loadingCustoms, setLoadingCustoms] = useState(true);

  const isAdmin = user && user !== false && user !== null && user.role === "admin";

  useEffect(() => {
    (async () => {
      setLoadingCustoms(true);
      try {
        const { data } = await api.get("/destinations");
        setCustoms(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCustoms(false);
      }
    })();
  }, []);

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const isLoggedIn = user && user !== false && user !== null;

  useEffect(() => {
    if (isLoggedIn && user.wishlist) {
      setWishlistIds(new Set(user.wishlist));
    }
  }, [isLoggedIn, user]);

  const toggleWishlist = async (destId) => {
    if (!isLoggedIn) {
      toast.info("Log in to save destinations");
      return;
    }
    const isWished = wishlistIds.has(destId);
    try {
      if (isWished) {
        await api.delete(`/wishlist/${destId}`);
        setWishlistIds((prev) => { const s = new Set(prev); s.delete(destId); return s; });
        toast.success("Removed from wishlist");
      } else {
        await api.post(`/wishlist/${destId}`);
        setWishlistIds((prev) => new Set(prev).add(destId));
        toast.success("Added to wishlist");
      }
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

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
        slug: c.slug || c.id,
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

  const allEntries = useMemo(() => [...customEntries, ...DESTINATIONS], [customEntries]);

  const filtered = useMemo(
    () => {
      let results = allEntries.filter(
        (d) =>
          (region === "all" || d.region === region) &&
          (theme === "all" || d.theme === theme) &&
          (budget === "all" || d.budget === budget)
      );
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        results = results.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.tag || "").toLowerCase().includes(q) ||
            (d.description || "").toLowerCase().includes(q)
        );
      }
      // Sort
      if (sortBy === "az") {
        results = [...results].sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === "za") {
        results = [...results].sort((a, b) => b.name.localeCompare(a.name));
      } else if (sortBy === "price-low") {
        results = [...results].sort((a, b) => {
          const pa = parseInt((a.price_from || "0").replace(/[^0-9]/g, "")) || 0;
          const pb = parseInt((b.price_from || "0").replace(/[^0-9]/g, "")) || 0;
          return pa - pb;
        });
      } else if (sortBy === "price-high") {
        results = [...results].sort((a, b) => {
          const pa = parseInt((a.price_from || "0").replace(/[^0-9]/g, "")) || 0;
          const pb = parseInt((b.price_from || "0").replace(/[^0-9]/g, "")) || 0;
          return pb - pa;
        });
      }
      return results;
    },
    [allEntries, region, theme, budget, searchQuery, sortBy]
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
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-driftwood" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations by name, tag, or description…"
            className="w-full bg-white border border-fog/60 rounded-xl pl-11 pr-4 py-3 font-body text-charcoal placeholder:text-driftwood/60 focus:ring-2 focus:ring-gold/25 focus:border-gold outline-none transition-all"
            data-testid="dest-search-input"
          />
        </div>

        <div className="bg-white border border-fog/60 rounded-2xl p-5 flex flex-wrap items-center gap-4">
          <FilterGroup label="Region" value={region} onChange={setRegion} options={REGIONS} testid="filter-region" />
          <FilterGroup label="Theme" value={theme} onChange={setTheme} options={THEMES} testid="filter-theme" />
          <FilterGroup label="Budget" value={budget} onChange={setBudget} options={BUDGETS} testid="filter-budget" />
          <div className="ml-auto flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-fog rounded-lg px-3 py-1.5 text-xs font-label font-semibold uppercase tracking-wider text-charcoal cursor-pointer"
              data-testid="dest-sort-select"
            >
              <option value="default">Default</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
            </select>
            <div className="text-sm text-driftwood font-mono">{filtered.length} results</div>
            {isAdmin && (
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 bg-sunset text-charcoal rounded-full px-4 py-2 font-label text-xs font-semibold uppercase tracking-wider hover:shadow-float transition-all"
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
        {loadingCustoms ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-fog/60 overflow-hidden">
                <div className="aspect-[4/5] shimmer" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-fog rounded-2xl py-16 text-center">
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
              <DestCard key={d.id || d.name} d={d} onDelete={onDelete} isAdmin={isAdmin} isWished={wishlistIds.has(d.id)} onToggleWish={toggleWishlist} />
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

function DestCard({ d, onDelete, isAdmin, isWished, onToggleWish }) {
  const slug = d.slug || d.name.toLowerCase().replace(/\s+/g, "-");
  const Inner = (
    <>
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={d.img}
          alt={d.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
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
      {/* Wishlist heart */}
      {(
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWish(d.id);
          }}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
            isWished
              ? "bg-white/90 text-red-500 opacity-100"
              : "bg-white/70 text-white opacity-0 group-hover:opacity-100 hover:bg-white/90 hover:text-red-500"
          }`}
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${isWished ? "fill-red-500" : ""}`} strokeWidth={2} />
        </button>
      )}
      {d.custom && isAdmin && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(d.id);
          }}
          className="absolute top-14 right-4 opacity-0 group-hover:opacity-100 p-2 rounded-full bg-white/90 text-danger hover:bg-white transition-all"
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
          View details <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </>
  );
  const className =
    "group relative overflow-hidden rounded-2xl border border-fog/60 bg-white block hover:shadow-hover transition-all duration-300 hover:-translate-y-1";

  return (
    <Link to={`/destinations/${slug}`} className={className} data-testid={`dest-${slug}`}>
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
