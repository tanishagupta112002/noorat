/**
 * POST /api/custom-requests/generate
 * Main route for generating preview images
 * Handles all 4 cases with appropriate AI tools
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import {
  buildCustomAIPayload,
  buildSourceImageInstructions,
  enhancePromptForCase,
  detectOccasion,
  generateStyleSummary,
  getCustomRequestNextSteps,
  requiresSourceImage,
  routeToAITool,
  validateCustomRequestInput,
} from "@/lib/ai-agentic-utils";
import type {
  InputType,
  PreviewSource,
  GeneratePreviewResponse,
} from "@/types/custom-request";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

type ProviderStep = "lora" | "huggingface" | "pollinations";

function getProviderOrder(inputType: InputType): ProviderStep[] {
  if (inputType === "text") {
    return ["lora", "huggingface", "pollinations"];
  }

  return ["huggingface", "pollinations"];
}

function getHFModelsForInputType(inputType: InputType): string[] {
  const fromEnv = (key: string) =>
    (process.env[key] || "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

  const textDefaults = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
  ];

  const imageDefaults = [
    "stabilityai/stable-diffusion-xl-base-1.0",
    "black-forest-labs/FLUX.1-schnell",
  ];

  const sketchDefaults = [
    "stabilityai/stable-diffusion-xl-base-1.0",
    "lllyasviel/sd-controlnet-canny",
  ];

  const clothDefaults = [
    "stabilityai/stable-diffusion-xl-base-1.0",
    "black-forest-labs/FLUX.1-schnell",
  ];

  const modelMap: Record<InputType, string[]> = {
    text: [...fromEnv("HF_MODELS_TEXT"), ...textDefaults],
    image: [...fromEnv("HF_MODELS_IMAGE"), ...imageDefaults],
    sketch: [...fromEnv("HF_MODELS_SKETCH"), ...sketchDefaults],
    cloth: [...fromEnv("HF_MODELS_CLOTH"), ...clothDefaults],
  };

  return Array.from(new Set(modelMap[inputType]));
}

function getHFParamsForInputType(inputType: InputType) {
  const width = Number(process.env.HF_IMAGE_WIDTH || 832);
  const height = Number(process.env.HF_IMAGE_HEIGHT || 1216);

  const commonNegativePrompt =
    "human face, visible face, face, head, eyes, nose, mouth, lips, ears, hairline, selfie, portrait, close-up portrait, upper-face, blurry, soft focus, low detail, low quality, jpeg artifacts, watermark, deformed body, extra limbs";

  if (inputType === "sketch") {
    return {
      negative_prompt: `${commonNegativePrompt}, distorted sketch lines, bad anatomy`,
      guidance_scale: 9,
      num_inference_steps: 45,
      width,
      height,
    };
  }

  if (inputType === "image" || inputType === "cloth") {
    return {
      negative_prompt: `${commonNegativePrompt}, fabric artifacts, inconsistent texture`,
      guidance_scale: 8,
      num_inference_steps: 42,
      width,
      height,
    };
  }

  return {
    negative_prompt: commonNegativePrompt,
    guidance_scale: 8,
    num_inference_steps: 40,
    width,
    height,
  };
}

async function generateImageViaCustomAI(
  prompt: string,
  inputType: InputType,
  occasion: string,
  sourceImageUrl?: string | null,
): Promise<{ url: string; source: PreviewSource }> {
  const endpoint = process.env.CUSTOM_AI_ENDPOINT?.trim();
  if (!endpoint) throw new Error("custom_ai_endpoint_missing");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildCustomAIPayload({
        mode: inputType,
        prompt,
        occasion,
        sourceImageUrl: sourceImageUrl || undefined,
      }),
    ),
  });

  if (!response.ok) {
    throw new Error(`custom_ai_http_${response.status}`);
  }

  const payload = (await response.json()) as {
    imageUrl?: string;
    previewImageUrl?: string;
    data?: { imageUrl?: string; previewImageUrl?: string };
  };

  const url = payload.imageUrl || payload.previewImageUrl || payload.data?.imageUrl || payload.data?.previewImageUrl;
  if (!url) throw new Error("custom_ai_no_image");

  return { url, source: "huggingface" };
}

async function uploadSourceImage(file: File): Promise<string | null> {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

  if (!token) return null;

  try {
    const ext: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = ext[file.type] || ".jpg";
    const safeName = `custom-request/source/${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`;

    const blob = await put(safeName, file, {
      access: "public",
      addRandomSuffix: true,
      token,
    });

    return blob.url;
  } catch (error) {
    console.error("[upload] source image failed", error);
    return null;
  }
}

async function generateImageViaGateway(
  prompt: string,
  sourceUrls?: string[]
): Promise<{ url: string; source: PreviewSource }> {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();

  if (!gatewayKey) throw new Error("gateway_key_missing");

  const model = process.env.AI_IMAGE_MODEL?.trim() || "openai/gpt-image-1";
  const referenceText =
    sourceUrls && sourceUrls.length > 0
      ? `Reference images: ${sourceUrls.join(", ")}`
      : "";

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
      prompt: `${prompt}\n${referenceText}`,
    }),
  });

  if (!response.ok) {
    let reason = `gateway_http_${response.status}`;
    try {
      const payload = (await response.json()) as {
        error?: { type?: string; message?: string };
      };
      if (payload?.error?.type) {
        reason = payload.error.type;
      }
    } catch {
      // keep default reason
    }
    throw new Error(reason);
  }

  const payload = (await response.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };

  const first = payload?.data?.[0];
  if (first?.url) {
    return { url: first.url, source: "ai-gateway" };
  }

  if (first?.b64_json) {
    return {
      url: `data:image/png;base64,${first.b64_json}`,
      source: "ai-gateway",
    };
  }

  throw new Error("gateway_no_image");
}

async function generateImageViaLoRA(
  prompt: string,
  inputType: InputType,
  sourceUrls?: string[]
): Promise<{ url: string; source: PreviewSource }> {
  const loraApiUrl = process.env.LORA_API_URL?.trim();
  
  if (!loraApiUrl) throw new Error("lora_api_url_missing");

  const featureMap: Record<InputType, string> = {
    text: "text-to-design",
    image: "image-to-modify",
    sketch: "sketch-to-real",
    cloth: "cloth-to-redesign",
  };

  const feature = featureMap[inputType];
  const loraHeight = Number(process.env.LORA_IMAGE_HEIGHT || 448);
  const loraWidth = Number(process.env.LORA_IMAGE_WIDTH || 448);
  const loraGuidance = Number(process.env.LORA_GUIDANCE_SCALE || 7.0);
  const loraSteps = Number(process.env.LORA_INFERENCE_STEPS || 24);
  const loraTimeoutMs = Number(process.env.LORA_FETCH_TIMEOUT_MS || 420000);

  try {
    const response = await fetchWithTimeout(`${loraApiUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        feature,
        num_images: 1,
        height: loraHeight,
        width: loraWidth,
        guidance_scale: loraGuidance,
        num_inference_steps: loraSteps,
      }),
    }, loraTimeoutMs);

    if (!response.ok) {
      throw new Error(`lora_http_${response.status}`);
    }

    const payload = (await response.json()) as {
      images?: string[];
    };

    if (!payload.images || payload.images.length === 0) {
      throw new Error("lora_no_image");
    }

    const base64Image = payload.images[0];
    return {
      url: `data:image/png;base64,${base64Image}`,
      source: "lora-adapter",
    };
  } catch (error) {
    const reason = getErrorMessage(error);
    throw new Error(`lora_generation_failed:${reason}`);
  }
}

async function generateImageViaHF(
  prompt: string,
  inputType: InputType,
  sourceUrls?: string[]
): Promise<{ url: string; source: PreviewSource }> {
  const hfToken = process.env.HUGGINGFACE_API_KEY?.trim();

  if (!hfToken) throw new Error("hf_key_missing");

  const models = getHFModelsForInputType(inputType);

  const endpoints = ["https://router.huggingface.co/hf-inference/models"];
  const modeParams = getHFParamsForInputType(inputType);
  const hfTimeoutMs = Number(process.env.HF_FETCH_TIMEOUT_MS || 18000);
  const sourceHint =
    sourceUrls && sourceUrls.length > 0
      ? `\nReference image URL(s): ${sourceUrls.join(", ")}. Keep silhouette and visual cues aligned with the references.`
      : "";

  const hfPayload = {
    inputs: `${prompt}${sourceHint}`,
    ...modeParams,
  };
  const hfFailures: string[] = [];

  for (const endpoint of endpoints) {
    for (const model of models) {
      try {
        const response = await fetchWithTimeout(`${endpoint}/${model}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(hfPayload),
        }, hfTimeoutMs);

        if (!response.ok) {
          const errorText = await response.text();
          const compactError = errorText.replace(/\s+/g, " ").trim().slice(0, 180);
          hfFailures.push(`${model}:${response.status}${compactError ? `:${compactError}` : ""}`);
          console.error(`[HF] ${model} failed: ${response.status} - ${errorText}`);
          continue;
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) {
          console.warn(`[HF] ${model} returned non-image: ${contentType}`);
          continue;
        }

        const buffer = await response.arrayBuffer();
        if (!buffer.byteLength) {
          console.warn(`[HF] ${model} returned empty image`);
          continue;
        }

        const base64 = Buffer.from(buffer).toString("base64");
        const mime = contentType.split(";")[0] || "image/jpeg";
        return {
          url: `data:${mime};base64,${base64}`,
          source: "huggingface",
        };
      } catch (modelError) {
        hfFailures.push(`${model}:fetch_error:${getErrorMessage(modelError)}`);
        console.error(`[HF] ${model} error: ${getErrorMessage(modelError)}`);
      }
    }
  }

  throw new Error(
    hfFailures.length > 0
      ? `hf_router_inference_failed:${hfFailures.join(" | ")}`
      : "hf_router_inference_failed"
  );
}

async function generateImageViaFallback(
  prompt: string
): Promise<{ url: string; source: PreviewSource }> {
  const fallbackPrompt = encodeURIComponent(prompt);
  return {
    url: `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=1024&height=1024&nologo=true`,
    source: "pollinations-fallback",
  };
}

async function ensureClientRenderableImage(url: string): Promise<string> {
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
    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > 5 * 1024 * 1024) {
      return url;
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return url;
  }
}

async function generatePreviewImage(
  prompt: string,
  inputType: InputType,
  occasion: string,
  sourceUrls?: string[]
): Promise<{ url: string; source: PreviewSource }> {
  const order = getProviderOrder(inputType);
  const failures: string[] = [];

  for (const provider of order) {
    try {
      if (provider === "lora") {
        return await generateImageViaLoRA(prompt, inputType, sourceUrls);
      }

      if (provider === "huggingface") {
        return await generateImageViaHF(prompt, inputType, sourceUrls);
      }

      return await generateImageViaFallback(prompt);
    } catch (err) {
      const reason = getErrorMessage(err);
      failures.push(`${provider}:${reason}`);
      console.warn(`[generate] ${provider} skipped for ${inputType}: ${reason}`);
    }
  }

  if (failures.length > 0) {
    console.warn(`[generate] all providers failed for ${inputType}; using safety fallback. reasons=${failures.join(" | ")}`);
  }

  // Last-resort safety fallback
  return await generateImageViaFallback(prompt);
}

export async function POST(req: Request): Promise<Response> {
  try {
    const db = prisma as any;
    const formData = await req.formData();

    const prompt = String(formData.get("prompt") || "").trim();
    const inputTypeStr = String(formData.get("inputType") || "text").trim();
    const occasionInput = String(formData.get("occasion") || "").trim();
    const budgetInput = String(formData.get("budget") || "").trim();
    const sourceImageFile = formData.get("sourceImage") as File | null;

    // Validate
    const validation = validateCustomRequestInput({
      prompt,
      fileSize: sourceImageFile?.size,
    });
    if (!validation.valid) {
      return Response.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const inputType = (inputTypeStr || "text") as InputType;
    const budget = budgetInput ? Number(budgetInput) : null;
    const parsedBudget =
      budget && Number.isFinite(budget) && budget > 0 ? budget : null;

    if (sourceImageFile && sourceImageFile.size > 0) {
      if (!ALLOWED_MIME_TYPES.includes(sourceImageFile.type)) {
        return Response.json(
          { success: false, error: "Only JPG, PNG, and WEBP source images are supported" },
          { status: 400 },
        );
      }

      if (sourceImageFile.size > MAX_SIZE_BYTES) {
        return Response.json(
          { success: false, error: "Source image must be under 5MB" },
          { status: 400 },
        );
      }
    }

    if (requiresSourceImage(inputType) && (!sourceImageFile || sourceImageFile.size === 0)) {
      return Response.json(
        {
          success: false,
          error: `A source image is required for the ${inputType} flow`,
        },
        { status: 400 },
      );
    }

    // Get user session if available
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      userId = session?.user?.id ?? null;
    } catch {
      userId = null;
    }

    // Upload source image if provided
    let sourceImageUrl: string | null = null;
    if (sourceImageFile && sourceImageFile.size > 0) {
      sourceImageUrl = await uploadSourceImage(sourceImageFile);
    }

    // Detect occasion
    const occasion = occasionInput || detectOccasion(prompt);
    const sourceImageInstructions = buildSourceImageInstructions(inputType, sourceImageUrl);

    // Enhance prompt based on case type
    const enhancedPrompt = enhancePromptForCase(
      prompt,
      inputType,
      occasion,
      sourceImageInstructions || undefined,
    );

    // Generate preview image
    const generated = await generatePreviewImage(
      enhancedPrompt,
      inputType,
      occasion,
      sourceImageUrl ? [sourceImageUrl] : undefined
    );
    const previewImageUrl = await ensureClientRenderableImage(generated.url);

    // Create custom request in database. If persistence fails, still return generated preview.
    let requestId = crypto.randomUUID();
    try {
      const customRequest = await db.customRequest.create({
        data: {
          userId,
          inputType,
          originalPrompt: prompt,
          uploadedImageUrl: sourceImageUrl,
          previewSource: generated.source,
          generationModel: routeToAITool(inputType).model,
          occasion,
          occasionDetected: occasion,
          budget: parsedBudget,
          currentPreviewUrl: previewImageUrl,
          status: "preview_ready",
        },
      });
      requestId = customRequest.id;
    } catch (dbError) {
      console.error("[custom-requests/generate] db save failed, returning preview without persistence", dbError);
    }

    // Generate summary
    const summary = generateStyleSummary(prompt, occasion, inputType);

    const response: GeneratePreviewResponse = {
      success: true,
      data: {
        requestId,
        previewImageUrl,
        previewSource: generated.source,
        summary,
        occasion,
        budget: parsedBudget,
        refinementId: requestId,
        nextSteps: getCustomRequestNextSteps(inputType),
        sourceImageUrls: sourceImageUrl ? [sourceImageUrl] : [],
        generatedAt: new Date().toISOString(),
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error("[custom-requests/generate] failed", error);
    return Response.json(
      {
        success: false,
        error: String(error instanceof Error ? error.message : error),
      },
      { status: 500 }
    );
  }
}
