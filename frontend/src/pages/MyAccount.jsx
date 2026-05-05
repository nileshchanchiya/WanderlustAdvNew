import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreateItineraryModal from "@/components/CreateItineraryModal";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  User, MapPin, Calendar, Briefcase, Users2, Trash2, Loader2,
  PackageOpen, Plus, Heart, Phone, Building2, Save, Camera,
  Map, ClipboardList, HeartOff, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "itineraries", label: "Itineraries", icon: ClipboardList },
  { key: "wishlist", label: "Wishlist", icon: Heart },
];

const TYPE_META = {
  travel: { label: "Travel", icon: MapPin },
  event: { label: "Event", icon: Users2 },
  generic: { label: "Plan", icon: Briefcase },
};

function formatRange(s, e) {
  if (!s && !e) return "Dates not set";
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  return `${fmt(s)}${s && e ? " — " : ""}${fmt(e)}`;
}

export default function MyAccount() {
  const { user, checkSession } = useAuth();
  const [tab, setTab] = useState("profile");

  return (
    <div className="min-h-screen bg-ink-0 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="label-caps text-gold">My Account</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-2 text-ocean">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-fog/60 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-label font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "border-ocean text-ocean"
                  : "border-transparent text-driftwood hover:text-charcoal hover:border-fog"
              }`}
            >
              <t.icon className="h-4 w-4" strokeWidth={1.5} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && <ProfileTab user={user} onUpdated={checkSession} />}
        {tab === "itineraries" && <ItinerariesTab />}
        {tab === "wishlist" && <WishlistTab />}
      </main>
      <Footer />
    </div>
  );
}

/* ─── Profile Tab ─── */
function ProfileTab({ user, onUpdated }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    profile_image: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        city: user.city || "",
        profile_image: user.profile_image || "",
      });
    }
  }, [user]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/profile", form);
      if (onUpdated) await onUpdated();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Avatar card */}
      <div className="bg-white border border-fog/60 rounded-2xl p-8 text-center shadow-lift">
        {form.profile_image ? (
          <img
            src={form.profile_image}
            alt={user?.name || "Profile"}
            className="h-28 w-28 rounded-full object-cover mx-auto border-4 border-gold-soft"
          />
        ) : (
          <div className="h-28 w-28 rounded-full bg-ocean-gradient mx-auto grid place-items-center text-white font-display text-3xl font-bold">
            {initials}
          </div>
        )}
        <h3 className="font-serif text-xl font-bold text-ocean mt-5">{user?.name || "User"}</h3>
        <p className="text-driftwood text-sm mt-1">{user?.email}</p>
        <div className="mt-4 inline-flex items-center gap-1.5 bg-gold-soft text-ocean px-3 py-1 rounded-full text-xs font-label font-semibold uppercase tracking-wider">
          {user?.role === "admin" ? "Admin" : "Traveller"}
        </div>
        <p className="text-driftwood text-xs mt-4">
          Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—"}
        </p>
      </div>

      {/* Edit form */}
      <form onSubmit={onSave} className="lg:col-span-2 bg-white border border-fog/60 rounded-2xl p-8 shadow-lift space-y-6">
        <h3 className="font-serif text-2xl font-bold text-ocean">Personal Details</h3>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label-caps text-[11px] mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-driftwood" strokeWidth={1.5} />
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 border border-fog rounded-lg text-charcoal focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none transition-all"
                placeholder="Your name"
              />
            </div>
          </div>
          <div>
            <label className="label-caps text-[11px] mb-2 block">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-driftwood" strokeWidth={1.5} />
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 border border-fog rounded-lg text-charcoal focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none transition-all"
                placeholder="+91 8160317044"
              />
            </div>
          </div>
          <div>
            <label className="label-caps text-[11px] mb-2 block">City</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-driftwood" strokeWidth={1.5} />
              <input
                name="city"
                value={form.city}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 border border-fog rounded-lg text-charcoal focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none transition-all"
                placeholder="Rajkot"
              />
            </div>
          </div>
          <div>
            <label className="label-caps text-[11px] mb-2 block">Profile Image URL</label>
            <div className="relative">
              <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-driftwood" strokeWidth={1.5} />
              <input
                name="profile_image"
                value={form.profile_image}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 border border-fog rounded-lg text-charcoal focus:ring-2 focus:ring-ocean/20 focus:border-ocean outline-none transition-all"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-ocean text-white rounded-lg px-6 py-2.5 font-label font-semibold uppercase tracking-wider text-sm hover:bg-ocean-deep transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={1.5} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Itineraries Tab ─── */
function ItinerariesTab() {
  const [items, setItems] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/itineraries");
      setItems(data);
    } catch (e) {
      setErr(formatApiError(e));
      setItems([]);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreated = (item) => {
    setItems((prev) => [item, ...(prev || [])]);
    setShowCreate(false);
    toast.success("Itinerary created");
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this itinerary?")) return;
    try {
      await api.delete(`/itineraries/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-2xl font-bold text-ocean">Your Itineraries</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-5 py-2.5 font-medium transition-colors text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New Itinerary
        </button>
      </div>

      {err && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {err}
        </div>
      )}

      {items === null ? (
        <div className="flex items-center justify-center py-24 text-ink-400">
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-fog rounded-xl bg-white py-20 px-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-ink-50 grid place-items-center mb-5">
            <PackageOpen className="h-6 w-6 text-terracotta" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-2xl font-semibold">No itineraries yet</h3>
          <p className="text-driftwood mt-2 max-w-md mx-auto">
            Create your first plan — a weekend getaway, a conference schedule, or a 3-week trip.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-5 py-2.5 font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Itinerary
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => {
            const Icon = TYPE_META[it.type]?.icon || Briefcase;
            const spent = (it.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const events = (it.events || []).length;
            const packing = (it.packing || []).length;
            return (
              <div
                key={it.id}
                className="group relative bg-white border border-fog/60 rounded-xl p-6 hover:border-terracotta transition-colors shadow-lift"
              >
                <Link to={`/itinerary/${it.id}`} className="block">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 label-caps">
                      <Icon className="h-3.5 w-3.5 text-terracotta" strokeWidth={1.8} />
                      {TYPE_META[it.type]?.label || "Plan"}
                    </div>
                    <div className="font-mono text-xs text-driftwood">
                      {formatRange(it.start_date, it.end_date)}
                    </div>
                  </div>
                  <h3 className="font-display text-2xl font-semibold mt-4 text-ocean leading-tight">
                    {it.cover_emoji ? <span className="mr-2">{it.cover_emoji}</span> : null}
                    {it.title}
                  </h3>
                  {it.destination && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-driftwood">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {it.destination}
                    </div>
                  )}
                  <div className="mt-6 pt-5 border-t border-fog/60 grid grid-cols-3 gap-2 text-xs">
                    <Stat label="Events" value={events} />
                    <Stat label="Packed" value={packing} />
                    <Stat label="Spent" value={`${it.currency || "USD"} ${spent.toFixed(0)}`} />
                  </div>
                </Link>
                <button
                  onClick={() => onDelete(it.id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-ink-100 text-driftwood hover:text-red-600"
                  aria-label="delete"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateItineraryModal onClose={() => setShowCreate(false)} onCreated={onCreated} />
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="label-caps text-[10px]">{label}</div>
      <div className="font-mono text-sm text-ocean mt-1">{value}</div>
    </div>
  );
}

/* ─── Wishlist Tab ─── */
function WishlistTab() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/wishlist");
      setItems(data);
    } catch (e) {
      setErr(formatApiError(e));
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRemove = async (destId) => {
    try {
      await api.delete(`/wishlist/${destId}`);
      setItems((prev) => prev.filter((d) => d.id !== destId));
      toast.success("Removed from wishlist");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <>
      <h3 className="font-serif text-2xl font-bold text-ocean mb-6">Saved Destinations</h3>
      {err && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {err}
        </div>
      )}

      {items === null ? (
        <div className="flex items-center justify-center py-24 text-ink-400">
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-fog rounded-xl bg-white py-20 px-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-ink-50 grid place-items-center mb-5">
            <HeartOff className="h-6 w-6 text-driftwood" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-2xl font-semibold">No saved destinations</h3>
          <p className="text-driftwood mt-2 max-w-md mx-auto">
            Browse our destinations and tap the heart icon to save your favourites here.
          </p>
          <Link
            to="/destinations"
            className="mt-6 inline-flex items-center gap-2 bg-ocean text-white rounded-lg px-5 py-2.5 font-medium transition-colors hover:bg-ocean-deep"
          >
            <Map className="h-4 w-4" strokeWidth={1.5} />
            Browse Destinations
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((d) => (
            <div
              key={d.id}
              className="group relative bg-white border border-fog/60 rounded-2xl overflow-hidden shadow-lift hover:shadow-float transition-all"
            >
              {d.image_url && (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={d.image_url}
                    alt={d.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="label-caps text-gold text-[10px]">
                      {d.region === "domestic" ? "Domestic" : "International"}
                      {d.theme ? ` · ${d.theme}` : ""}
                    </div>
                    <h4 className="font-serif text-xl font-bold text-ocean mt-1">{d.name}</h4>
                  </div>
                  <button
                    onClick={() => onRemove(d.id)}
                    className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                    aria-label="remove from wishlist"
                  >
                    <Heart className="h-5 w-5 fill-red-500" strokeWidth={1.5} />
                  </button>
                </div>
                {d.price_from && (
                  <p className="text-sm text-driftwood mt-2">From <span className="font-mono font-semibold text-charcoal">{d.price_from}</span></p>
                )}
                <Link
                  to={`/destinations/${d.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-ocean text-sm font-label font-semibold uppercase tracking-wider hover:text-gold transition-colors"
                >
                  View Details <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
