import { redirect } from "next/navigation";
import { getCurrentDeliveryPartner } from "@/lib/delivery-auth";

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const deliverySession = await getCurrentDeliveryPartner();

  if (!deliverySession?.deliveryPartner?.id) {
    redirect("/delivery-auth/login");
  }

  const canAccess = deliverySession.deliveryPartner.status === "ACTIVE";

  if (!canAccess) {
    redirect("/delivery-auth/login");
  }

  return <div className="min-h-screen bg-[#f7f7f8]">{children}</div>;
}
