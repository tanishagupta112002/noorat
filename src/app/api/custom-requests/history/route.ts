import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const generations = await prisma.customRequest.findMany({
      where: {
        userId,
        currentPreviewUrl: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      select: {
        id: true,
        originalPrompt: true,
        currentPreviewUrl: true,
        previewSource: true,
        createdAt: true,
        refinements: {
          where: {
            action: "save",
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    return Response.json({
      success: true,
      data: {
        items: generations.map((item) => ({
          id: item.id,
          prompt: item.originalPrompt,
          imageUrl: item.currentPreviewUrl,
          previewSource: item.previewSource,
          isSaved: item.refinements.length > 0,
          createdAt: item.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[custom-requests/history] failed", error);
    return Response.json(
      {
        success: false,
        error: "Unable to fetch generation history right now.",
      },
      { status: 500 },
    );
  }
}
