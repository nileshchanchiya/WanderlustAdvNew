import React from "react";
import { MapPin } from "lucide-react";

export default function DestinationMap({ latitude, longitude, name = "Destination" }) {
  if (!latitude || !longitude) {
    return (
      <div className="bg-white border border-fog/60 rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <span className="label-caps">Location</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-driftwood gap-2">
          <MapPin className="h-8 w-8 text-fog" strokeWidth={1.5} />
          <p className="text-sm">Map not available for this destination</p>
        </div>
      </div>
    );
  }

  const bbox = `${longitude - 0.05},${latitude - 0.03},${longitude + 0.05},${latitude + 0.03}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className="bg-white border border-fog/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <span className="label-caps">Location</span>
          <h3 className="font-serif text-lg font-bold text-ocean mt-1">{name}</h3>
        </div>
        <MapPin className="h-5 w-5 text-gold" strokeWidth={1.5} />
      </div>

      {/* Map iframe */}
      <iframe
        title={`Map of ${name}`}
        src={embedUrl}
        style={{ width: "100%", height: "250px", border: 0 }}
        loading="lazy"
        allowFullScreen
        className="block"
      />
    </div>
  );
}
