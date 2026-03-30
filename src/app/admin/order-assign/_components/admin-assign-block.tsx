"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";

type PartnerOption = {
  id: string;
  employeeCode: string;
  fullName: string | null;
  email: string;
};

type UnassignedOrder = {
  id: string;
  status: string;
  listingTitle: string;
  customerName: string;
};

export function AdminAssignBlock({
  partners,
  unassignedOrders,
}: {
  partners: PartnerOption[];
  unassignedOrders: UnassignedOrder[];
}) {
  const router = useRouter();

  const [orderId, setOrderId] = useState("");
  const [deliveryPartnerId, setDeliveryPartnerId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const handleAssignOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAssignLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, deliveryPartnerId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Could not assign delivery");
        return;
      }

      toast.success("Delivery assigned successfully");
      setOrderId("");
      setDeliveryPartnerId("");
      router.refresh();
    } catch {
      toast.error("Could not assign delivery");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Quick Assign Order</h3>
        <p className="text-sm text-muted-foreground">
          Assign a delivery partner to an accepted, unassigned order.{" "}
          {unassignedOrders.length > 0 ? (
            <span className="font-medium text-orange-600">{unassignedOrders.length} unassigned order{unassignedOrders.length !== 1 ? "s" : ""} pending.</span>
          ) : (
            <span className="text-green-600">All orders are assigned.</span>
          )}
        </p>
      </div>

      <form onSubmit={handleAssignOrder} className="relative z-10 grid gap-3 overflow-visible sm:grid-cols-[1fr_1fr_auto]">
        <CustomSelect
          name="orderId"
          required
          value={orderId}
          onValueChange={setOrderId}
          options={[
            { value: "", label: unassignedOrders.length === 0 ? "No unassigned orders" : "Select unassigned order" },
            ...unassignedOrders.map((order) => ({
              value: order.id,
              label: `${order.listingTitle} — ${order.customerName} (${order.id.slice(0, 8)})`,
            })),
          ]}
        />
        <CustomSelect
          name="deliveryPartnerId"
          required
          value={deliveryPartnerId}
          onValueChange={setDeliveryPartnerId}
          options={[
            { value: "", label: partners.length === 0 ? "No active partners" : "Select delivery partner" },
            ...partners.map((partner) => ({
              value: partner.id,
              label: `${partner.employeeCode} — ${partner.fullName || partner.email}`,
            })),
          ]}
        />
        <button
          className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          type="submit"
          disabled={assignLoading || unassignedOrders.length === 0 || partners.length === 0}
        >
          {assignLoading ? "Assigning..." : "Assign"}
        </button>
      </form>
    </section>
  );
}
