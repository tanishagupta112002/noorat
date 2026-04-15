/**
 * POST /api/custom-requests/refine
 * Handles refinement iterations with user feedback
 * Max 3 refinements per request
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildCustomAIPayload,
  buildRefinementPrompt,
  buildSourceImageInstructions,
  generateImageViaFallback,
  routeToAITool,
} from "@/lib/ai-agentic-utils";
import type { RefinePreviewResponse } from "@/types/custom-request";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
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

async function generateImageViaCustomAI(
  prompt: string,
  inputType: string,
  sourceImageUrl?: string | null,
): Promise<{ url: string; source: "huggingface" }> {
  const endpoint = process.env.CUSTOM_AI_ENDPOINT?.trim();
  if (!endpoint) throw new Error("custom_ai_endpoint_missing");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildCustomAIPayload({
        mode: inputType as any,
        prompt,
        sourceImageUrl: sourceImageUrl || undefined,
      }),
    ),
  });

  if (!response.ok) throw new Error(`custom_ai_http_${response.status}`);

  const payload = (await response.json()) as {
    imageUrl?: string;
    previewImageUrl?: string;
    data?: { imageUrl?: string; previewImageUrl?: string };
  };
  const url = payload.imageUrl || payload.previewImageUrl || payload.data?.imageUrl || payload.data?.previewImageUrl;
  if (!url) throw new Error("custom_ai_no_image");

  return { url, source: "huggingface" };
}

async function generateImageViaGateway(
  prompt: string
): Promise<{ url: string; source: "ai-gateway" }> {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!gatewayKey) throw new Error("gateway_key_missing");

  const model = process.env.AI_IMAGE_MODEL?.trim() || "openai/gpt-image-1";

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
      prompt,
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

async function generateImageViaHF(
  prompt: string,
  inputType: string,
): Promise<{ url: string; source: "huggingface" }> {
  const hfToken = process.env.HUGGINGFACE_API_KEY?.trim();
  if (!hfToken) throw new Error("hf_key_missing");

  const routedModel = routeToAITool(inputType as any, "huggingface").model;
  const envModels =
    process.env.HF_IMAGE_MODELS?.split(",")
      .map((m) => m.trim())
      .filter(Boolean) || [];

  const models = Array.from(
    new Set([
      ...envModels,
      routedModel,
      "black-forest-labs/FLUX.1-schnell",
      "stabilityai/stable-diffusion-xl-base-1.0",
    ]),
  );

  const width = Number(process.env.HF_IMAGE_WIDTH || 832);
  const height = Number(process.env.HF_IMAGE_HEIGHT || 1216);
  const payload = {
    inputs: prompt,
    parameters: {
      negative_prompt:
        "human face, visible face, face, head, eyes, nose, mouth, lips, ears, hairline, selfie, portrait, close-up portrait, upper-face, blurry, soft focus, low detail, low quality, jpeg artifacts, watermark, deformed body, extra limbs",
      guidance_scale: 8,
      num_inference_steps: 40,
      width,
      height,
    },
    options: {
      wait_for_model: true,
      use_cache: false,
    },
  };

  for (const model of models) {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) continue;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) continue;

    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength) continue;

    const base64 = Buffer.from(buffer).toString("base64");
    const mime = contentType.split(";")[0] || "image/jpeg";
    return {
      url: `data:${mime};base64,${base64}`,
      source: "huggingface",
    };
  }

  throw new Error("hf_router_inference_failed");
}

async function generateRefinedImage(
  prompt: string,
  inputType: string,
  sourceImageUrl?: string | null,
): Promise<{ url: string; source: "ai-gateway" | "huggingface" | "pollinations-fallback" }> {
  try {
    return await generateImageViaCustomAI(prompt, inputType, sourceImageUrl);
  } catch (error) {
    console.warn(`[refine] Custom AI skipped: ${getErrorMessage(error)}`);
  }

  try {
    return await generateImageViaGateway(prompt);
  } catch (error) {
    console.warn(`[refine] Gateway skipped: ${getErrorMessage(error)}`);
  }

  try {
    return await generateImageViaHF(prompt, inputType);
  } catch (error) {
    console.warn(`[refine] HF skipped: ${getErrorMessage(error)}`);
  }

  const fallback = await generateImageViaFallback(prompt);
  return { ...fallback, source: "pollinations-fallback" };
}

export async function POST(req: Request): Promise<Response> {
  try {
    const db = prisma as any;
    const body = await req.json();

    const {
      requestId,
      feedback,
      feedbackType,
      satisfactionScore,
    }: {
      requestId: string;
      feedback: string;
      feedbackType?: string;
      satisfactionScore?: number;
    } = body;

    if (!requestId || !feedback) {
      return Response.json(
        {
          success: false,
          error: "requestId and feedback are required",
        },
        { status: 400 }
      );
    }

    // Verify user owns this request
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      userId = session?.user?.id ?? null;
    } catch {
      // Allow anonymous access
    }

    // Fetch existing request
    const customRequest = await db.customRequest.findUnique({
      where: { id: requestId },
      include: { refinements: true },
    });

    if (!customRequest) {
      return Response.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Permission check
    if (userId && customRequest.userId !== userId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check refinement limit
    if (customRequest.refinementCount >= customRequest.maxRefinements) {
      return Response.json(
        {
          success: false,
          error: `Maximum refinements (${customRequest.maxRefinements}) reached`,
        },
        { status: 400 }
      );
    }

    // Build refinement prompt
    const { newPrompt, action } = buildRefinementPrompt(
      customRequest.originalPrompt,
      feedback,
      feedbackType
    );

    const sourceImageInstructions = buildSourceImageInstructions(
      customRequest.inputType || "text",
      customRequest.uploadedImageUrl,
    );
    const refinementPrompt = sourceImageInstructions
      ? `${newPrompt}\n${sourceImageInstructions}`
      : newPrompt;

    // Generate refined image
    const generated = await generateRefinedImage(
      refinementPrompt,
      customRequest.inputType || "text",
      customRequest.uploadedImageUrl,
    );
    const previewImageUrl = await ensureClientRenderableImage(generated.url);

    // Store refinement step
    const refinement = await db.customRequestRefinement.create({
      data: {
        requestId,
        step: customRequest.refinementCount + 1,
        action,
        promptUsed: refinementPrompt,
        resultImageUrl: previewImageUrl,
        userFeedback: feedback,
        feedbackType: feedbackType || null,
        userSatisfactionScore: satisfactionScore || null,
        confidenceScore: null, // Can be populated by AI analysis later
      },
    });

    // Update custom request
    const updatedRequest = await db.customRequest.update({
      where: { id: requestId },
      data: {
        refinementCount: { increment: 1 },
        currentPreviewUrl: previewImageUrl,
        previewSource: generated.source as any,
        status: "preview_ready",
      },
      include: { refinements: true },
    });

    const response: RefinePreviewResponse = {
      success: true,
      data: {
        requestId,
        step: refinement.step,
        newPreviewImageUrl: previewImageUrl,
        previewSource: generated.source,
        refinementHistory: updatedRequest.refinements.map((r) => ({
          id: r.id,
          step: r.step,
          action: r.action as any,
          promptUsed: r.promptUsed,
          resultImageUrl: r.resultImageUrl,
          userFeedback: r.userFeedback,
          feedbackType: r.feedbackType,
          userSatisfactionScore: r.userSatisfactionScore,
          confidenceScore: r.confidenceScore,
          createdAt: r.createdAt.toISOString(),
        })),
        canRefineAgain:
          updatedRequest.refinementCount < updatedRequest.maxRefinements,
        generatedAt: new Date().toISOString(),
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error("[custom-requests/refine] failed", error);
    return Response.json(
      {
        success: false,
        error: String(error instanceof Error ? error.message : error),
      },
      { status: 500 }
    );
  }
}
