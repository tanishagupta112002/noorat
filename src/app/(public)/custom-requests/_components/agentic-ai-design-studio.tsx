"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Check,
  Loader2,
  Sparkles,
  WandSparkles,
  ArrowRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { InputType } from "@/types/custom-request";

type ProviderQuote = {
  id: string;
  providerId: string;
  providerName: string;
  quotedPrice: number;
  timeline: string;
  providerRating: number | null;
};

type PreviewPayload = {
  requestId: string;
  previewImageUrl: string;
  previewSource: "ai-gateway" | "huggingface" | "pollinations-fallback";
  summary: string;
  occasion: string;
  budget: number | null;
};

type FunctionMode = InputType;

const FUNCTION_CONFIG: Array<{
  mode: FunctionMode;
  title: string;
  description: string;
  apiPath: string;
  requiresImage: boolean;
  imageLabel: string;
}> = [
  {
    mode: "text",
    title: "1. Text to Design",
    description: "Sirf text prompt se naya outfit design generate karega.",
    apiPath: "/api/custom-requests/text-to-design",
    requiresImage: false,
    imageLabel: "Reference images (optional)",
  },
  {
    mode: "image",
    title: "2. Image to Modify",
    description: "Upload image + prompt se same dress style ko modify karega.",
    apiPath: "/api/custom-requests/image-to-modify",
    requiresImage: true,
    imageLabel: "Source dress image (required)",
  },
  {
    mode: "sketch",
    title: "3. Sketch to Real",
    description: "Hand sketch ko realistic fashion output me convert karega.",
    apiPath: "/api/custom-requests/sketch-to-real",
    requiresImage: true,
    imageLabel: "Sketch image (required)",
  },
  {
    mode: "cloth",
    title: "4. Cloth to Redesign",
    description: "Old cloth photo se fresh redesigned outfit generate karega.",
    apiPath: "/api/custom-requests/cloth-to-redesign",
    requiresImage: true,
    imageLabel: "Cloth/fabric image (required)",
  },
];

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

