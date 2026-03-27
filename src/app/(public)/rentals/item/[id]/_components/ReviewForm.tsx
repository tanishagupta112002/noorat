"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/user-session";

export function ReviewForm({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { session } = useSession();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState(session?.user?.name || "");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !name.trim() || !comment.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("title", title.trim());
      formData.append("comment", comment.trim());
      formData.append("rating", String(rating));
      if (session?.user?.email) {
        formData.append("email", session.user.email);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(`/api/rentals/${itemId}/reviews`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Could not submit review");
      }

      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  }

  function onImageChange(file: File | null) {
    setImageFile(file);

    if (!file) {
      setImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
        <p className="font-semibold text-green-700 dark:text-green-400">
          Thank you for your review!
        </p>
        <p className="mt-1 text-sm text-green-600 dark:text-green-500">
          Your feedback helps others make better rental decisions.
        </p>
      </div>
    );
  }

  const activeStars = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Star picker */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Your Rating <span className="text-destructive">*</span>
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
              className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  activeStars >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="review-name">
            Your Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="review-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Priya Sharma"
            required
            maxLength={60}
            className="text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-title">Review Title</Label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Absolutely stunning!"
            maxLength={100}
            className="text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-comment">
          Your Review <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience — the quality, fit, delivery, and overall satisfaction..."
          className="min-h-27.5 text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm"
          required
          maxLength={1000}
        />
        <p className="text-right text-xs text-muted-foreground">
          {comment.length}/1000
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-image" className="text-sm font-semibold">Upload Review Image (Optional)</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Label
            htmlFor="review-image"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <ImagePlus className="h-4 w-4" />
            Upload image
          </Label>
          <Input
            id="review-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
          />
          {imageFile ? (
            <span className="text-xs text-muted-foreground">{imageFile.name}</span>
          ) : (
            <span className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 5MB</span>
          )}
        </div>

        {imagePreview ? (
          <div className="relative h-36 w-28 overflow-hidden rounded-md border border-border/60 bg-muted/20">
            <Image src={imagePreview} alt="Review upload preview" fill className="object-contain p-1" unoptimized />
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button
        type="submit"
        disabled={!rating || !name.trim() || !comment.trim() || submitting}
        className="w-full sm:w-auto"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
