/**
 * Rental availability engine — SERVER ONLY.
 *
 * Business rules:
 *  - 7 days delivery  : order placed → outfit arrives at customer
 *  - 3 days rental    : customer keeps the outfit
 *  - 5 days return    : return + inspection + ready again
 *  Total cycle        : 15 days
 *
 * A listing is "busy" for the entire cycle from order creation until
 * the order reaches RETURNED or COMPLETED/CANCELLED status.
 */

import { prisma } from "@/lib/prisma";
import { TOTAL_CYCLE_DAYS } from "./rental-helpers";
// Re-export shared helpers so server code has a single import point
export {
  DELIVERY_DAYS,
  RENTAL_DAYS,
  RETURN_DAYS,
  TOTAL_CYCLE_DAYS,
  calculateRentalDates,
  orderStatusLabel,
  nextProviderActions,
} from "./rental-helpers";

/** Statuses that mean the item is back (or order is void) */
export const CLOSED_STATUSES = ["COMPLETED", "CANCELLED", "RETURNED"] as const;

export type ActiveOrderReleaseSlot = {
  quantity: number;
  releaseAt: Date;
};

function resolveReleaseDate(order: { expectedReturnDate: Date | null; createdAt: Date }) {
  if (order.expectedReturnDate) return order.expectedReturnDate;

  const fallback = new Date(order.createdAt);
  fallback.setDate(fallback.getDate() + TOTAL_CYCLE_DAYS);
  return fallback;
}

/**
 * Count how many units of a listing are currently in an active rental cycle.
 * "Active" = order exists and is NOT in a closed status.
 */
export async function getActiveOrderCount(listingId: string): Promise<number> {
  return prisma.order.count({
    where: {
      listingId,
      status: { notIn: [...CLOSED_STATUSES] },
    },
  });
}

/**
 * Return true only if the listing has at least one free unit right now.
 */
export async function isListingAvailableForOrder(
  listingId: string,
  stockQuantity: number,
): Promise<boolean> {
  const active = await getActiveOrderCount(listingId);
  return active < stockQuantity;
}

export type ListingAvailabilityInfo = {
  activeCount: number;
  nextAvailableAt: Date | null; // earliest expectedReturnDate among active orders
};

/**
 * Bulk-fetch availability info for a list of listings in a single DB query.
 * Returns a map keyed by listingId.
 */
export async function getListingsAvailability(
  listingIds: string[],
): Promise<Record<string, ListingAvailabilityInfo>> {
  if (listingIds.length === 0) return {};

  const rows = await prisma.order.groupBy({
    by: ["listingId"],
    where: {
      listingId: { in: listingIds },
      status: { notIn: [...CLOSED_STATUSES] },
    },
    _count: { id: true },
    _min: { expectedReturnDate: true }, // earliest upcoming return = soonest free date
  });

  const result: Record<string, ListingAvailabilityInfo> = {};

  for (const row of rows) {
    result[row.listingId] = {
      activeCount: row._count.id,
      nextAvailableAt: row._min.expectedReturnDate ?? null,
    };
  }

  // Listings with no active orders get a clean entry
  for (const id of listingIds) {
    if (!result[id]) {
      result[id] = { activeCount: 0, nextAvailableAt: null };
    }
  }

  return result;
}

export async function getActiveOrderReleaseSchedule(
  listingIds: string[],
): Promise<Record<string, ActiveOrderReleaseSlot[]>> {
  if (listingIds.length === 0) return {};

  const rows = await prisma.order.findMany({
    where: {
      listingId: { in: listingIds },
      status: { notIn: [...CLOSED_STATUSES] },
    },
    select: {
      listingId: true,
      quantity: true,
      expectedReturnDate: true,
      createdAt: true,
    },
    orderBy: [{ listingId: "asc" }, { expectedReturnDate: "asc" }, { createdAt: "asc" }],
  });

  const schedule: Record<string, ActiveOrderReleaseSlot[]> = {};

  for (const listingId of listingIds) {
    schedule[listingId] = [];
  }

  for (const row of rows) {
    schedule[row.listingId] ??= [];
    schedule[row.listingId].push({
      quantity: Math.max(1, row.quantity),
      releaseAt: resolveReleaseDate(row),
    });
  }

  for (const listingId of Object.keys(schedule)) {
    schedule[listingId].sort((left, right) => left.releaseAt.getTime() - right.releaseAt.getTime());
  }

  return schedule;
}

