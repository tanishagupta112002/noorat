"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/user-session";

type OrderReviewFormProps = {
  itemId: string;
  orderId: string;
  onSubmitted?: () => void;
};

export function OrderReviewForm({ itemId, orderId, onSubmitted }: OrderReviewFormProps) {
  const { session } = useSession();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !comment.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", session?.user?.name?.trim() || "Customer");
      formData.append("comment", comment.trim());
      formData.append("rating", String(rating));
      formData.append("orderId", orderId);
      if (session?.user?.email) {
        formData.append("email", session.user.email);
      }
      if (mediaFile) {
        formData.append("media", mediaFile);
      }

      const response = await fetch(`/api/rentals/${itemId}/reviews`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Could not submit review");
      }

      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const activeStars = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs font-medium">
          Rating <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={`h-5 w-5 ${
                  activeStars >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="order-review-comment" className="text-xs font-medium">
          Comment <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="order-review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="min-h-20 text-xs"
          required
          maxLength={600}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="order-review-media" className="text-xs font-medium">
          Photo/Video (optional)
        </Label>
        <Input
          id="order-review-media"
          type="file"
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
          className="text-xs"
          onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
        />
        {mediaFile ? <p className="text-[11px] text-muted-foreground">{mediaFile.name}</p> : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <Button
        type="submit"
        size="sm"
        disabled={!rating || !comment.trim() || submitting}
        className="h-8 text-xs"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
