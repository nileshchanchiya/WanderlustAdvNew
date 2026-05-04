import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import {
  MapPin, Calendar, Clock, IndianRupee, ArrowLeft, ArrowUpRight,
  Pencil, Trash2, Loader2, X, Check, Star
} from "lucide-react";

/* ── hardcoded catalogue (same slugs as Destinations.jsx) ── */
const CATALOGUE = [
  { slug: "dubai", region: "international", name: "Dubai", tag: "Luxury · Skyline", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80", budget: "luxury", theme: "family", description: "Experience the futuristic skyline, luxury shopping, and desert adventures. Dubai blends ultramodern architecture with rich Arabian culture — from the towering Burj Khalifa to traditional gold souks.", highlights: "Burj Khalifa, Desert Safari, Palm Jumeirah, Dubai Mall, Old Dubai, Atlantis, Global Village", best_time: "November – March", duration: "4–6 nights", price_from: "₹45,000" },
  { slug: "bali", region: "international", name: "Bali", tag: "Beaches · Culture", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "honeymoon", description: "A tropical paradise with terraced rice paddies, sacred temples, and world-class surfing. Bali offers an unmatched blend of nature, spirituality, and nightlife.", highlights: "Ubud Rice Terraces, Uluwatu Temple, Seminyak Beach, Tegallalang, Kuta, Mount Batur", best_time: "April – October", duration: "5–7 nights", price_from: "₹35,000" },
  { slug: "europe", region: "international", name: "Europe", tag: "Classic · Heritage", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80", budget: "luxury", theme: "family", description: "Discover centuries of history across Paris, Rome, Switzerland, and beyond. Europe offers everything from Alpine adventures to Mediterranean coasts.", highlights: "Eiffel Tower, Swiss Alps, Colosseum, Santorini, Amsterdam, Prague", best_time: "May – September", duration: "10–15 nights", price_from: "₹1,20,000" },
  { slug: "maldives", region: "international", name: "Maldives", tag: "Islands · Honeymoon", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80", budget: "luxury", theme: "honeymoon", description: "Crystal-clear lagoons, overwater villas, and pristine white-sand beaches. The Maldives is the ultimate romantic getaway and luxury beach destination.", highlights: "Overwater Villas, Snorkeling, Sunset Cruises, Underwater Dining, Coral Reefs", best_time: "November – April", duration: "4–5 nights", price_from: "₹65,000" },
  { slug: "thailand", region: "international", name: "Thailand", tag: "Beach · Adventure", img: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "friends", description: "From Bangkok's vibrant street food to Phi Phi's turquoise waters, Thailand is the perfect mix of adventure, culture, and affordability.", highlights: "Grand Palace, Phi Phi Islands, Phuket, Chiang Mai, Floating Markets, Krabi", best_time: "November – February", duration: "5–7 nights", price_from: "₹25,000" },
  { slug: "singapore", region: "international", name: "Singapore", tag: "City · Family", img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "family", description: "A compact city-state packed with futuristic gardens, world-class food, and family-friendly attractions. Clean, safe, and endlessly exciting.", highlights: "Marina Bay Sands, Gardens by the Bay, Sentosa, Singapore Zoo, Chinatown, Orchard Road", best_time: "Year-round", duration: "3–5 nights", price_from: "₹40,000" },
  { slug: "goa", region: "domestic", name: "Goa", tag: "Beach · Nightlife", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80", budget: "budget", theme: "friends", description: "India's favourite beach destination — Portuguese heritage, vibrant nightlife, water sports, and laid-back vibes on golden sands.", highlights: "Baga Beach, Fort Aguada, Dudhsagar Falls, Anjuna Flea Market, Old Goa Churches, Palolem", best_time: "October – March", duration: "3–5 nights", price_from: "₹8,000" },
  { slug: "manali", region: "domestic", name: "Manali", tag: "Mountains · Adventure", img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80", budget: "budget", theme: "friends", description: "Nestled in the Himalayas, Manali offers snow-capped peaks, river rafting, and cozy mountain cafes. A gateway to Ladakh and Rohtang Pass.", highlights: "Rohtang Pass, Solang Valley, Old Manali, Hadimba Temple, Jogini Falls, Atal Tunnel", best_time: "March – June, Oct – Feb (snow)", duration: "4–6 nights", price_from: "₹7,000" },
  { slug: "kashmir", region: "domestic", name: "Kashmir", tag: "Snow · Serenity", img: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "honeymoon", description: "Paradise on Earth — houseboats on Dal Lake, snow-dusted Gulmarg, and the tulip gardens of Srinagar. Kashmir is pure magic.", highlights: "Dal Lake, Gulmarg, Pahalgam, Sonmarg, Mughal Gardens, Betaab Valley", best_time: "March – October", duration: "5–7 nights", price_from: "₹12,000" },
  { slug: "kerala", region: "domestic", name: "Kerala", tag: "Backwaters · Nature", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "family", description: "God's Own Country — serene backwaters, lush tea plantations in Munnar, and Ayurvedic wellness retreats on the Malabar coast.", highlights: "Alleppey Backwaters, Munnar Tea Gardens, Fort Kochi, Thekkady, Varkala Beach", best_time: "September – March", duration: "5–7 nights", price_from: "₹10,000" },
  { slug: "ladakh", region: "domestic", name: "Ladakh", tag: "High Altitude · Biking", img: "https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=1200&q=80", budget: "mid", theme: "friends", description: "Dramatic landscapes of barren mountains, pristine lakes, and ancient monasteries. Ladakh is the ultimate road-trip and biking destination.", highlights: "Pangong Lake, Nubra Valley, Khardung La, Leh Palace, Magnetic Hill, Hemis Monastery", best_time: "June – September", duration: "6–8 nights", price_from: "₹15,000" },
  { slug: "rajasthan", region: "domestic", name: "Rajasthan", tag: "Royal · Culture", img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80", budget: "luxury", theme: "family", description: "Land of kings — majestic forts, colourful bazaars, desert safaris, and palatial hotels. Rajasthan is India's most regal experience.", highlights: "Jaipur, Udaipur, Jodhpur, Jaisalmer, Pushkar, Ranthambore Tiger Reserve", best_time: "October – March", duration: "6–10 nights", price_from: "₹12,000" },
];

function getCatalogueBySlug(slug) {
  return CATALOGUE.find((d) => d.slug === slug) || null;
}

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      // first check if it's a built-in catalogue destination
      const cat = getCatalogueBySlug(slug);
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
  const highlightsList = (dest.highlights || "").split(",").map((h) => h.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-ink-0">
      <Seo
        title={`${dest.name} Tour Packages from Rajkot | Wanderlust Adventure`}
        description={dest.description || `Explore ${dest.name} with Wanderlust Adventure — curated tour packages from Rajkot.`}
        path={`/destinations/${slug}`}
      />
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[400px] overflow-hidden">
        <img
          src={imgSrc}
          alt={dest.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/90 via-ocean-deep/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-7xl mx-auto">
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
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">{dest.name}</h1>
          <div className="flex items-center gap-1.5 text-gold font-label text-sm uppercase tracking-wider font-semibold mt-2">
            <MapPin className="h-4 w-4" strokeWidth={1.5} />
            {dest.tag}
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
          <div className="bg-white border border-fog/60 rounded-2xl p-6 shadow-lift space-y-5 mb-10">
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
              <button onClick={saveEdit} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-sunset text-charcoal px-5 py-2.5 text-sm font-label font-semibold uppercase tracking-wider shadow-lift hover:shadow-float disabled:opacity-60">
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
                        className="flex items-center gap-3 bg-white border border-fog/60 rounded-xl px-4 py-3 shadow-lift"
                      >
                        <Star className="h-4 w-4 text-gold flex-shrink-0" fill="currentColor" strokeWidth={0} />
                        <span className="font-body text-charcoal">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div className="space-y-5">
              <div className="bg-white border border-fog/60 rounded-2xl p-6 shadow-lift space-y-4">
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

              <Link
                to="/contact"
                className="block text-center bg-sunset text-charcoal rounded-2xl px-6 py-4 font-label text-sm font-semibold uppercase tracking-wider shadow-lift hover:shadow-float transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  Enquire Now <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>

              <a
                href={`https://wa.me/919016686222?text=Hi, I'm interested in a ${dest.name} tour package`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-[#25D366] text-white rounded-2xl px-6 py-4 font-label text-sm font-semibold uppercase tracking-wider shadow-lift hover:shadow-float transition-all"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
