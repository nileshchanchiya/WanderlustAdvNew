import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { MapPinOff } from "lucide-react";

// Default leaflet icon fix (marker images via CDN)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export default function MapTab({ itinerary }) {
  const events = (itinerary.events || []).filter(
    (e) => typeof e.lat === "number" && typeof e.lng === "number"
  );

  const center = useMemo(() => {
    if (events.length === 0) return [20, 0];
    const avgLat = events.reduce((s, e) => s + e.lat, 0) / events.length;
    const avgLng = events.reduce((s, e) => s + e.lng, 0) / events.length;
    return [avgLat, avgLng];
  }, [events]);

  const polylinePoints = useMemo(
    () => events.slice().sort((a, b) => (a.day_index - b.day_index) || (a.time || "").localeCompare(b.time || "")).map((e) => [e.lat, e.lng]),
    [events]
  );

  if (events.length === 0) {
    return (
      <div className="bg-white border border-dashed border-ink-200 rounded-xl py-16 text-center">
        <MapPinOff className="h-6 w-6 mx-auto text-terracotta mb-3" strokeWidth={1.5} />
        <p className="font-display text-xl font-semibold">No mapped locations yet</p>
        <p className="text-ink-500 mt-1 max-w-md mx-auto">
          Add latitude and longitude to a timeline event to see it on the map. Tip — right-click any place in Google Maps and copy the coordinates.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-ink-200 rounded-xl overflow-hidden" data-testid="map-container">
      <div className="h-[520px]">
        <MapContainer center={center} zoom={12} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='© <a href="https://carto.com/attributions">CARTO</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {polylinePoints.length >= 2 && (
            <Polyline positions={polylinePoints} pathOptions={{ color: "#DE6242", weight: 3, opacity: 0.8, dashArray: "6 6" }} />
          )}
          {events.map((e, i) => (
            <Marker key={e.id} position={[e.lat, e.lng]}>
              <Popup>
                <div className="font-sans">
                  <div className="text-xs text-neutral-500 font-mono">Day {e.day_index + 1} · {e.time || "—"}</div>
                  <div className="font-semibold mt-1">{e.title}</div>
                  {e.location && <div className="text-xs text-neutral-500">{e.location}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="p-5 border-t border-ink-200 flex items-center justify-between text-sm">
        <div className="label-caps">{events.length} mapped stops</div>
        <div className="font-mono text-xs text-ink-500">
          Center {center[0].toFixed(3)}, {center[1].toFixed(3)}
        </div>
      </div>
    </div>
  );
}
