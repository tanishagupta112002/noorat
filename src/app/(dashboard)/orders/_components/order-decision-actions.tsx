"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  orderId: string;
  status: string;
  deliveredToCustomerAt: string | null;
  deliveryTaskStage: string | null;
};

type DecisionAction = "CANCEL" | "ACCEPT" | "DECLINE";

export function OrderDecisionActions({
  orderId,
  status,
  deliveredToCustomerAt,
  deliveryTaskStage,
}: Props) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<DecisionAction | null>(null);

  const canCancelBeforeDelivery =
    !deliveredToCustomerAt && ["PENDING", "ACCEPTED", "SHIPPED"].includes(status);

  const canRespondAtDoorstep =
    status === "SHIPPED" &&
    !deliveredToCustomerAt &&
    deliveryTaskStage === "DELIVERED_TO_CUSTOMER";

  if (!canCancelBeforeDelivery && !canRespondAtDoorstep) {
    return null;
  }

  const submitAction = async (action: DecisionAction) => {
    if (loadingAction) return;
    setLoadingAction(action);

    try {
      const res = await fetch(`/api/orders/${orderId}/decision`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Unable to update order");
        return;
      }

      if (action === "ACCEPT") {
        toast.success("Order accepted. Delivery confirmed.");
      } else if (action === "DECLINE") {
        toast.success("Order declined. Full refund has been initiated.");
      } else {
        toast.success("Order cancelled. Refund has been initiated.");
      }

      router.refresh();
    } catch {
      toast.error("Unable to update order right now");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <section className="rounded-sm border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <h2 className="text-base font-semibold text-foreground">Delivery Decision</h2>

      {canRespondAtDoorstep ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Your rider is at the doorstep. Please check the outfit now and accept or decline.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() => submitAction("ACCEPT")}
              disabled={Boolean(loadingAction)}
            >
              {loadingAction === "ACCEPT" ? "Confirming..." : "Accept Order"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => submitAction("DECLINE")}
              disabled={Boolean(loadingAction)}
            >
              {loadingAction === "DECLINE" ? "Declining..." : "Decline at Doorstep"}
            </Button>
          </div>
        </>
      ) : null}

      {canCancelBeforeDelivery ? (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Cancel anytime before delivery for a 100% refund. Refund is processed to your original payment method within 3-5 business days.
          </p>
          <div className="mt-3">
            <Button
              variant="destructive"
              onClick={() => submitAction("CANCEL")}
              disabled={Boolean(loadingAction)}
            >
              {loadingAction === "CANCEL" ? "Cancelling..." : "Cancel Order"}
            </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}