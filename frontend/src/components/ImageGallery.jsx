import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";

export default function ImageGallery({ images = [], name = "Destination" }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = useCallback((index) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard support
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  if (!images || images.length === 0) return null;

  const visibleThumbnails = images.slice(1, 3);
  const extraCount = images.length - 3;

  return (
    <>
      {/* Gallery Grid */}
      <div className="h-[55vh] min-h-[400px] rounded-2xl border border-fog/60 overflow-hidden">
        {images.length === 1 ? (
          /* Single image — full width */
          <button
            onClick={() => openLightbox(0)}
            className="w-full h-full block focus:outline-none group"
          >
            <img
              src={images[0]}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </button>
        ) : (
          /* Hero + thumbnails */
          <div className="grid grid-cols-3 gap-1.5 h-full">
            {/* Hero — 2/3 width */}
            <button
              onClick={() => openLightbox(0)}
              className="col-span-2 h-full block focus:outline-none group"
            >
              <img
                src={images[0]}
                alt={`${name} — main`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </button>

            {/* Thumbnails — 1/3 width, stacked */}
            <div className="flex flex-col gap-1.5 h-full">
              {visibleThumbnails.map((src, i) => {
                const imgIndex = i + 1;
                const isLast = i === visibleThumbnails.length - 1 && extraCount > 0;

                return (
                  <button
                    key={imgIndex}
                    onClick={() => openLightbox(imgIndex)}
                    className="relative flex-1 min-h-0 block focus:outline-none group overflow-hidden"
                  >
                    <img
                      src={src}
                      alt={`${name} — ${imgIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {isLast && (
                      <div className="absolute inset-0 bg-charcoal/50 flex items-center justify-center transition-colors group-hover:bg-charcoal/60">
                        <div className="flex items-center gap-1.5 text-white">
                          <Images className="h-5 w-5" strokeWidth={1.5} />
                          <span className="font-label text-sm font-semibold tracking-wide">
                            +{extraCount} more
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-charcoal/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 font-label text-sm text-white/70 tracking-wider z-10">
            {activeIndex + 1} / {images.length}
          </div>

          {/* Previous arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20 transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
            </button>
          )}

          {/* Active image */}
          <img
            src={images[activeIndex]}
            alt={`${name} — ${activeIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg opacity-0 scale-95 animate-fade-in"
            style={{ animation: "fadeScale 0.25s ease-out forwards" }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20 transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
            </button>
          )}

          {/* Inline keyframes */}
          <style>{`
            @keyframes fadeScale {
              from { opacity: 0; transform: scale(0.95); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
