# 🧠 Noorat Agentic AI System Design

## Vision
Transform custom requests into an intelligent, multi-case design system that automatically detects intent, routes to right AI tools, refines outputs iteratively, and connects with provider network.

---

## 🎯 4 Core Use Cases

### Case 1: Text → Design
**Input:** Text prompt only  
**Example:** "Red modern lehenga with slit, heavy embroidery"  
**AI Tool:** Stable Diffusion / DALL·E  
**Output:** Generated outfit images

### Case 2: Image → Modify
**Input:** Dress image + modification prompt  
**Example:** Upload dress image + "make it sleeveless and black"  
**AI Tool:** Inpainting / Image-to-Image  
**Output:** Modified dress maintaining original style

### Case 3: Sketch → Real
**Input:** Hand-drawn sketch of outfit  
**Example:** Quick sketch of lehenga silhouette  
**AI Tool:** ControlNet (sketch-to-image)  
**Output:** Photorealistic outfit from sketch

### Case 4: Old Cloth → New Design (🔥 USP)
**Input:** Photo of existing saree/cloth  
**Example:** "Convert this saree into modern indo-western gown"  
**AI Tool:** Image-to-Image + Fabric-aware prompt engineering  
**Output:** Redesigned outfit preserving fabric essence

---

## 🧩 Master Flow Architecture

```
User Input
    ↓
[Intent Classifier] ← Detects use case (text/image/sketch/cloth)
    ↓
[Task Router] ← Maps to AI tool
    ↓
[AI Generator] ← Produces output
    ↓
[Refinement Loop] ← User feedback → regenerate
    ↓
[Virtual Try-On] ← Optional: show on user photo
    ↓
[Provider Assignment] ← Rent / Custom stitch options
    ↓
User picks provider + gets quote + timeline
```

---

## 🧠 System Components

### 1. Input Classifier
Detects intent from submission data:

```
Input Type Detection:
├─ Text only → Case 1
├─ Text + Image → Case 2 (modify)
├─ Sketch file → Case 3
├─ Cloth/Fabric image → Case 4
└─ Fallback logic for ambiguous cases
```

**Implementation:**
- Check file types in FormData
- Analyze MIME types and dimensions
- If sketch-like (low detail), route to Case 3
- If fabric/texture heavy, route to Case 4

### 2. AI Tool Router
Maps case to optimal model:

| Case | Tool | Provider | Free? | Quality |
|------|------|----------|-------|---------|
| 1 | Stable Diffusion XL | Hugging Face | ✅ | High |
| 1 | DALL·E 3 | OpenAI | ❌ | Very High |
| 2 | ControlNet Inpaint | Local/HF | ✅ | High |
| 3 | ControlNet Sketch | Hugging Face | ✅ | High |
| 4 | Image-to-Image + Fabric | HF + prompt chain | ✅ | High |

**Fallback chain:** Primary → Secondary → Pollinations

### 3. Refinement Loop (Core Agentic Feature)

User can iterate:
```
Preview 1 ← [User feedback: "more stylish"]
    ↓ 
[Re-prompt engine] ← enhances original prompt
    ↓
Preview 2 ← [User feedback: "neck deeper"]
    ↓
[Inpainting] ← modifies specific area
    ↓
Final Preview ← Ready for provider assignment
```

**State tracking:**
- Store run_id + step history
- Allow revert to previous preview
- Track edit count (limit: 3 refinements)

### 4. Virtual Try-On (Phase 2)
```
Input:
├─ User photo (face + body)
├─ Generated dress
└─ User's measurements

Output:
└─ AR/realistic preview of dress on user
```

**Tools:** Snapchat lens logic or open-source virtual try-on

### 5. Provider Assignment Flow

```
Final design ready
    ↓
[Intent detection again]
├─ If text/full generate → "Get Stitched" button
├─ If modified rental → "Rent Similar" button
└─ Hybrid → Both options

User selects option
    ↓
[Provider Broadcast]
├─ Design sent to relevant providers
├─ Providers can Accept/Quote
├─ Show: Cost, Timeline, Ratings
    ↓
User picks provider
    ↓
Order created
```

**Provider Types:**
- Custom Stitchers (for "Get Stitched")
- Rental Partners (for "Rent Similar")
- Manufacturers (for bulk production)

---

## 📊 Database Schema Updates Needed

### Existing Table: `CustomRequest` (if exists, or create)

