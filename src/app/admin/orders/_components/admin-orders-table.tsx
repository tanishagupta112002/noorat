"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderTimelineSidebar } from "./order-timeline-sidebar";

type Partner = {
  id: string;
  fullName: string;
  email: string;
  employeeCode: string;
};

type OrderRow = {
  id: string;
  status: string;
  createdAt: string;
  listingTitle: string;
  providerName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryPartnerId: string | null;
  deliveryPartnerName: string | null;
  deliveryPartnerPhone: string | null;
  deliveryStage: string | null;
  hasDeliveryTask: boolean;
};

const REASSIGN_BLOCKED_STATUSES = ["COMPLETED"];

// CANCELLED is only blocked if there's no delivery task (cancelled before dispatch).
// If a delivery task exists on a cancelled order, the item is already out and needs
// to be returned to the provider — reassignment is allowed in that case.

export function AdminOrdersTable({
  orders,
  partners,
}: {
  orders: OrderRow[];
  partners: Partner[];
}) {
  const router = useRouter();
  const [selectedPartnerByOrder, setSelectedPartnerByOrder] = useState<Record<string, string>>({});
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);
  const [timelineOrderId, setTimelineOrderId] = useState<string | null>(null);
  const [reassignModeOrderId, setReassignModeOrderId] = useState<string | null>(null);

  const assignOrder = async (orderId: string) => {
    const deliveryPartnerId = selectedPartnerByOrder[orderId];

    if (!deliveryPartnerId) {
      toast.error("Please select a delivery partner");
      return;
    }

    setSubmittingOrderId(orderId);

    try {
      const res = await fetch("/api/admin/delivery/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, deliveryPartnerId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Unable to assign delivery partner");
        return;
      }

      toast.success(data.message || "Assignment updated");
      router.refresh();
    } catch {
      toast.error("Unable to assign delivery partner");
    } finally {
      setSubmittingOrderId(null);
    }
  };

  return (
    <>
      <OrderTimelineSidebar
        orderId={timelineOrderId}
        onClose={() => setTimelineOrderId(null)}
      />

    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="min-w-245 w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Listing</th>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Delivery</th>
            <th className="px-4 py-3">Assign / Reassign</th>
            <th className="px-4 py-3">Timeline</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isReassignBlocked =
              REASSIGN_BLOCKED_STATUSES.includes(order.status) ||
              (order.status === "CANCELLED" && !order.hasDeliveryTask);
            const selected =
              selectedPartnerByOrder[order.id] ||
              order.deliveryPartnerId ||
              "";

            return (
              <tr key={order.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{order.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </td>
                <td className="px-4 py-3 text-foreground">{order.listingTitle}</td>
                <td className="px-4 py-3 text-muted-foreground">{order.providerName}</td>
                <td className="px-4 py-3">
                  <p className="text-foreground">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                  <p className={`text-xs ${order.customerPhone ? "text-muted-foreground" : "text-red-600"}`}>
                    {order.customerPhone || "Phone missing"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-foreground">{order.deliveryPartnerName || "Not assigned"}</p>
                  <p className="text-xs text-muted-foreground">{order.deliveryPartnerPhone || "No phone"}</p>
                  <p className="text-xs text-muted-foreground">{order.deliveryStage || "-"}</p>
                </td>
                <td className="px-4 py-3">
                  {isReassignBlocked ? (
                    <p className="text-xs font-medium text-muted-foreground">Reassign blocked for {order.status.toLowerCase()} orders</p>
                  ) : order.deliveryPartnerId && reassignModeOrderId !== order.id ? (
                    // Assigned order, not in reassign mode: show partner name + Reassign button
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{order.deliveryPartnerName}</p>
                        <p className="text-xs text-muted-foreground">{order.deliveryPartnerPhone || "No phone"}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        onClick={() => {
                          setReassignModeOrderId(order.id);
                          setSelectedPartnerByOrder((prev) => ({
                            ...prev,
                            [order.id]: "",
                          }));
                        }}
                      >
                        Reassign
                      </button>
                    </div>
                  ) : (
                    // Unassigned OR in reassign mode: show dropdown + button
                    <div className="flex items-center gap-2">
                      <select
                        className="w-56 rounded-md border bg-background px-3 py-2 text-sm"
                        value={selected}
                        onChange={(event) => {
                          setSelectedPartnerByOrder((prev) => ({
                            ...prev,
                            [order.id]: event.target.value,
                          }));
                        }}
                      >
                        <option value="">Select delivery partner</option>
                        {partners.map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.employeeCode} - {partner.fullName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        disabled={submittingOrderId === order.id || !selected}
                        onClick={() => {
                          assignOrder(order.id);
                          setReassignModeOrderId(null);
                        }}
                      >
                        {submittingOrderId === order.id ? "Saving..." : order.deliveryPartnerId ? "Reassign" : "Assign"}
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setTimelineOrderId(order.id)}
                    className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>  
  );
}
