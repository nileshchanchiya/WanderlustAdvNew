import React from "react";
import { Calendar, MapPin, Wallet, Package, Clock } from "lucide-react";

function formatRange(s, e) {
  if (!s && !e) return "Dates not set";
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";
  return `${fmt(s)}${s && e ? "  →  " : ""}${fmt(e)}`;
}

export default function OverviewTab({ itinerary }) {
  const totalSpent = (itinerary.expenses || []).reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );
  const packedCount = (itinerary.packing || []).filter((p) => p.packed).length;
  const packingTotal = (itinerary.packing || []).length;
  const eventCount = (itinerary.events || []).length;

  const stats = [
    { icon: Clock, label: "Events", value: eventCount },
    { icon: Package, label: "Packed", value: packingTotal ? `${packedCount}/${packingTotal}` : "0" },
    {
      icon: Wallet,
      label: "Spent",
      value: `${itinerary.currency || "USD"} ${totalSpent.toFixed(0)}`,
    },
    {
      icon: Calendar,
      label: "Dates",
      value: itinerary.start_date && itinerary.end_date ? `${itinerary.start_date} → ${itinerary.end_date}` : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white border border-ink-200 rounded-xl p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="label-caps capitalize">{itinerary.type} · Overview</div>
            <h2 className="font-display text-3xl font-bold tracking-tight mt-2">
              {itinerary.cover_emoji && <span className="mr-2">{itinerary.cover_emoji}</span>}
              {itinerary.title}
            </h2>
            {itinerary.destination && (
              <div className="flex items-center gap-1.5 mt-2 text-ink-600">
                <MapPin className="h-4 w-4" strokeWidth={1.5} />
                {itinerary.destination}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-1 text-ink-500 font-mono text-sm">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
              {formatRange(itinerary.start_date, itinerary.end_date)}
            </div>
          </div>
        </div>
        {itinerary.description && (
          <p className="mt-6 text-ink-700 leading-relaxed max-w-3xl whitespace-pre-wrap">
            {itinerary.description}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200 border border-ink-200 rounded-xl overflow-hidden">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6">
            <s.icon className="h-5 w-5 text-terracotta mb-4" strokeWidth={1.5} />
            <div className="label-caps text-[10px]">{s.label}</div>
            <div className="font-mono text-xl font-medium mt-1 truncate">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
