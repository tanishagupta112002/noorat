import { getCurrentDeliveryPartner } from "@/lib/delivery-auth";

export async function GET() {
  const deliverySession = await getCurrentDeliveryPartner();

  if (!deliverySession?.deliveryPartner?.id) {
    return Response.json({ authenticated: false, canAccessDeliveryMode: false, deliveryHref: "/delivery-auth/login" });
  }

  const allowed = deliverySession.deliveryPartner.status === "ACTIVE";

  return Response.json({
    authenticated: true,
    canAccessDeliveryMode: allowed,
    deliveryHref: allowed ? "/delivery/dashboard" : "/delivery-auth/login",
  });
}
