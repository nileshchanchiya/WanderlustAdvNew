import React, { useMemo, useState } from "react";
import { MapPinOff, MapPin, Clock, Navigation } from "lucide-react";

const MAPS_KEY = "AIzaSyDzESV2Qc0Ik_pJMvgvrXCGaLL-UNOZFyw";

export default function MapTab({ itinerary }) {
  const events = useMemo(
    () =>
      (itinerary.events || [])
        .filter((e) => typeof e.lat === "number" && typeof e.lng === "number")
        .sort((a, b) => (a.day_index - b.day_index) || (a.time || "").localeCompare(b.time || "")),
    [itinerary.events]
  );

  const [selected, setSelected] = useState(null);

  const center = useMemo(() => {
    if (events.length === 0) return { lat: 20, lng: 0 };
    const avgLat = events.reduce((s, e) => s + e.lat, 0) / events.length;
    const avgLng = events.reduce((s, e) => s + e.lng, 0) / events.length;
    return { lat: avgLat, lng: avgLng };
  }, [events]);

  // Build Google Maps Static/Embed URL with markers
  const embedUrl = useMemo(() => {
    if (events.length === 0) return "";
    if (events.length === 1) {
      return `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${events[0].lat},${events[0].lng}&zoom=14`;
    }
    // Use directions mode for route visualization
    const origin = `${events[0].lat},${events[0].lng}`;
    const dest = `${events[events.length - 1].lat},${events[events.length - 1].lng}`;
    const waypoints = events
      .slice(1, -1)
      .map((e) => `${e.lat},${e.lng}`)
      .join("|");
    let url = `https://www.google.com/maps/embed/v1/directions?key=${MAPS_KEY}&origin=${origin}&destination=${dest}&mode=driving`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    return url;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="bg-white border border-dashed border-ink-200 rounded-xl py-16 text-center">
        <MapPinOff className="h-6 w-6 mx-auto text-terracotta mb-3" strokeWidth={1.5} />
        <p className="font-display text-xl font-semibold">No mapped locations yet</p>
        <p className="text-ink-500 mt-1 max-w-md mx-auto">
          Use the <strong>Timeline</strong> tab to add events with locations. Search any place and coordinates will be saved automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="map-container">
      {/* Full-route Google Maps embed */}
      <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
        <div className="h-[520px]">
          <iframe
            title="Trip Route Map"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={embedUrl}
          />
        </div>
        <div className="p-4 border-t border-ink-200 flex items-center justify-between text-sm">
          <div className="label-caps">{events.length} mapped stops</div>
          <a
            href={`https://www.google.com/maps/dir/${events.map(e => `${e.lat},${e.lng}`).join("/")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-terracotta hover:underline text-sm font-medium"
          >
            <Navigation className="h-3.5 w-3.5" /> Open in Google Maps
          </a>
        </div>
      </div>

      {/* Stop list */}
      <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-ink-200">
          <div className="label-caps">All Stops</div>
        </div>
        <div className="divide-y divide-ink-100">
          {events.map((ev, i) => (
            <button
              key={ev.id}
              onClick={() => setSelected(selected === ev.id ? null : ev.id)}
              className="w-full text-left px-4 py-3 hover:bg-ink-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900 truncate">{ev.title}</span>
                    <span className="text-[10px] text-ink-400 font-mono flex-shrink-0">Day {(ev.day_index || 0) + 1}</span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-ink-400 font-mono flex-shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {ev.time || "—"}
                </div>
              </div>

              {/* Expanded mini-map */}
              {selected === ev.id && (
                <div className="mt-3 rounded-lg overflow-hidden border border-ink-100" onClick={(e) => e.stopPropagation()}>
                  <iframe
                    title={`Map: ${ev.title}`}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${ev.lat},${ev.lng}&zoom=15`}
                  />
                  <div className="px-3 py-2 bg-ink-50 flex items-center justify-between text-xs">
                    <span className="font-mono text-ink-500">{ev.lat?.toFixed(5)}, {ev.lng?.toFixed(5)}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${ev.lat},${ev.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terracotta hover:underline font-medium"
                    >
                      Open in Maps →
                    </a>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
