import { put } from "@vercel/blob";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 4;

type ListingCandidate = {
  id: string;
  title: string;
  category: string;
  price: number;
  color: string;
  description: string | null;
  images: string[];
  provider: {
    businessName: string | null;
    city: string | null;
  };
};

function getBlobToken(): string | null {
  const token =
    (typeof process.env.BLOB_READ_WRITE_TOKEN === "string" &&
      process.env.BLOB_READ_WRITE_TOKEN.trim()) ||
    (typeof process.env.VERCEL_BLOB_READ_WRITE_TOKEN === "string" &&
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN.trim()) ||
    "";

  return token || null;
}

function normalizeText(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function extractKeywords(...parts: Array<string | null | undefined>) {
  const stopWords = new Set([
    "the",
    "and",
    "with",
    "that",
    "this",
    "from",
    "for",
    "into",
    "look",
    "outfit",
    "design",
    "want",
    "need",
    "have",
    "wear",
    "make",
    "please",
    "like",
    "my",
    "our",
  ]);

  const all = normalizeText(parts.filter(Boolean).join(" "));
  const words = all
    .split(" ")
    .filter((word) => word.length > 2)
    .filter((word) => !stopWords.has(word));

  return Array.from(new Set(words)).slice(0, 18);
}

function occasionFromPrompt(prompt: string, explicitOccasion?: string | null) {
  if (explicitOccasion && explicitOccasion.trim()) {
    return explicitOccasion.trim();
  }

  const text = normalizeText(prompt);

  if (text.includes("wedding") || text.includes("bridal") || text.includes("lehenga")) return "Wedding";
  if (text.includes("reception")) return "Reception";
  if (text.includes("engagement")) return "Engagement";
  if (text.includes("haldi")) return "Haldi";
  if (text.includes("mehndi")) return "Mehndi";
  if (text.includes("sangeet")) return "Sangeet";
  if (text.includes("cocktail")) return "Cocktail";

  return "Special Occasion";
}

function createStyleSummary(prompt: string, occasion: string, keywords: string[]) {
  const topKeywords = keywords.slice(0, 6).join(", ") || "custom styling";
  return `Design direction: ${prompt.trim()}\nOccasion fit: ${occasion}\nKey style cues: ${topKeywords}`;
}

async function uploadSourceImages(files: File[]) {
  const token = getBlobToken();
  if (!token || files.length === 0) return [] as string[];

  const uploaded = await Promise.all(
    files.map(async (file, index) => {
      try {
        const extByMime: Record<string, string> = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
        };

        const extension = extByMime[file.type] || ".jpg";
        const safeName = `custom-request/source/${Date.now()}-${index}${extension}`;

        const blob = await put(safeName, file, {
          access: "public",
          addRandomSuffix: true,
          token,
        });

        return blob.url;
      } catch {
        return null;
      }
    }),
  );

  return uploaded.filter((url): url is string => Boolean(url));
}

type PreviewSource = "ai-gateway" | "pollinations-fallback";

const NO_FACE_DIRECTIVE =
  "Strict framing rule: show outfit only in a neck-down fashion catalog composition; no human face, no head, no eyes, no nose, no mouth, no portrait, no selfie.";

async function generatePreviewImage(prompt: string, occasion: string, sourceUrls: string[]) {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();

  if (gatewayKey) {
    try {
      const model = process.env.AI_IMAGE_MODEL?.trim() || "openai/gpt-image-1";
      const referenceText =
        sourceUrls.length > 0
          ? `Use these image references for silhouette and detailing: ${sourceUrls.join(", ")}.`
          : "No reference images provided.";

      const response = await fetch("https://ai-gateway.vercel.sh/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gatewayKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          size: "1024x1024",
          n: 1,
          prompt: `Create a realistic fashion concept image for an Indian occasion outfit. Occasion: ${occasion}. User brief: ${prompt}. ${referenceText}. Clean studio background, full outfit visible, premium quality. ${NO_FACE_DIRECTIVE}`,
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          data?: Array<{ url?: string; b64_json?: string }>;
        };

        const first = payload?.data?.[0];
        if (first?.url) {
          return {
            url: first.url,
            source: "ai-gateway" as PreviewSource,
          };
        }

        if (first?.b64_json) {
          return {
            url: `data:image/png;base64,${first.b64_json}`,
            source: "ai-gateway" as PreviewSource,
          };
        }
      }
    } catch {
      // Fall through to the deterministic fallback URL.
    }
  }

  const fallbackPrompt = encodeURIComponent(
    `Indian fashion design preview, ${occasion}, ${prompt}. ${NO_FACE_DIRECTIVE}`,
  );
  return {
    url: `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=1024&height=1024&nologo=true`,
    source: "pollinations-fallback" as PreviewSource,
  };
}

