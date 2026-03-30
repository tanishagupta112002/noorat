import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveOrderReleaseSchedule } from "@/lib/rental-availability";
import { TOTAL_CYCLE_DAYS, getDaysUntilDate } from "@/lib/rental-helpers";

type UnavailableItem = {
  title: string;
  daysUntilAvailable: number | null;
};

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ unavailableItems: [] });
    }

    const unavailableItems: UnavailableItem[] = [];

    const normalizedItems = items
      .map((item) => ({
        listingId: String(item?.listingId || "").trim(),
        quantity: Math.max(1, Math.trunc(Number(item?.quantity) || 1)),
      }))
      .filter((item) => item.listingId.length > 0);

    if (normalizedItems.length === 0) {
      return Response.json({ unavailableItems: [] });
    }

    const listingIds = Array.from(new Set(normalizedItems.map((item) => item.listingId)));
    const [listings, activeOrderSchedule] = await Promise.all([
      prisma.listing.findMany({
        where: { id: { in: listingIds } },
        select: { id: true, title: true, stockQuantity: true },
      }),
      getActiveOrderReleaseSchedule(listingIds),
    ]);

    const listingMap = new Map(listings.map((listing) => [listing.id, listing]));

    for (const item of normalizedItems) {
      const listing = listingMap.get(item.listingId);

      if (!listing) continue;

      const activeOrders = activeOrderSchedule[item.listingId] ?? [];

      const activeUnits = activeOrders.reduce((sum, order) => sum + order.quantity, 0);
      const available = listing.stockQuantity - activeUnits;

      // If not enough units are available now, compute the exact days until enough units are released.
      if (available < item.quantity) {
        const shortageUnits = item.quantity - Math.max(0, available);

        let released = 0;
        let targetReleaseDate: Date | null = null;

        for (const slot of activeOrders) {
          released += slot.quantity;
          if (released >= shortageUnits) {
            targetReleaseDate = slot.releaseAt;
            break;
          }
        }

        const daysUntilAvailable = targetReleaseDate
          ? getDaysUntilDate(targetReleaseDate)
          : TOTAL_CYCLE_DAYS;

        unavailableItems.push({
          title: listing.title,
          daysUntilAvailable,
        });
      }
    }

    return Response.json({ unavailableItems });
  } catch (error) {
    console.error("Availability check error:", error);
    return Response.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
