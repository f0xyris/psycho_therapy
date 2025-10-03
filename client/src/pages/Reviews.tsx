import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const Reviews = () => {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  type ReviewForm = { name: string; comment: string; rating: number };
  const [form, setForm] = useState<ReviewForm>({ name: "", comment: "", rating: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<ReviewForm[]>([]);

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ["/api/reviews"],
    queryFn: async () => {
      const response = await fetch("/api/reviews");
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  type ReviewCard = ReviewForm & { id: string | number; pending?: boolean };
  const allReviews: ReviewCard[] = [
    ...pendingReviews.map((r, idx) => ({
      ...r,
      id: `pending-${idx}`,
      name: r.name || t.reviewFormAnonymous,
      comment: r.comment,
      rating: r.rating,
      pending: true,
    })),
    ...(Array.isArray(reviews) ? reviews : []),
  ];

  React.useEffect(() => {
    if (user && (user.firstName || user.lastName)) {
      setForm(f => ({ ...f, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() }));
    }
  }, [user]);

  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const renderStars = (rating: number, onSelect?: (n: number) => void) => {
    if (!onSelect) {
      return Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? "h-5 w-5 sm:h-6 sm:w-6 fill-yellow-500 text-yellow-500 transition-colors"
              : "h-5 w-5 sm:h-6 sm:w-6 text-gray-300 dark:text-gray-500 transition-colors"
          }
        />
      ));
    }
    return Array.from({ length: 5 }, (_, i) => {
      let isFilled = i < rating;
      if (hoveredStar !== null) {
        if (hoveredStar > rating) {
          isFilled = i < hoveredStar && i >= rating ? true : i < rating;
        } else {
          isFilled = i < hoveredStar;
        }
      }
      return (
        <button
          type="button"
          key={i}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 m-0 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-mystical-400 cursor-pointer transition-colors"
          onClick={() => onSelect(i + 1)}
          onMouseEnter={() => {
            if (hoveredStar !== i + 1) setHoveredStar(i + 1);
          }}
          onMouseLeave={() => setHoveredStar(null)}
          tabIndex={0}
          aria-label={`${i + 1}`}
          style={{ background: 'none', border: 'none' }}
        >
          <Star className={isFilled ? 'fill-yellow-500 text-yellow-500 transition-colors' : 'text-gray-400 dark:text-gray-500 transition-colors'} style={{ border: 'none', margin: 0, padding: 0 }} />
        </button>
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.comment.trim()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        name: form.name || "",
        comment: form.comment,
        rating: Number(form.rating),
        serviceId: null,
        status: 'pending'
      };
      if (user && user.id) payload.userId = user.id;
      const token = localStorage.getItem('auth_token');
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setPendingReviews([{ ...form }, ...pendingReviews]);
        setForm({ name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "", comment: "", rating: 5 });
      } else if (res.status === 401) {
        alert('Пожалуйста, войдите, чтобы оставить отзыв.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-3 sm:px-4 lg:px-8 py-6 sm:py-12 dark:bg-deep-900">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-mystical-500 dark:text-mystical-400 mb-2 sm:mb-4">{t.reviewsTitle}</h1>
          <p className="text-muted-foreground dark:text-muted-foreground text-sm sm:text-base">{t.reviewsDescription}</p>
        </div>
      <section className="mb-10 bg-background dark:bg-deep-900 rounded-lg shadow-xl border border-muted-foreground/10 p-0">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-mystical-600 dark:text-mystical-300 mb-2">{t.reviewFormTitle}</h2>
          <p className="text-muted-foreground mb-4 text-sm">{t.reviewFormDescription}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-mystical-700 dark:text-mystical-300">{t.reviewFormNameLabel}</label>
              <Input
                className="review-name-input bg-white text-purple-700 placeholder:text-purple-300 dark:bg-background dark:text-foreground"
                placeholder={t.reviewFormNamePlaceholder}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={32}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-mystical-700 dark:text-mystical-300">{t.reviewFormTextLabel} <span className="text-destructive">*</span></label>
              <Textarea
                placeholder={t.reviewFormTextPlaceholder}
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                required
                minLength={5}
                maxLength={400}
                disabled={submitting}
                className="border-0 focus:ring-2 focus:ring-mystical-400 shadow-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-mystical-700 dark:text-mystical-300">{t.reviewFormRatingLabel}</label>
              <div className="flex">{renderStars(form.rating, n => setForm(f => ({ ...f, rating: n })))}</div>
            </div>
            <Button type="submit" className="w-full mt-2" disabled={submitting || !form.comment.trim()}>
              {submitting ? t.reviewFormSubmitting : t.reviewFormSubmit}
            </Button>
          </form>
        </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {loadingReviews ? (
          <>
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card animate-pulse">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-mystical-200 to-accent-200 dark:from-mystical-700 dark:to-accent-700 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 bg-mystical-300 dark:bg-mystical-600 rounded-full"></div>
                    </div>
                    <div className="ml-4 space-y-2">
                      <div className="h-4 bg-gradient-to-r from-mystical-200 to-mystical-300 dark:from-mystical-700 dark:to-mystical-600 rounded w-24"></div>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, starIndex) => (
                          <div key={starIndex} className="w-4 h-4 bg-gradient-to-r from-yellow-200 to-yellow-300 dark:from-yellow-600 dark:to-yellow-500 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-full"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          allReviews.map((review) => (
            <Card key={review.id} className={`shadow-xl dark:shadow-mystical-500/10 bg-background dark:bg-card hover:shadow-2xl dark:hover:shadow-mystical-500/20 transition-all duration-300 ${'pending' in review && review.pending ? 'opacity-60 pointer-events-none' : ''}`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-mystical-600 to-accent-600 dark:from-mystical-500 dark:to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                    <User className=" h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-mystical-700 dark:text-mystical-400">{review.name}</h3>
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-muted-foreground italic">"{review.comment}"</p>
                {'pending' in review && review.pending && (
                  <div className="mt-2 text-xs text-muted-foreground">{t.reviewFormPending}</div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </main>
  );
};

export default Reviews;
