/**
 * rental-helpers.ts — pure, client-safe functions.
 * No server imports (no prisma, no node builtins).
 */

export const DELIVERY_DAYS = 7;
export const RENTAL_DAYS = 3;
export const RETURN_DAYS = 5;
export const TOTAL_CYCLE_DAYS = DELIVERY_DAYS + RENTAL_DAYS + RETURN_DAYS; // 15

/** Human-readable label for each OrderStatus value */
export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    SHIPPED: "Dispatched",
    WITH_CUSTOMER: "With Customer",
    RETURNED: "Returned",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}

/**
 * Valid next status transitions a provider can trigger.
 * Returns an empty array if the status is terminal.
 */
export function nextProviderActions(
  status: string,
): { label: string; nextStatus: string; variant: "default" | "outline" | "destructive" }[] {
  switch (status) {
    case "PENDING":
      return [
        { label: "Accept Order", nextStatus: "ACCEPTED", variant: "default" },
        { label: "Cancel", nextStatus: "CANCELLED", variant: "destructive" },
      ];
    case "ACCEPTED":
      return [
        { label: "Dispatch Order", nextStatus: "SHIPPED", variant: "default" },
        { label: "Cancel", nextStatus: "CANCELLED", variant: "destructive" },
      ];
    case "RETURNED":
      return [
        { label: "Inspect & Close", nextStatus: "COMPLETED", variant: "default" },
      ];
    default:
      return [];
  }
}

/**
 * Calculate projected rental lifecycle dates at the moment an order is placed.
 * Safe to call on client (no DB access).
 */
export function calculateRentalDates(orderPlacedAt: Date = new Date()) {
  const rentalStartDate = new Date(orderPlacedAt);
  rentalStartDate.setDate(rentalStartDate.getDate() + DELIVERY_DAYS);
  rentalStartDate.setHours(0, 0, 0, 0);

  const rentalEndDate = new Date(rentalStartDate);
  rentalEndDate.setDate(rentalEndDate.getDate() + RENTAL_DAYS);

  const expectedReturnDate = new Date(rentalEndDate);
  expectedReturnDate.setDate(expectedReturnDate.getDate() + RETURN_DAYS);

  return { rentalStartDate, rentalEndDate, expectedReturnDate };
}

/**
 * Returns number of whole days from `fromDate` until `targetDate`.
 * Value is never negative.
 */
export function getDaysUntilDate(targetDate: Date, fromDate: Date = new Date()): number {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diff = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Format a date for display in error messages
 */
export function formatAvailabilityDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  
  const daysFromNow = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysFromNow === 0) return "today";
  if (daysFromNow === 1) return "tomorrow";
  if (daysFromNow > 1) return `in ${daysFromNow} days`;
  
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