export function AgenticAIDesignStudio() {
  const [selectedMode, setSelectedMode] = useState<FunctionMode>("text");
  const [prompt, setPrompt] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [sourceImages, setSourceImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [refineText, setRefineText] = useState("");
  const [refinementCount, setRefinementCount] = useState(0);
  const [providerQuotes, setProviderQuotes] = useState<ProviderQuote[]>([]);

  const selectedConfig =
    FUNCTION_CONFIG.find((entry) => entry.mode === selectedMode) || FUNCTION_CONFIG[0];

  const onGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (selectedConfig.requiresImage && !sourceImages[0]) {
        throw new Error("Is function ke liye source image required hai.");
      }

      const generateBody = new FormData();
      generateBody.append("prompt", prompt.trim());
      if (occasion.trim()) generateBody.append("occasion", occasion.trim());
      if (budget.trim()) generateBody.append("budget", budget.trim());
      if (sourceImages[0]) generateBody.append("sourceImage", sourceImages[0]);

      const generateRes = await fetch(selectedConfig.apiPath, {
        method: "POST",
        body: generateBody,
      });
      const generatePayload = (await generateRes.json()) as {
        success: boolean;
        error?: string;
        data?: PreviewPayload;
      };

      if (!generatePayload.success || !generatePayload.data) {
        throw new Error(generatePayload.error || "Generate failed");
      }

      setPreview(generatePayload.data);
      setProviderQuotes([]);
      setRefinementCount(0);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefine = async () => {
    if (!preview || !refineText.trim() || refinementCount >= 3) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/custom-requests/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: preview.requestId,
          feedback: refineText.trim(),
        }),
      });

      const payload = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: { newPreviewImageUrl: string; previewSource: PreviewPayload["previewSource"] };
      };

      if (!payload.success || !payload.data) {
        throw new Error(payload.error || "Refine failed");
      }

      setPreview((prev) =>
        prev
          ? {
              ...prev,
              previewImageUrl: payload.data!.newPreviewImageUrl,
              previewSource: payload.data!.previewSource,
            }
          : prev,
      );
      setRefinementCount((count) => count + 1);
      setRefineText("");
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onBroadcast = async (providerType: "custom_stitch" | "rental") => {
    if (!preview) return;
    setIsLoading(true);
    setError(null);

    try {
      const broadcastRes = await fetch("/api/custom-requests/provider-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: preview.requestId,
          finalDesignUrl: preview.previewImageUrl,
          occasion: preview.occasion,
          budget: preview.budget || undefined,
          providerType,
        }),
      });
      const broadcastPayload = await broadcastRes.json();
      if (!broadcastPayload.success) {
        throw new Error(broadcastPayload.error || "Provider broadcast failed");
      }

      const bidsRes = await fetch(`/api/custom-requests/provider-bids/${preview.requestId}`);
      const bidsPayload = (await bidsRes.json()) as {
        success: boolean;
        error?: string;
        data?: { bids: ProviderQuote[] };
      };

      if (!bidsPayload.success || !bidsPayload.data) {
        throw new Error(bidsPayload.error || "Could not load provider bids");
      }

      setProviderQuotes(bidsPayload.data.bids);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectProvider = async (bidId: string, providerId: string) => {
    if (!preview) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/custom-requests/assign-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: preview.requestId, bidId, providerId }),
      });
      const payload = await res.json();
      if (!payload.success) {
        throw new Error(payload.error || "Provider selection failed");
      }
      setError(`Provider assigned. Order ID: ${payload.data.orderId}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const imagePreviews = useMemo(
    () =>
      sourceImages.map((file) => ({
        key: `${file.name}-${file.lastModified}`,
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    [sourceImages]
  );

  const canGenerate =
    prompt.trim().length >= 12 && (!selectedConfig.requiresImage || Boolean(sourceImages[0]));

  return (
    <section id="agentic-ai-studio" className="py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-3xl border-border/70 bg-white shadow-sm">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit rounded-full bg-orange-50 px-3 py-1 text-orange-700">
              AI Try-On Assistant
            </Badge>
            <CardTitle className="text-2xl sm:text-3xl">Describe your look like a chat message</CardTitle>
            <p className="text-sm text-muted-foreground">
              Mode choose karo, short brief likho, aur assistant se instant preview pao.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {FUNCTION_CONFIG.map((entry) => {
                const active = selectedMode === entry.mode;
                return (
                  <button
                    key={entry.mode}
                    type="button"
                    onClick={() => {
                      setSelectedMode(entry.mode);
                      setError(null);
                      setSourceImages([]);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-border bg-white text-foreground/80 hover:border-orange-200"
                    }`}
                  >
                    {active ? <Check className="h-3.5 w-3.5" /> : null}
                    {entry.title.replace(/^\d+\.\s*/, "")}
                  </button>
                );
              })}
            </div>

            <form className="space-y-4" onSubmit={onGenerate}>
              <div className="rounded-2xl border border-border/70 bg-slate-50/70 p-3">
                <Label htmlFor="design-prompt" className="text-xs text-muted-foreground">Your message</Label>
                <Textarea
                  id="design-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., Deep maroon lehenga for reception, lightweight flare, soft shimmer, elegant dupatta"
                  className="mt-2 min-h-28 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Minimum 12 characters.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border/70 bg-white p-3">
                  <Label htmlFor="occasion" className="text-xs text-muted-foreground">Occasion</Label>
                  <Input
                    id="occasion"
                    list="occasion-options"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="Wedding / Reception / Cocktail"
                    className="h-9"
                  />
                  <datalist id="occasion-options">
                    {OCCASION_OPTIONS.map((entry) => (
                      <option key={entry} value={entry} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2 rounded-xl border border-border/70 bg-white p-3">
                  <Label htmlFor="budget" className="text-xs text-muted-foreground">Budget (INR)</Label>
                  <Input
                    id="budget"
                    inputMode="numeric"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 15000"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-border bg-white p-3">
                <Label htmlFor="source-images" className="text-xs text-muted-foreground">
                  {selectedConfig.imageLabel}
                </Label>
                <Input
                  id="source-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple={false}
                  className="mt-2"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSourceImages(files.slice(0, 1));
                  }}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {selectedConfig.requiresImage
                    ? "Is mode me image mandatory hai."
                    : "Text mode me image optional hai."}
                </p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {imagePreviews.map((preview) => (
                    <div key={preview.key} className="overflow-hidden rounded-xl border border-border/70 bg-white">
                      <img src={preview.url} alt={preview.name} className="h-20 w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={!canGenerate || isLoading} className="w-full rounded-xl">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                {isLoading ? "Generating preview..." : "Send to AI Assistant"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bot className="h-5 w-5 text-primary" />
              Assistant Reply
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview ? (
              <>
                <div className="rounded-2xl border border-border/70 bg-slate-50 p-3 text-sm text-foreground/85">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI summary
                  </p>
                  <p className="mt-2 whitespace-pre-line leading-6">{preview.summary}</p>
                </div>

                <div className="mx-auto aspect-3/4 w-full max-w-sm overflow-hidden rounded-2xl border border-border/70 bg-slate-100">
                  <img
                    src={preview.previewImageUrl}
                    alt="AI preview"
                    className="h-full w-full object-cover object-bottom"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Mode: {selectedConfig.title.replace(/^\d+\.\s*/, "")}</Badge>
                  <Badge variant="secondary">Source: {preview.previewSource}</Badge>
                </div>

                {refinementCount < 3 ? (
                  <div className="space-y-2 rounded-xl border border-border/70 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Refinement loop ({refinementCount}/3)
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Refine this look..."
                        className="h-10"
                        value={refineText}
                        onChange={(e) => setRefineText(e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={onRefine} disabled={!refineText.trim() || isLoading}>
                        Refine
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Button
                    onClick={() => onBroadcast("custom_stitch")}
                    disabled={isLoading}
                    className="w-full justify-between"
                  >
                    Get Stitched <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onBroadcast("rental")}
                    disabled={isLoading}
                    className="w-full justify-between"
                  >
                    Rent Similar <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-sm text-muted-foreground">
                Apna design brief bhejo. Assistant yahin preview, summary aur next actions return karega.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {providerQuotes.length > 0 ? (
        <Card className="mt-6 rounded-3xl border-border/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Provider Replies ({providerQuotes.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providerQuotes.map((quote) => (
              <div key={quote.id} className="space-y-2 rounded-2xl border border-border/70 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{quote.providerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {quote.timeline} • Rating {quote.providerRating || "N/A"}
                    </p>
                  </div>
                  <p className="text-lg font-bold">₹{quote.quotedPrice}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onSelectProvider(quote.id, quote.providerId)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Select Provider
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
