import { prisma } from "@/lib/prisma";

const ASSIGNMENT_HISTORY_IDENTIFIER_PREFIX = "delivery_assignment_history:";
const HISTORY_EXPIRY = new Date("2099-12-31T23:59:59.999Z");

type AssignmentAction = "ASSIGNED" | "REASSIGNED";

type AssignmentHistoryPayload = {
  action: AssignmentAction;
  orderId: string;
  orderStatus: string;
  listingTitle: string;
  providerId: string;
  providerName: string;
  providerPhone: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  previousDeliveryPartnerId: string | null;
  previousDeliveryPartnerName: string | null;
  previousDeliveryPartnerEmail: string | null;
  previousDeliveryPartnerPhone: string | null;
  deliveryPartnerId: string;
  deliveryPartnerName: string;
  deliveryPartnerEmail: string;
  deliveryPartnerPhone: string | null;
  assignedByAdminId: string;
  assignedByAdminName: string;
};

export type AssignmentHistoryEntry = AssignmentHistoryPayload & {
  loggedAt: Date;
};

export async function recordDeliveryAssignmentHistory(payload: AssignmentHistoryPayload) {
  const identifier = `${ASSIGNMENT_HISTORY_IDENTIFIER_PREFIX}${payload.orderId}`;

  await prisma.verification.create({
    data: {
      identifier,
      value: JSON.stringify(payload),
      expiresAt: HISTORY_EXPIRY,
    },
  });
}

export async function listDeliveryAssignmentHistory({
  take = 100,
  skip = 0,
  orderId,
}: {
  take?: number;
  skip?: number;
  orderId?: string;
} = {}): Promise<AssignmentHistoryEntry[]> {
  const identifier = orderId
    ? `${ASSIGNMENT_HISTORY_IDENTIFIER_PREFIX}${orderId}`
    : ASSIGNMENT_HISTORY_IDENTIFIER_PREFIX;

  const rows = await prisma.verification.findMany({
    where: {
      identifier: orderId
        ? identifier
        : {
            startsWith: identifier,
          },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
    select: {
      value: true,
      createdAt: true,
    },
  });

  const parsed: AssignmentHistoryEntry[] = [];

  for (const row of rows) {
    try {
      const data = JSON.parse(row.value) as AssignmentHistoryPayload;
      parsed.push({
        ...data,
        loggedAt: row.createdAt,
      });
    } catch {
      // Skip malformed history records.
    }
  }

  return parsed;
}
