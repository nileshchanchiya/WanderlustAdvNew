import React, { useState, useEffect, useCallback } from "react";
import { Star, User, Loader2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Star display — filled / empty                                     */
/* ------------------------------------------------------------------ */
function Stars({ rating, size = "h-4 w-4" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${
            n <= rating ? "text-gold fill-gold" : "text-fog"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Interactive star picker                                           */
/* ------------------------------------------------------------------ */
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onClick={() => onChange(n)}
          className="focus:outline-none transition-transform hover:scale-110"
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={`h-6 w-6 ${
              n <= (hovered || value) ? "text-gold fill-gold" : "text-fog"
            } transition-colors`}
            strokeWidth={1.5}
          />
        </button>
      ))}
      {(hovered || value) > 0 && (
        <span className="ml-2 font-label text-xs text-driftwood tracking-wide">
          {hovered || value}/5
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single review card                                                */
/* ------------------------------------------------------------------ */
function ReviewCard({ review }) {
  const initial = (review.user_name || review.userName || "U").charAt(0).toUpperCase();
  const displayName = review.user_name || review.userName || "Traveller";
  const date = review.created_at || review.createdAt;
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="bg-white border border-fog/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-lift">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-ocean/10 text-ocean font-label font-bold text-sm flex items-center justify-center shrink-0">
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + date row */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-label text-sm font-semibold text-charcoal truncate">
              {displayName}
            </span>
            {formattedDate && (
              <span className="text-xs text-driftwood shrink-0">{formattedDate}</span>
            )}
          </div>

          {/* Stars */}
          <div className="mt-1">
            <Stars rating={review.rating} />
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="mt-3 text-sm text-charcoal/80 leading-relaxed">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ReviewSection — main export                                       */
/* ================================================================== */
export default function ReviewSection({ destinationSlug }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  /* ---- Fetch reviews ---- */
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/${destinationSlug}`);
      setReviews(res.data?.reviews || res.data || []);
    } catch {
      // Silently fail — empty state will show
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [destinationSlug]);

  useEffect(() => {
    if (destinationSlug) fetchReviews();
  }, [destinationSlug, fetchReviews]);

  /* ---- Computed stats ---- */
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount).toFixed(1)
      : 0;

  /* ---- Submit review ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/reviews/${destinationSlug}`, { rating, comment });
      toast.success("Review submitted — thank you!");
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="font-serif text-2xl font-bold text-ocean">Reviews</h2>
        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-label text-lg font-bold text-charcoal">{avgRating}</span>
            <Stars rating={Math.round(avgRating)} />
            <span className="text-sm text-driftwood">
              ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
            </span>
          </div>
        )}
      </div>

      {/* Review list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-driftwood gap-2">
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
          <span className="text-sm">Loading reviews…</span>
        </div>
      ) : reviewCount === 0 ? (
        <div className="bg-white border border-fog/60 rounded-2xl p-8 text-center">
          <User className="h-8 w-8 text-fog mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-driftwood text-sm">Be the first to review this destination!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <ReviewCard key={review._id || review.id || idx} review={review} />
          ))}
        </div>
      )}

      {/* Write a review */}
      <div className="mt-8">
        {user ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-fog/60 rounded-2xl p-6 space-y-4"
          >
            <h3 className="label-caps mb-1">Write a Review</h3>

            {/* Star picker */}
            <StarPicker value={rating} onChange={setRating} />

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience…"
              rows={4}
              className="w-full rounded-xl border border-fog/60 bg-sand/50 px-4 py-3 text-sm text-charcoal placeholder:text-driftwood/60 focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none transition-colors"
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-sunset text-white font-label text-sm font-semibold uppercase tracking-wider px-6 py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        ) : (
          <div className="bg-white border border-fog/60 rounded-2xl p-6 text-center">
            <p className="text-driftwood text-sm">
              <a href="/login" className="text-ocean font-semibold hover:underline">
                Log in
              </a>{" "}
              to write a review
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
