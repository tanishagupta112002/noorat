/**
 * POST /api/custom-requests/classify
 * Classifies input (text/image/sketch/cloth) and returns the use case
 */

import { classifyInput } from "@/lib/ai-agentic-utils";
import type { ClassificationResult } from "@/types/custom-request";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const prompt = String(formData.get("prompt") || "").trim();
    const imageUrl = String(formData.get("imageUrl") || "").trim() || undefined;
    const imageFile = formData.get("imageFile") as File | null;

    // Extract image metadata if provided
    const imageMimeType = imageFile?.type;
    const imageSize = imageFile?.size;

    const result: ClassificationResult = await classifyInput({
      prompt: prompt || undefined,
      imageUrl: imageUrl || (imageFile ? "file://" : undefined),
      imageMimeType,
      imageSize,
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[custom-requests/classify] error", error);
    return Response.json(
      {
        success: false,
        error: "Classification failed. Defaulting to text case.",
        data: {
          inputType: "text",
          confidence: 0.5,
          suggestedCase: 1,
          reasoning: "Error during classification, defaulted to text",
        } as ClassificationResult,
      },
      { status: 200 } // Return 200 with fallback data
    );
  }
}
