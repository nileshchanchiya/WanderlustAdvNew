import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import api from "@/lib/api";
import { DESTINATIONS } from "@/lib/destinationData";

/* ------------------------------------------------------------------ */
/*  Skeleton loader card                                              */
/* ------------------------------------------------------------------ */
function SkeletonCard() {
  return (
    <div className="min-w-[260px] max-w-[300px] rounded-xl border border-fog/60 overflow-hidden shrink-0">
      <div className="aspect-[3/2] shimmer" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-24 rounded shimmer" />
        <div className="h-3 w-16 rounded shimmer" />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  RelatedDestinations                                               */
/* ================================================================== */
export default function RelatedDestinations({ currentSlug, theme, region }) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      // 1. Try API first
      try {
        const res = await api.get(`/destinations/${currentSlug}/related`);
        const data = res.data?.destinations || res.data || [];
        if (!cancelled && data.length > 0) {
          setRelated(data.slice(0, 4));
          setLoading(false);
          return;
        }
      } catch {
        // API failed — fall through to local fallback
      }

      // 2. Fallback: filter from shared catalogue
      if (!cancelled) {
        const fallback = DESTINATIONS.filter((d) => {
          if (d.slug === currentSlug) return false;
          return d.theme === theme || d.region === region;
        }).slice(0, 4);

        setRelated(fallback);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentSlug, theme, region]);

  // Don't render section if nothing to show
  if (!loading && related.length === 0) return null;

  return (
    <section>
      <h2 className="font-serif text-2xl font-bold text-ocean mb-5">
        You might also like
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {loading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : related.map((dest) => {
              const slug = dest.slug || dest.name?.toLowerCase().replace(/\s+/g, "-");
              const image =
                dest.img ||
                dest.image ||
                dest.images?.[0] ||
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80";
              const tag = dest.tag || "";
              const regionLabel = dest.region || "";

              return (
                <Link
                  key={dest.id || slug}
                  to={`/destinations/${slug}`}
                  className="min-w-[260px] max-w-[300px] rounded-xl border border-fog/60 overflow-hidden shrink-0 bg-white hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Image */}
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={image}
                      alt={dest.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-serif text-base font-bold text-ocean truncate">
                      {dest.name}
                    </h3>

                    {tag && (
                      <p className="text-xs text-driftwood mt-0.5 truncate">{tag}</p>
                    )}

                    {regionLabel && (
                      <span className="inline-block mt-2 font-label text-[10px] uppercase tracking-[0.12em] font-semibold rounded-md px-2 py-1 bg-ocean/5 text-ocean">
                        <MapPin
                          className="inline h-3 w-3 mr-0.5 -mt-px"
                          strokeWidth={1.5}
                        />
                        {regionLabel}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
