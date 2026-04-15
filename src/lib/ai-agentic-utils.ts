/**
 * 🧠 Agentic AI Utilities
 * - Input Classification
 * - AI Tool Routing
 * - Prompt Engineering
 * - Refinement Logic
 */

import type { InputType, ClassificationResult } from "@/types/custom-request";

export interface CustomAIGeneratePayload {
  mode: InputType;
  prompt: string;
  occasion?: string;
  sourceImageUrl?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. INPUT CLASSIFIER
// ─────────────────────────────────────────────────────────────────────────────

export async function classifyInput(data: {
  prompt?: string;
  imageUrl?: string;
  imageMimeType?: string;
  imageSize?: number;
}): Promise<ClassificationResult> {
  let inputType: InputType = "text";
  let confidence = 1.0;
  let reasoning = "";

  // Check image metadata if present
  if (data.imageUrl) {
    confidence = 0.8; // Lower certainty with images (need analysis)

    // Sketch detection: low resolution, simple colors, high contrast
    if (data.imageSize && data.imageSize < 500000) {
      // Likely sketch if <500KB
      inputType = "sketch";
      reasoning = "Low file size suggests hand-drawn sketch";
      confidence = 0.85;
    }

    // Fabric/cloth detection: texture-heavy, multiple colors
    if (data.imageMimeType?.includes("image")) {
      // Check prompt context
      if (
        data.prompt?.toLowerCase().includes("saree") ||
        data.prompt?.toLowerCase().includes("cloth") ||
        data.prompt?.toLowerCase().includes("fabric") ||
        data.prompt?.toLowerCase().includes("convert") ||
        data.prompt?.toLowerCase().includes("redesign")
      ) {
        inputType = "cloth";
        reasoning = "Prompt + image suggests existing cloth redesign";
        confidence = 0.9;
      } else if (data.prompt) {
        // Image with modification prompt
        inputType = "image";
        reasoning = "Image + modification prompt suggests dress editing";
        confidence = 0.9;
      }
    }
  } else if (data.prompt) {
    // Text-only classification
    inputType = "text";
    reasoning = "Text prompt only - standard design generation";
    confidence = 1.0;
  }

  return {
    inputType,
    confidence,
    suggestedCase: caseNumberFromType(inputType),
    reasoning,
  };
}

function caseNumberFromType(type: InputType): number {
  const caseMap: Record<InputType, number> = {
    text: 1,
    image: 2,
    sketch: 3,
    cloth: 4,
  };
  return caseMap[type];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AI TOOL ROUTER - Maps case to optimal AI provider
// ─────────────────────────────────────────────────────────────────────────────

export interface AIToolConfig {
  provider: "huggingface" | "openai" | "pollinations" | "local";
  model: string;
  baseUrl: string;
  capabilities: string[];
  freeSupported: boolean;
  quality: "low" | "medium" | "high" | "very_high";
}

export function routeToAITool(
  inputType: InputType,
  preferredProvider?: string
): AIToolConfig {
  const toolMap: Record<InputType, AIToolConfig[]> = {
    text: [
      {
        provider: "huggingface",
        model: "black-forest-labs/FLUX.1-schnell",
        baseUrl: "https://router.huggingface.co/hf-inference/models",
        capabilities: ["text-to-image", "high-detail"],
        freeSupported: true,
        quality: "high",
      },
      {
        provider: "pollinations",
        model: "pollinations-turbo",
        baseUrl: "https://image.pollinations.ai/prompt",
        capabilities: ["text-to-image", "instant"],
        freeSupported: true,
        quality: "medium",
      },
    ],
    image: [
      {
        provider: "huggingface",
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        baseUrl: "https://router.huggingface.co/hf-inference/models",
        capabilities: ["image-guided-generate", "fashion-edit"],
        freeSupported: true,
        quality: "high",
      },
      {
        provider: "pollinations",
        model: "pollinations-turbo",
        baseUrl: "https://image.pollinations.ai/prompt",
        capabilities: ["image-to-image"],
        freeSupported: true,
        quality: "medium",
      },
    ],
    sketch: [
      {
        provider: "huggingface",
        model: "lllyasviel/sd-controlnet-canny",
        baseUrl: "https://router.huggingface.co/hf-inference/models",
        capabilities: ["sketch-to-image", "structure-preservation"],
        freeSupported: true,
        quality: "very_high",
      },
      {
        provider: "pollinations",
        model: "pollinations-turbo",
        baseUrl: "https://image.pollinations.ai/prompt",
        capabilities: ["sketch-to-image"],
        freeSupported: true,
        quality: "medium",
      },
    ],
    cloth: [
      {
        provider: "huggingface",
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        baseUrl: "https://router.huggingface.co/hf-inference/models",
        capabilities: ["cloth-redesign", "texture-preservation"],
        freeSupported: true,
        quality: "high",
      },
      {
        provider: "pollinations",
        model: "pollinations-turbo",
        baseUrl: "https://image.pollinations.ai/prompt",
        capabilities: ["image-to-image"],
        freeSupported: true,
        quality: "medium",
      },
    ],
  };

  const tools = toolMap[inputType] || toolMap.text;

  // Prefer specified provider if available
  if (preferredProvider) {
    const preferred = tools.find((t) => t.provider === preferredProvider);
    if (preferred) return preferred;
  }

  // Default: return first (highest quality) tool
  return tools[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PROMPT ENGINEERING
// ─────────────────────────────────────────────────────────────────────────────

export function enhancePromptForCase(
  basePrompt: string,
  caseType: InputType,
  occasion: string,
  additionalContext?: string
): string {
  const baseInstructions =
    "High-quality fashion catalog photoshoot, professional soft lighting, neutral studio background, premium quality, Indian fashion, detailed embroidery, sharp focus, ultra-detailed fabric texture, garment-focused composition, neck-down framing, no head, no face, no eyes, no mouth, no portrait, no blur";

  const caseSpecificPrompts: Record<InputType, (p: string) => string> = {
    text: (p) =>
      `${p}. Occasion: ${occasion}. Style: ${baseInstructions}. Create a stunning, detailed fashion design.`,

    image: (p) =>
      `Modify this dress: ${p}. Preserve original silhouette while applying changes. Occasion: ${occasion}. ${baseInstructions}.`,

    sketch: (p) =>
      `Convert this sketch into a realistic outfit: ${p}. Occasion: ${occasion}. Make it photorealistic with proper proportions. ${baseInstructions}.`,

    cloth: (p) =>
      `Transform this fabric/clothing into a new design: ${p}. Preserve the fabric texture and essence. Occasion: ${occasion}. ${baseInstructions}. Be creative while respecting the original material.`,
  };

  let enhanced = caseSpecificPrompts[caseType](basePrompt);

  if (additionalContext) {
    enhanced += `\nAdditional details: ${additionalContext}`;
  }

  return enhanced;
}

export function requiresSourceImage(inputType: InputType): boolean {
  return inputType === "image" || inputType === "sketch" || inputType === "cloth";
}

export function buildSourceImageInstructions(
  inputType: InputType,
  sourceImageUrl?: string | null,
): string {
  if (!sourceImageUrl) return "";

  switch (inputType) {
    case "image":
      return `Use the uploaded reference image as the base garment to modify while preserving the main silhouette. Reference image URL: ${sourceImageUrl}`;
    case "sketch":
      return `Use the uploaded sketch as the structural guide. Keep the silhouette faithful to the sketch while rendering it as a realistic finished outfit. Sketch image URL: ${sourceImageUrl}`;
    case "cloth":
      return `Use the uploaded cloth or saree image as the material source. Preserve the fabric mood, color story, and textile character while redesigning the garment. Cloth image URL: ${sourceImageUrl}`;
    default:
      return `Reference image URL: ${sourceImageUrl}`;
  }
}

export function buildCustomAIPayload(payload: CustomAIGeneratePayload) {
  return {
    mode: payload.mode,
    prompt: payload.prompt,
    occasion: payload.occasion,
    sourceImageUrl: payload.sourceImageUrl,
    negativePrompt:
      payload.negativePrompt ||
      "human face, visible face, face, head, eyes, nose, mouth, lips, ears, hairline, selfie, portrait, close-up portrait, watermark, blurry, soft focus, deformed body, extra limbs",
    width: payload.width ?? 832,
    height: payload.height ?? 1216,
  };
}

export function getCustomRequestNextSteps(inputType: InputType): string[] {
  const common = [
    "Review preview and refine if needed (max 3 refinements)",
    "Proceed to provider assignment",
  ];

  switch (inputType) {
    case "text":
      return [
        "Review generated concept from text brief",
        ...common,
      ];
    case "image":
      return [
        "Review the modified version of your uploaded outfit",
        ...common,
      ];
    case "sketch":
      return [
        "Review the sketch-to-real rendering for silhouette accuracy",
        ...common,
      ];
    case "cloth":
      return [
        "Review how the uploaded cloth was redesigned into a new outfit",
        ...common,
      ];
    default:
      return common;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. REFINEMENT PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildRefinementPrompt(
  originalPrompt: string,
  userFeedback: string,
  feedbackType?: string
): {
  newPrompt: string;
  action: "inpaint" | "regenerate" | "modify";
} {
  const feedbackLower = userFeedback.toLowerCase();

  // Determine refinement action based on feedback
  let action: "inpaint" | "regenerate" | "modify" = "regenerate";

  if (
    feedbackLower.includes("color") ||
    feedbackLower.includes("darker") ||
    feedbackLower.includes("lighter")
  ) {
    action = "inpaint";
  } else if (
    feedbackLower.includes("sleeve") ||
    feedbackLower.includes("length") ||
    feedbackLower.includes("cut") ||
    feedbackLower.includes("neck")
  ) {
    action = "inpaint";
  } else {
    action = "regenerate";
  }

  // Build new prompt with feedback baked in
  const newPrompt = `${originalPrompt}. User refinement: ${userFeedback}. Apply this change while maintaining overall design consistency.`;

  return { newPrompt, action };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. OCCASION DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export function detectOccasion(prompt: string): string {
  const occasionKeywords: Record<string, string> = {
    wedding: "wedding",
    bridal: "wedding",
    lehenga: "wedding",
    reception: "reception",
    engagement: "engagement",
    haldi: "haldi",
    mehndi: "mehndi",
    sangeet: "sangeet",
    cocktail: "cocktail",
    party: "special_occasion",
    casual: "casual",
    festive: "festive",
    diwali: "festive",
    eid: "festive",
  };

  const promptLower = prompt.toLowerCase();

  for (const [keyword, occasion] of Object.entries(occasionKeywords)) {
    if (promptLower.includes(keyword)) {
      return occasion;
    }
  }

  return "special_occasion";
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

export function validateCustomRequestInput(data: {
  prompt?: string;
  imageUrl?: string;
  fileSize?: number;
}): { valid: boolean; error?: string } {
  // Text validation
  if (data.prompt && data.prompt.length < 12) {
    return { valid: false, error: "Prompt must be at least 12 characters" };
  }

  // File size validation
  if (data.fileSize && data.fileSize > 5 * 1024 * 1024) {
    return { valid: false, error: "File size must be under 5MB" };
  }

  // At least one input required
  if (!data.prompt && !data.imageUrl) {
    return { valid: false, error: "Please provide either text or image" };
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUMMARY GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export function generateStyleSummary(
  prompt: string,
  occasion: string,
  caseType: InputType
): string {
  const caseLabel: Record<InputType, string> = {
    text: "Design Generated",
    image: "Design Modified",
    sketch: "Sketch Converted",
    cloth: "Fabric Redesigned",
  };

  const summary = `
**${caseLabel[caseType]}**

Design Brief: ${prompt}
Occasion: ${occasion}
Case: Case ${caseNumberFromType(caseType)} (${caseType})

Ready to refine further or proceed to provider assignment.`;

  return summary;
}

export async function generateImageViaFallback(prompt: string): Promise<{ url: string; source: "pollinations-fallback" }> {
  const fallbackPrompt = encodeURIComponent(prompt);
  return {
    url: `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=1024&height=1024&nologo=true`,
    source: "pollinations-fallback",
  };
}