```sql
CREATE TABLE custom_requests (
  id String @id @default(cuid())
  userId String @db.Text
  
  -- Input metadata
  inputType "text" | "image" | "sketch" | "cloth" -- enum
  originalPrompt String @db.Text
  uploadedImageUrl String? -- S3/Blob URL
  
  -- AI metadata
  previewSource "ai-gateway" | "huggingface" | "pollinations"
  generationModel String? -- e.g. "sdxl", "controlnet-sketch"
  
  -- Refinement history
  refinementCount Int @default(0)
  refinementHistory Json? -- stores all previews + prompts
  currentPreviewUrl String
  
  -- Output metadata
  occasion String?
  occasionDetected String
  budget Int?
  estimatedCost Int? -- after provider quote
  
  -- Provider assignment
  selectedProviderId String? @db.Text
  providerType "custom_stitch" | "rental" | "manufacturer"?
  providerQuote Json? -- {cost, timeline, discount}
  
  -- Tracks
  status "generating" | "preview_ready" | "refinement" | "provider_assigned" | "order_created"
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

-- New table: Refinement history
CREATE TABLE custom_request_refinements (
  id String @id @default(cuid())
  requestId String @db.Text
  
  step Int
  action "generate" | "inpaint" | "modify" | "try_on"
  promptUsed String @db.Text
  resultImageUrl String
  userFeedback String? @db.Text
  score Int? -- 1-5 user satisfaction
  
  createdAt DateTime @default(now())
}

-- Connect providers to requests
CREATE TABLE custom_request_provider_bids (
  id String @id @default(cuid())
  requestId String @db.Text
  providerId String @db.Text
  
  providerType "custom_stitch" | "rental" | "manufacturer"
  quotedPrice Int
  timeline String -- e.g. "7-10 days"
  notes String? @db.Text
  rating Float? -- provider's average rating
  
  status "pending" | "accepted" | "rejected" | "selected"
  
  createdAt DateTime @default(now())
  respondedAt DateTime?
}
```

---

## 🔄 API Routes Breakdown

### Route 1: POST `/api/custom-requests/classify`
**Input:** FormData (text + optional files)  
**Output:** `{ inputType, confidence, suggestedCase }`

### Route 2: POST `/api/custom-requests/generate`
**Input:** Classified input + case number  
**Output:** `{ previewImageUrl, previewSource, refinementId, suggestions }`

### Route 3: POST `/api/custom-requests/refine`
**Input:** requestId + userFeedback + refinementType  
**Output:** Updated preview + step history

### Route 4: POST `/api/custom-requests/try-on`
**Input:** previewImageUrl + userPhotoUrl  
**Output:** Virtual try-on result + confidence

### Route 5: POST `/api/custom-requests/provider-broadcast`
**Input:** requestId + finalDesignUrl + occasion + budget  
**Output:** `{ broadcastId, providers awaiting, timeouts }`

### Route 6: GET `/api/custom-requests/provider-bids/:requestId`
**Output:** Array of provider quotes + ratings

### Route 7: POST `/api/custom-requests/assign-provider`
**Input:** requestId + selectedProviderId  
**Output:** Order created + next steps

---

## 🛠️ Implementation Phases

### Phase 1: MVP (Current → 1 week)
✅ Input Classifier  
✅ Case 1 (Text → Design) with refinement loop  
✅ Case 2 (Image → Modify) basic version  
✅ Hugging Face + Pollinations dual provider  
✅ Source tracking (previewSource badge)

### Phase 2: Enhanced (1-2 weeks)
- Case 3 (Sketch → Real) with ControlNet
- Case 4 (Cloth → Redesign) with fabric analysis
- Refinement UI overhaul (slider-based edits)
- Refinement history storage (DB)

### Phase 3: Smart Assignment (2-3 weeks)
- Provider broadcast API
- Dynamic provider matching (occasion + budget)
- Provider rating integration
- Order creation workflow

### Phase 4: Virtual Try-On (3-4 weeks)
- Body detection
- Try-on rendering
- AR preview option
- Success metrics tracking

---

## 🚨 Safety + Cost Guards

```
Per Request:
├─ Max 3 refinements (cost control)
├─ Max 5 total AI calls
├─ Timeout: 30s per generation
├─ Max image size: 5MB
└─ Rate limit: 5 requests/user/hour (free tier)

Provider Assignment:
├─ Auto timeout after 24h no response
├─ Show estimated cost upfront
├─ Fraud detection on quotes
└─ Refund policy messaging
```

---

## 📈 Success Metrics

Track per request:
- `time_to_first_preview`
- `refinement_count_avg`
- `user_satisfaction_score` (1-5)
- `provider_assignment_rate` %
- `conversion_to_order` %
- `cost_accuracy` (estimated vs actual)

---

## 🔐 Privacy Considerations

- Don't store raw user photos longer than 30 days
- Prompt text sanitized before logging
- Fabric/texture images treated as sensitive (blur after processing)
- Provider bids encrypted until user views
- GDPR-compliant audit trail

---

## 📦 Dependencies

### AI Tools (Free tier with tokens)
- Hugging Face Inference API
- Stable Diffusion XL
- ControlNet (sketch-to-image)
- Optional: DALL·E 3 for premium tier

### Image Processing
- Sharp (resize, compression)
- node-canvas (sketch detection)
- TensorFlow.js (fabric detection)

### Database
- Existing Prisma + Neon setup

---

## 🎯 Next Steps

1. Create Prisma schema updates
2. Implement classifier endpoint
3. Build Case 1 + Case 2 fully
4. Deploy Phase 1 MVP
5. Gather user feedback
6. Phase 2 expansion

---

**Owner:** Tanisha  
**Status:** Design Document v1  
**Last Updated:** April 7, 2026
