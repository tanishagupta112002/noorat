/**
 * 🧠 Agentic AI Custom Request Types
 */

export type InputType = "text" | "image" | "sketch" | "cloth";
export type PreviewSource = "lora-adapter" | "ai-gateway" | "huggingface" | "pollinations-fallback";
export type GenerationAction = "generate" | "inpaint" | "modify" | "try_on";
export type RequestStatus = "generating" | "preview_ready" | "refinement" | "provider_assigned" | "order_created";
export type ProviderType = "custom_stitch" | "rental" | "manufacturer";
export type BidStatus = "pending" | "accepted" | "rejected" | "selected";

// ─────────────────────────────────────────────────────────────────────────────
// INPUT CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export interface ClassifyInput {
  prompt?: string;
  imageUrl?: string;
  imageFile?: File;
  sketchFile?: File;
  clothImageUrl?: string;
}

export interface ClassificationResult {
  inputType: InputType;
  confidence: number; // 0-1
  suggestedCase: number; // 1-4
  reasoning: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST Management
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomRequestCreate {
  inputType: InputType;
  originalPrompt: string;
  uploadedImageUrl?: string;
  occasion?: string;
  budget?: number;
  userId?: string;
}

export interface CustomRequestData {
  id: string;
  userId: string | null;
  inputType: InputType;
  originalPrompt: string;
  uploadedImageUrl: string | null;
  previewSource: PreviewSource;
  generationModel: string | null;
  refinementCount: number;
  currentPreviewUrl: string | null;
  occasion: string | null;
  occasionDetected: string | null;
  budget: number | null;
  estimatedCost: number | null;
  status: RequestStatus;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATION / AI OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratePreviewRequest {
  requestId: string;
  inputType: InputType;
  prompt: string;
  occasion: string;
  sourceImageUrls?: string[];
  model?: string;
}

export interface GeneratedPreview {
  imageUrl: string;
  source: PreviewSource;
  model: string;
  generatedAt: string;
}

export interface GeneratePreviewResponse {
  success: boolean;
  error?: string;
  data?: {
    requestId: string;
    previewImageUrl: string;
    previewSource: PreviewSource;
    summary: string;
    occasion: string;
    budget: number | null;
    refinementId: string;
    nextSteps: string[];
    sourceImageUrls: string[];
    generatedAt: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REFINEMENT / ITERATION
// ─────────────────────────────────────────────────────────────────────────────

export interface RefinementFeedback {
  requestId: string;
  feedback: string; // e.g. "make it shorter", "pink color"
  feedbackType?: string; // "style" | "cut" | "embroidery" | "color" | "overall"
  satisfactionScore?: number; // 1-5
}

export interface RefinementStep {
  id: string;
  step: number;
  action: GenerationAction;
  promptUsed: string;
  resultImageUrl: string;
  userFeedback: string | null;
  feedbackType: string | null;
  userSatisfactionScore: number | null;
  confidenceScore: number | null;
  createdAt: string;
}

export interface RefinePreviewResponse {
  success: boolean;
  error?: string;
  data?: {
    requestId: string;
    step: number;
    newPreviewImageUrl: string;
    previewSource: PreviewSource;
    refinementHistory: RefinementStep[];
    canRefineAgain: boolean;
    generatedAt: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUAL TRY-ON
// ─────────────────────────────────────────────────────────────────────────────

export interface TryOnRequest {
  requestId: string;
  previewImageUrl: string;
  userPhotoUrl: string;
  measurements?: {
    bust?: number;
    waist?: number;
    length?: number;
  };
}

export interface TryOnResponse {
  success: boolean;
  error?: string;
  data?: {
    tryOnImageUrl: string;
    confidence: number;
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface ProviderBroadcastRequest {
  requestId: string;
  finalDesignUrl: string;
  occasion: string;
  budget?: number;
  urgency?: "normal" | "urgent";
}

export interface ProviderQuote {
  id: string;
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  quotedPrice: number;
  timeline: string;
  deliveryNote?: string;
  customizations?: string;
  providerRating: number | null;
  completionRate: number | null;
  status: BidStatus;
  createdAt: string;
  respondedAt: string | null;
}

export interface ProviderBroadcastResponse {
  success: boolean;
  error?: string;
  data?: {
    broadcastId: string;
    providersNotified: number;
    timeoutHours: number;
  };
}

export interface ProviderBidsResponse {
  success: boolean;
  error?: string;
  data?: {
    requestId: string;
    bids: ProviderQuote[];
    bestQuote?: ProviderQuote;
    highestRated?: ProviderQuote;
  };
}

export interface AssignProviderRequest {
  requestId: string;
  bidId: string;
  providerId: string;
}

export interface AssignProviderResponse {
  success: boolean;
  error?: string;
  data?: {
    orderId: string;
    providerId: string;
    quotedPrice: number;
    timeline: string;
    nextSteps: string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AIDesignStudioState {
  // Input form
  prompt: string;
  occasion: string;
  budget: string;
  sourceImages: File[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  currentStep: "input" | "generating" | "preview" | "refining" | "tryOn" | "provider";
  
  // Data
  currentRequestId?: string;
  currentPreview?: GeneratedPreview;
  refinementHistory: RefinementStep[];
  providerQuotes?: ProviderQuote[];
  
  // Refinement
  maxRefinementsReached?: boolean;
  refinementCount: number;
}

export interface CaseConfig {
  type: InputType;
  label: string;
  description: string;
  icon: string;
  examples: string[];
  inputPrompt: string;
  aiTools: string[];
}
