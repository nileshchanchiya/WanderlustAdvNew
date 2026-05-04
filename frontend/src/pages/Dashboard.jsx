import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CreateItineraryModal from "@/components/CreateItineraryModal";
import api, { formatApiError } from "@/lib/api";
import { Plus, MapPin, Calendar, Briefcase, Users2, Trash2, Loader2, PackageOpen } from "lucide-react";
import { toast } from "sonner";

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

export default function Dashboard() {
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

  useEffect(() => {
    load();
  }, []);

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
    <div className="min-h-screen bg-ink-0">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <div className="label-caps">Your workspace</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-2">
              Itineraries
            </h1>
            <p className="text-ink-500 mt-2">
              Draft, refine, and keep every plan in one calm place.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-5 py-2.5 font-medium transition-colors"
            data-testid="create-itinerary-button"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New itinerary
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
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="itinerary-grid">
            {items.map((it) => {
              const Icon = TYPE_META[it.type]?.icon || Briefcase;
              const spent = (it.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
              const events = (it.events || []).length;
              const packing = (it.packing || []).length;
              return (
                <div
                  key={it.id}
                  className="group relative bg-white border border-ink-200 rounded-xl p-6 hover:border-terracotta transition-colors"
                  data-testid={`itinerary-card-${it.id}`}
                >
                  <Link to={`/itinerary/${it.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 label-caps">
                        <Icon className="h-3.5 w-3.5 text-terracotta" strokeWidth={1.8} />
                        {TYPE_META[it.type]?.label || "Plan"}
                      </div>
                      <div className="font-mono text-xs text-ink-500">
                        {formatRange(it.start_date, it.end_date)}
                      </div>
                    </div>
                    <h3 className="font-display text-2xl font-semibold mt-4 text-ink-900 leading-tight">
                      {it.cover_emoji ? <span className="mr-2">{it.cover_emoji}</span> : null}
                      {it.title}
                    </h3>
                    {it.destination && (
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-ink-500">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {it.destination}
                      </div>
                    )}
                    <div className="mt-6 pt-5 border-t border-ink-200 grid grid-cols-3 gap-2 text-xs">
                      <Stat label="Events" value={events} />
                      <Stat label="Packed" value={packing} />
                      <Stat label="Spent" value={`${it.currency || "USD"} ${spent.toFixed(0)}`} />
                    </div>
                  </Link>
                  <button
                    onClick={() => onDelete(it.id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-ink-100 text-ink-500 hover:text-red-600"
                    data-testid={`delete-itinerary-${it.id}`}
                    aria-label="delete"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateItineraryModal onClose={() => setShowCreate(false)} onCreated={onCreated} />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="label-caps text-[10px]">{label}</div>
      <div className="font-mono text-sm text-ink-900 mt-1">{value}</div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="border border-dashed border-ink-200 rounded-xl bg-white py-20 px-6 text-center">
      <div className="mx-auto h-12 w-12 rounded-xl bg-ink-50 grid place-items-center mb-5">
        <PackageOpen className="h-6 w-6 text-terracotta" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-2xl font-semibold">No itineraries yet</h3>
      <p className="text-ink-500 mt-2 max-w-md mx-auto">
        Create your first plan — a weekend getaway, a conference schedule, or a 3-week trip.
        All the same calm workflow.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-lg px-5 py-2.5 font-medium transition-colors"
        data-testid="empty-create-button"
      >
        <Plus className="h-4 w-4" />
        Create first itinerary
      </button>
      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-ink-500">
        <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
        Works for travel, events, or any multi-day plan
      </div>
    </div>
  );
}
