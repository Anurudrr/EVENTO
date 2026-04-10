import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, Star } from 'lucide-react';
import { reviewService } from '../services/reviewService';
import { Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils';

interface ReviewSectionProps {
  serviceId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ serviceId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => review.rating === star).length;
    return {
      star,
      count,
      width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%',
    };
  });

  useEffect(() => {
    void fetchReviews();
  }, [serviceId]);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await reviewService.getServiceReviews(serviceId);
      setReviews(data);
    } catch {
      setError('Unable to load reviews right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) return;

    setSubmitting(true);
    setError('');

    try {
      await reviewService.createReview(serviceId, { rating, comment });
      setComment('');
      setRating(5);
      await fetchReviews();
    } catch (error) {
      setError(getErrorMessage(error, 'Unable to submit your review right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-20 border-t border-noir-border pt-10">
      <div className="mb-10 grid gap-6 border border-noir-border bg-noir-card p-8 md:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Guest reviews</p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-5xl font-display font-semibold text-noir-ink">{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
            <span className="pb-2 text-xs uppercase tracking-[0.25em] text-noir-muted">/ 5 average</span>
          </div>
          <p className="mt-3 text-xs uppercase tracking-wide text-noir-muted">{reviews.length} verified review{reviews.length === 1 ? '' : 's'}</p>
        </div>
        <div className="space-y-3">
          {ratingBreakdown.map((entry) => (
            <div key={entry.star} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-3 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-noir-muted">
              <span>{entry.star} star</span>
              <div className="h-2 overflow-hidden bg-noir-bg">
                <div className="h-full bg-noir-accent" style={{ width: entry.width }} />
              </div>
              <span className="text-right">{entry.count}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-8 border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-rose-500 text-xs font-mono font-semibold uppercase tracking-widest">
          {error}
        </div>
      )}

      {isAuthenticated ? (
        <div className="bg-noir-card border border-noir-border p-8 mb-12">
          <h4 className="text-lg font-display font-semibold text-noir-ink uppercase tracking-wide mb-6">Write a Review</h4>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-[0.3em]">Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-10 h-10 border flex items-center justify-center transition-colors ${
                      rating >= star
                        ? 'bg-noir-accent text-noir-bg border-noir-accent'
                        : 'bg-noir-bg text-noir-muted border-noir-border hover:border-noir-accent hover:text-noir-accent'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${rating >= star ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this service..."
              rows={4}
              className="w-full bg-noir-bg border border-noir-border px-6 py-4 text-noir-ink focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all resize-none placeholder:text-noir-muted/30"
            />

            <button
              type="submit"
              disabled={submitting}
              className="btn-noir !py-4 !px-10 flex items-center gap-3"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Post Review
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="mb-12 bg-noir-card border border-noir-border px-6 py-5 text-noir-muted text-xs font-mono font-semibold uppercase tracking-[0.3em]">
          Sign in after your completed booking to leave a review for this service.
        </div>
      )}

      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-noir-accent animate-spin" />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review, index) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-6 p-8 bg-noir-card border border-noir-border"
            >
              <div className="w-14 h-14 bg-noir-accent text-noir-bg flex items-center justify-center text-xl font-semibold shrink-0">
                {((review.user as any)?.name || 'G').charAt(0)}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-noir-ink uppercase tracking-wide">{(review.user as any)?.name || 'Guest'}</h5>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            review.rating >= star ? 'text-noir-accent fill-current' : 'text-noir-border'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-noir-muted font-semibold uppercase tracking-widest">
                    {new Date(review.createdAt || '').toLocaleDateString()}
                  </span>
                </div>
                <p className="text-noir-muted leading-relaxed mt-4 uppercase tracking-normal">
                  {review.comment}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-10 bg-noir-card border border-dashed border-noir-border">
            <p className="text-noir-muted italic">No reviews yet. Be the first to share your experience.</p>
          </div>
        )}
      </div>
    </section>
  );
};