async function ensureClientRenderableImage(url: string) {
  if (!url) return url;
  if (url.startsWith("data:image/")) return url;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      return url;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return url;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return url;
    }

    // Keep response payload practical for API transfer.
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      return url;
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return url;
  }
}

function scoreListing(listing: ListingCandidate, keywords: string[], budget?: number | null) {
  const normalizedBlob = normalizeText(
    [listing.title, listing.category, listing.color, listing.description || ""].join(" "),
  );

  let score = 0;

  for (const keyword of keywords) {
    if (normalizedBlob.includes(keyword)) {
      score += keyword.length > 5 ? 3 : 2;
    }
  }

  if (budget && Number.isFinite(budget)) {
    if (listing.price <= budget * 0.5) score += 4;
    else if (listing.price <= budget) score += 2;
    else score -= 2;
  }

  if (listing.images.length > 0) score += 1;

  return score;
}

async function getSimilarRentals(prompt: string, occasion: string, budget?: number | null) {
  const keywords = extractKeywords(prompt, occasion);

  const listings = await prisma.listing.findMany({
    where: { status: true },
    take: 80,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      price: true,
      color: true,
      description: true,
      images: true,
      provider: {
        select: {
          businessName: true,
          city: true,
        },
      },
    },
  });

  return listings
    .map((listing) => ({
      ...listing,
      score: scoreListing(listing, keywords, budget),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((listing) => ({
      id: listing.id,
      title: listing.title,
      category: listing.category,
      price: listing.price,
      color: listing.color,
      image: listing.images[0] || "/images/image.png",
      providerName: listing.provider.businessName?.trim() || "noorat Partner",
      city: listing.provider.city?.trim() || "India",
      href: `/rentals/item/${listing.id}`,
    }));
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = String(formData.get("prompt") || "").trim();
    const occasionInput = String(formData.get("occasion") || "").trim();
    const budgetInput = String(formData.get("budget") || "").trim();

    if (prompt.length < 12) {
      return Response.json(
        { success: false, error: "Please describe your design idea in at least 12 characters." },
        { status: 400 },
      );
    }

    const rawFiles = formData
      .getAll("sourceImages")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
      .slice(0, MAX_FILES);

    for (const file of rawFiles) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return Response.json(
          { success: false, error: "Only JPG, PNG, and WEBP files are supported." },
          { status: 400 },
        );
      }

      if (file.size > MAX_SIZE_BYTES) {
        return Response.json(
          { success: false, error: "Each uploaded image must be under 5MB." },
          { status: 400 },
        );
      }
    }

    const budget = budgetInput ? Number(budgetInput) : null;
    const parsedBudget = budget && Number.isFinite(budget) && budget > 0 ? budget : null;

    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      userId = session?.user?.id ?? null;
    } catch {
      userId = null;
    }

    const occasion = occasionFromPrompt(prompt, occasionInput);
    const uploadedSourceImages = await uploadSourceImages(rawFiles);
    const generatedPreview = await generatePreviewImage(prompt, occasion, uploadedSourceImages);
    const previewImageUrl = await ensureClientRenderableImage(generatedPreview.url);
    const recommendations = await getSimilarRentals(prompt, occasion, parsedBudget);

    const summary = createStyleSummary(prompt, occasion, extractKeywords(prompt, occasion));

    let requestId: string | null = null;
    try {
      const created = await prisma.customRequest.create({
        data: {
          userId,
          inputType: rawFiles.length > 0 ? "image" : "text",
          originalPrompt: prompt,
          uploadedImageUrl: uploadedSourceImages[0] || null,
          previewSource: generatedPreview.source,
          occasion,
          occasionDetected: occasion,
          budget: parsedBudget,
          currentPreviewUrl: previewImageUrl,
          status: "preview_ready",
        },
      });
      requestId = created.id;
    } catch (dbError) {
      console.error("[custom-requests/preview] db save failed", dbError);
    }

    return Response.json({
      success: true,
      data: {
        requestId,
        prompt,
        occasion,
        budget: parsedBudget,
        previewImageUrl,
        previewSource: generatedPreview.source,
        sourceImageUrls: uploadedSourceImages,
        summary,
        recommendations,
        userId,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[custom-requests/preview] failed", error);
    return Response.json(
      { success: false, error: "Unable to generate a preview right now. Please try again." },
      { status: 500 },
    );
  }
}
