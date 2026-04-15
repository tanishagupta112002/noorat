"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, UploadCloud, Sparkles, BadgeIndianRupee, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Recommendation = {
  id: string;
  title: string;
  category: string;
  price: number;
  color: string;
  image: string;
  providerName: string;
  city: string;
  href: string;
};

type PreviewResponse = {
  success: boolean;
  error?: string;
  data?: {
    prompt: string;
    occasion: string;
    budget: number | null;
    previewImageUrl: string;
    previewSource: "ai-gateway" | "pollinations-fallback";
    sourceImageUrls: string[];
    summary: string;
    recommendations: Recommendation[];
    generatedAt: string;
  };
};

const OCCASION_OPTIONS = [
  "Wedding",
  "Engagement",
  "Haldi",
  "Mehndi",
  "Sangeet",
  "Cocktail",
  "Reception",
  "Festive",
] as const;

export function AIDesignStudio() {
  const [prompt, setPrompt] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [sourceImages, setSourceImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResponse["data"] | null>(null);

  const previews = useMemo(
    () => sourceImages.map((file) => ({ key: `${file.name}-${file.lastModified}`, url: URL.createObjectURL(file), name: file.name })),
    [sourceImages],
  );

  const canSubmit = prompt.trim().length >= 12 && !isLoading;

  const onAddImages = (files: File[]) => {
    const all = [...sourceImages, ...files];
    const unique = new Map<string, File>();

    for (const file of all) {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!unique.has(key)) {
        unique.set(key, file);
      }
    }

    setSourceImages(Array.from(unique.values()).slice(0, 4));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const body = new FormData();
    body.append("prompt", prompt.trim());
    if (occasion.trim()) body.append("occasion", occasion.trim());
    if (budget.trim()) body.append("budget", budget.trim());
    sourceImages.forEach((file) => body.append("sourceImages", file));

    try {
      const response = await fetch("/api/custom-requests/preview", {
        method: "POST",
        body,
      });

      const payload = (await response.json()) as PreviewResponse;

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.error || "Preview generate nahi hua. Please retry.");
        return;
      }

      setResult(payload.data);
    } catch {
      setError("Network issue aa gaya. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const rentalsSavingHint =
    result?.budget && result.recommendations.length > 0
      ? result.recommendations.filter((item) => item.price <= result.budget! * 0.5).length
      : 0;

  return (
    <section id="ai-design-studio" className="py-10 sm:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl border-orange-200/60 bg-white shadow-sm">
          <CardHeader>
            <Badge variant="outline" className="w-fit rounded-full bg-orange-50 px-3 py-1 text-orange-700">
              AI Design Upload + Preview
            </Badge>
            <CardTitle className="mt-3 text-2xl sm:text-3xl">Upload photo ya prompt se outfit preview generate karo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pinterest reference, old dress photo, ya imagination text dalke AI se concept preview nikalo. Fir custom stitch ya affordable rentals compare karo.
            </p>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="design-prompt">Design prompt</Label>
                <Textarea
                  id="design-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: Peach and gold lehenga for engagement, lightweight flare, elegant dupatta, minimal embroidery..."
                  className="min-h-30"
                />
                <p className="text-xs text-muted-foreground">Minimum 12 characters. Jitna clear brief, utna strong preview.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion (optional)</Label>
                  <Input
                    id="occasion"
                    list="occasion-options"
                    value={occasion}
                    onChange={(event) => setOccasion(event.target.value)}
                    placeholder="Wedding / Reception / Cocktail"
                  />
                  <datalist id="occasion-options">
                    {OCCASION_OPTIONS.map((entry) => (
                      <option key={entry} value={entry} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (optional)</Label>
                  <Input
                    id="budget"
                    inputMode="numeric"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 9000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source-images">Upload references (max 4)</Label>
                <Input
                  id="source-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => onAddImages(Array.from(event.target.files || []))}
                />
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP. Each file under 5MB.</p>
              </div>

              {previews.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {previews.map((preview) => (
                    <div key={preview.key} className="overflow-hidden rounded-xl border border-border/70">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview.url} alt={preview.name} className="h-24 w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              ) : null}

              <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                {isLoading ? "Generating preview..." : "Generate AI Preview"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-linear-to-b from-orange-50/70 to-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Output
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result ? (
              <>
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.previewImageUrl} alt="AI generated outfit preview" className="h-80 w-full object-cover" />
                </div>

                <div className="rounded-2xl border border-border/70 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Style brief</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6">{result.summary}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Occasion: {result.occasion}</Badge>
                  {result.budget ? <Badge variant="secondary">Budget: Rs {result.budget}</Badge> : null}
                  <Badge variant="secondary">
                    Source: {result.previewSource === "ai-gateway" ? "AI Gateway" : "Pollinations Fallback"}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-white/80 p-6 text-sm text-muted-foreground">
                <UploadCloud className="mb-2 h-5 w-5 text-primary" />
                Prompt aur reference images submit karte hi yahan AI preview aur recommendations show hongi.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {result?.recommendations?.length ? (
        <Card className="mt-8 rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl">Similar rentals at lower cost</CardTitle>
            {rentalsSavingHint > 0 ? (
              <Badge className="w-fit bg-emerald-600 text-white hover:bg-emerald-600">
                <BadgeIndianRupee className="mr-1 h-3.5 w-3.5" />
                {rentalsSavingHint} options are at or below 50% of your budget
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {result.recommendations.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-border/70 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title} className="h-40 w-full object-cover" />
                  <div className="space-y-2 p-3">
                    <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.providerName} · {item.city}
                    </p>
                    <p className="text-sm font-semibold">Rs {Math.round(item.price).toLocaleString("en-IN")}</p>
                    <Button asChild size="sm" className="w-full">
                      <Link href={item.href}>View rental</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
