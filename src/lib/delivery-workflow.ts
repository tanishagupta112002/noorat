import crypto from "crypto";

export type DeliveryTaskStage =
  | "ASSIGNED"
  | "PICKED_UP_FROM_PROVIDER"
  | "DELIVERED_TO_CUSTOMER"
  | "PICKED_UP_FROM_CUSTOMER"
  | "DELIVERED_TO_PROVIDER"
  | "CLOSED";

export const DELIVERY_TASK_NEXT_STAGE: Record<DeliveryTaskStage, DeliveryTaskStage | null> = {
  ASSIGNED: "PICKED_UP_FROM_PROVIDER",
  PICKED_UP_FROM_PROVIDER: "DELIVERED_TO_CUSTOMER",
  DELIVERED_TO_CUSTOMER: "PICKED_UP_FROM_CUSTOMER",
  PICKED_UP_FROM_CUSTOMER: "DELIVERED_TO_PROVIDER",
  DELIVERED_TO_PROVIDER: "CLOSED",
  CLOSED: null,
};

export function hashInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createInviteToken() {
  // 6-digit numeric code for easy manual sharing.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function createEmployeeCode() {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `DLV-${suffix}`;
}

export function getProofFieldForStage(stage: string):
  | "pickupProofImage"
  | "deliveryProofImage"
  | "returnPickupProofImage"
  | "providerDropProofImage"
  | null {
  switch (stage) {
    case "PICKED_UP_FROM_PROVIDER":
      return "pickupProofImage";
    case "DELIVERED_TO_CUSTOMER":
      return "deliveryProofImage";
    case "PICKED_UP_FROM_CUSTOMER":
      return "returnPickupProofImage";
    case "DELIVERED_TO_PROVIDER":
      return "providerDropProofImage";
    default:
      return null;
  }
}

export function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    ASSIGNED: "Assigned",
    PICKED_UP_FROM_PROVIDER: "Picked Up from Provider",
    DELIVERED_TO_CUSTOMER: "Delivered to Customer",
    PICKED_UP_FROM_CUSTOMER: "Picked Up from Customer",
    DELIVERED_TO_PROVIDER: "Delivered to Provider",
    CLOSED: "Closed",
  };
  return labels[stage] ?? stage;
}
