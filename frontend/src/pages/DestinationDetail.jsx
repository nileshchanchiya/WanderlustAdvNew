import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import ImageGallery from "@/components/ImageGallery";
import ReviewSection from "@/components/ReviewSection";
import DestinationMap from "@/components/DestinationMap";
import RelatedDestinations from "@/components/RelatedDestinations";
import { useAuth } from "@/context/AuthContext";
import { getDestinationBySlug } from "@/lib/destinationData";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import {
  MapPin, Calendar, Clock, IndianRupee, ArrowLeft, ArrowUpRight,
  Pencil, Trash2, Loader2, X, Check, Star, Heart
} from "lucide-react";

export default function DestinationDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dest, setDest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const isAdmin = user && user !== false && user.role === "admin";
  const isLoggedIn = user && user !== false && user !== null;

  // Wishlist state
  const [isWished, setIsWished] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user.wishlist && dest) {
      const destId = dest.id || `builtin-${dest.slug}`;
      setIsWished(user.wishlist.includes(destId));
    }
  }, [isLoggedIn, user, dest]);

  const toggleWishlist = async () => {
    if (!isLoggedIn) {
      toast.info("Log in to save destinations");
      return;
    }
    const destId = dest.id || `builtin-${dest.slug}`;
    try {
      if (isWished) {
        await api.delete(`/wishlist/${destId}`);
        setIsWished(false);
        toast.success("Removed from wishlist");
      } else {
        await api.post(`/wishlist/${destId}`);
        setIsWished(true);
        toast.success("Added to wishlist");
      }
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      // first check if it's a built-in catalogue destination
      const cat = getDestinationBySlug(slug);
      if (cat) {
        setDest({ ...cat, isBuiltIn: true });
        setLoading(false);
        return;
      }
      // otherwise fetch from API
      try {
        const { data } = await api.get(`/destinations/${slug}`);
        setDest({ ...data, isBuiltIn: false });
      } catch (e) {
        setDest(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const startEdit = () => {
    setEditForm({
      name: dest.name || "",
      tag: dest.tag || "",
      description: dest.description || "",
      highlights: dest.highlights || "",
      best_time: dest.best_time || "",
      duration: dest.duration || "",
      price_from: dest.price_from || "",
      image_url: dest.image_url || dest.img || "",
      region: dest.region || "international",
      theme: dest.theme || "family",
      budget: dest.budget || "mid",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/destinations/${dest.id}`, editForm);
      setDest({ ...data, isBuiltIn: false });
      setEditing(false);
      toast.success("Destination updated");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Delete this destination permanently?")) return;
    try {
      await api.delete(`/destinations/${dest.id}`);
      toast.success("Destination deleted");
      navigate("/destinations");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-0">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!dest) {
    return (
      <div className="min-h-screen bg-ink-0">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-32 text-center">
          <h1 className="font-serif text-4xl font-bold text-ocean">Destination not found</h1>
          <p className="mt-4 text-driftwood font-body text-lg">
            We couldn't find a destination with the slug "{slug}".
          </p>
          <Link
            to="/destinations"
            className="mt-8 inline-flex items-center gap-2 bg-ocean text-white rounded-full px-6 py-3 font-label text-sm uppercase tracking-wider font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> All Destinations
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const imgSrc = dest.image_url || dest.img || "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80";
  const galleryImages = [imgSrc, ...(dest.gallery_images || [])];
  const highlightsList = (dest.highlights || "").split(",").map((h) => h.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-ink-0">
      <Seo
        title={`${dest.name} Tour Packages from Rajkot | Wanderlust Adventure`}
        description={dest.description || `Explore ${dest.name} with Wanderlust Adventure — curated tour packages from Rajkot.`}
        path={`/destinations/${slug}`}
      />
      <Navbar />

      {/* ── HERO / GALLERY ── */}
      <section className="relative">
        <ImageGallery images={galleryImages} name={dest.name} />
        {/* Overlay navigation + info on the gallery */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ocean-deep/90 via-ocean-deep/40 to-transparent pointer-events-none">
          <div className="p-6 sm:p-10 max-w-7xl mx-auto pointer-events-auto">
            <Link
              to="/destinations"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-gold text-xs font-label uppercase tracking-wider font-semibold mb-4 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Destinations
            </Link>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-label text-[10px] uppercase tracking-[0.12em] font-semibold rounded-md px-2 py-1 bg-white/90 text-ocean">
                {dest.region === "international" ? "International" : "Domestic"}
              </span>
              <span className="font-label text-[10px] uppercase tracking-[0.12em] font-semibold rounded-md px-2 py-1 bg-gold text-charcoal">
                {(dest.budget || "mid").charAt(0).toUpperCase() + (dest.budget || "mid").slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">{dest.name}</h1>
              {/* Wishlist heart */}
              <button
                onClick={toggleWishlist}
                className={`p-2.5 rounded-full transition-all duration-200 ${
                  isWished
                    ? "bg-white/90 text-red-500"
                    : "bg-white/30 text-white hover:bg-white/60 hover:text-red-500"
                }`}
                aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
                data-testid="detail-wishlist-btn"
              >
                <Heart className={`h-5 w-5 ${isWished ? "fill-red-500" : ""}`} strokeWidth={2} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-gold font-label text-sm uppercase tracking-wider font-semibold mt-2">
              <MapPin className="h-4 w-4" strokeWidth={1.5} />
              {dest.tag}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Admin actions */}
        {isAdmin && !dest.isBuiltIn && (
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-fog/60">
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-2 bg-ocean text-white rounded-full px-5 py-2.5 font-label text-xs font-semibold uppercase tracking-wider hover:shadow-float transition-all"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-2 border border-danger text-danger rounded-full px-5 py-2.5 font-label text-xs font-semibold uppercase tracking-wider hover:bg-danger hover:text-white transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}

        {editing ? (
          /* ── EDIT FORM ── */
          <div className="bg-white border border-fog/60 rounded-2xl p-6 space-y-5 mb-10">
            <h2 className="font-serif text-2xl font-bold text-ocean">Edit Destination</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-caps mb-2 block">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5" />
              </div>
              <div>
                <label className="label-caps mb-2 block">Tag</label>
                <input value={editForm.tag} onChange={(e) => setEditForm({...editForm, tag: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5" />
              </div>
              <div>
                <label className="label-caps mb-2 block">Region</label>
                <select value={editForm.region} onChange={(e) => setEditForm({...editForm, region: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5">
                  <option value="international">International</option>
                  <option value="domestic">Domestic</option>
                </select>
              </div>
              <div>
                <label className="label-caps mb-2 block">Theme</label>
                <select value={editForm.theme} onChange={(e) => setEditForm({...editForm, theme: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5">
                  <option value="family">Family</option>
                  <option value="honeymoon">Honeymoon</option>
                  <option value="friends">Friends</option>
                  <option value="solo">Solo</option>
                  <option value="adventure">Adventure</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              <div>
                <label className="label-caps mb-2 block">Budget</label>
                <select value={editForm.budget} onChange={(e) => setEditForm({...editForm, budget: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5">
                  <option value="budget">Budget</option>
                  <option value="mid">Mid-range</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              <div>
                <label className="label-caps mb-2 block">Image URL</label>
                <input value={editForm.image_url} onChange={(e) => setEditForm({...editForm, image_url: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5 font-mono text-sm" />
              </div>
              <div>
                <label className="label-caps mb-2 block">Best Time</label>
                <input value={editForm.best_time} onChange={(e) => setEditForm({...editForm, best_time: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5" />
              </div>
              <div>
                <label className="label-caps mb-2 block">Duration</label>
                <input value={editForm.duration} onChange={(e) => setEditForm({...editForm, duration: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5" />
              </div>
              <div>
                <label className="label-caps mb-2 block">Price From</label>
                <input value={editForm.price_from} onChange={(e) => setEditForm({...editForm, price_from: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5" />
              </div>
            </div>
            <div>
              <label className="label-caps mb-2 block">Description</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows={4} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5 resize-none" />
            </div>
            <div>
              <label className="label-caps mb-2 block">Highlights (comma separated)</label>
              <input value={editForm.highlights} onChange={(e) => setEditForm({...editForm, highlights: e.target.value})} className="w-full bg-white border border-fog rounded-lg px-3 py-2.5" />
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-fog/60">
              <button onClick={() => setEditing(false)} className="rounded-lg border border-fog px-5 py-2.5 text-sm font-label font-semibold text-charcoal hover:bg-sand">
                <X className="h-4 w-4 inline mr-1" />Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-sunset text-charcoal px-5 py-2.5 text-sm font-label font-semibold uppercase tracking-wider hover:shadow-float disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* ── DISPLAY ── */
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              {dest.description && (
                <div>
                  <h2 className="font-serif text-3xl font-bold text-ocean mb-4">About {dest.name}</h2>
                  <p className="text-charcoal leading-relaxed font-body text-lg whitespace-pre-line">
                    {dest.description}
                  </p>
                </div>
              )}

              {highlightsList.length > 0 && (
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ocean mb-4">Top Highlights</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {highlightsList.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-white border border-fog/60 rounded-xl px-4 py-3"
                      >
                        <Star className="h-4 w-4 text-gold flex-shrink-0" fill="currentColor" strokeWidth={0} />
                        <span className="font-body text-charcoal">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── REVIEWS ── */}
              <ReviewSection destinationSlug={slug} />
            </div>

            {/* ── SIDEBAR ── */}
            <div className="space-y-5">
              <div className="bg-white border border-fog/60 rounded-2xl p-6 space-y-4">
                <h3 className="font-serif text-xl font-bold text-ocean">Trip Details</h3>
                {dest.best_time && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <div className="label-caps text-driftwood text-[10px]">Best Time to Visit</div>
                      <div className="font-body text-charcoal mt-0.5">{dest.best_time}</div>
                    </div>
                  </div>
                )}
                {dest.duration && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <div className="label-caps text-driftwood text-[10px]">Recommended Duration</div>
                      <div className="font-body text-charcoal mt-0.5">{dest.duration}</div>
                    </div>
                  </div>
                )}
                {dest.price_from && (
                  <div className="flex items-start gap-3">
                    <IndianRupee className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <div className="label-caps text-driftwood text-[10px]">Starting From</div>
                      <div className="font-body text-charcoal mt-0.5 text-lg font-semibold">{dest.price_from}</div>
                      <div className="text-xs text-driftwood">per person</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── MAP ── */}
              <DestinationMap
                latitude={dest.latitude}
                longitude={dest.longitude}
                name={dest.name}
              />

              <Link
                to="/contact"
                className="block text-center bg-sunset text-charcoal rounded-2xl px-6 py-4 font-label text-sm font-semibold uppercase tracking-wider hover:shadow-float transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  Enquire Now <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>

              <a
                href={`https://wa.me/919016686222?text=Hi, I'm interested in a ${dest.name} tour package`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-[#25D366] text-white rounded-2xl px-6 py-4 font-label text-sm font-semibold uppercase tracking-wider hover:shadow-float transition-all"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        )}
      </section>

      {/* ── RELATED DESTINATIONS ── */}
      {!editing && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <RelatedDestinations
            currentSlug={slug}
            theme={dest.theme}
            region={dest.region}
          />
        </section>
      )}

      <Footer />
    </div>
  );
}
