import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const db = prisma as any;
    const savedLooks = await db.customRequestRefinement.findMany({
      where: {
        action: "save",
        request: {
          userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 60,
      include: {
        request: {
          select: {
            id: true,
            originalPrompt: true,
          },
        },
      },
    });

    return Response.json({
      success: true,
      data: {
        items: savedLooks.map((item: any) => ({
          id: item.id,
          requestId: item.requestId,
          prompt: item.request?.originalPrompt || item.promptUsed,
          imageUrl: item.resultImageUrl,
          savedAt: item.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[custom-requests/saved] failed", error);
    return Response.json(
      { success: false, error: "Unable to fetch saved generated dresses right now." },
      { status: 500 },
    );
  }
}
