import { destroyDeliverySession } from "@/lib/delivery-auth";

export async function POST() {
  await destroyDeliverySession();
  return Response.json({ success: true });
}
