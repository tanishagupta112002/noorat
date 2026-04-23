import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = (await req.json()) as { requestId?: string };
    const requestId = String(body.requestId || "").trim();

    if (!requestId) {
      return Response.json(
        { success: false, error: "requestId is required" },
        { status: 400 },
      );
    }

    const db = prisma as any;
    const customRequest = await db.customRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        originalPrompt: true,
        currentPreviewUrl: true,
      },
    });

    if (!customRequest) {
      return Response.json(
        { success: false, error: "Request not found" },
        { status: 404 },
      );
    }

    if (customRequest.userId !== userId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    if (!customRequest.currentPreviewUrl) {
      return Response.json(
        { success: false, error: "No generated image to save" },
        { status: 400 },
      );
    }

    const existingSaved = await db.customRequestRefinement.findFirst({
      where: {
        requestId,
        action: "save",
      },
      select: { id: true },
    });

    if (existingSaved) {
      return Response.json({
        success: true,
        data: {
          requestId,
          saved: true,
          alreadySaved: true,
        },
      });
    }

    await db.customRequestRefinement.create({
      data: {
        requestId,
        step: 0,
        action: "save",
        promptUsed: customRequest.originalPrompt,
        resultImageUrl: customRequest.currentPreviewUrl,
        userFeedback: "Saved to profile",
        feedbackType: "style",
      },
    });

    return Response.json({
      success: true,
      data: {
        requestId,
        saved: true,
        alreadySaved: false,
      },
    });
  } catch (error) {
    console.error("[custom-requests/save-look] failed", error);
    return Response.json(
      { success: false, error: "Unable to save this generated look right now." },
      { status: 500 },
    );
  }
}
