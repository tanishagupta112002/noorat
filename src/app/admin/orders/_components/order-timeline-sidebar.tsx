"use client";

import { useEffect, useState } from "react";

type TimelineOrder = {
  id: string;
  status: string;
  quantity: number;
  total: number;
  createdAt: string | null;
  acceptedAt: string | null;
  shippedAt: string | null;
  deliveredToCustomerAt: string | null;
  pickedUpFromCustomerAt: string | null;
  returnedToProviderAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  deliveryName: string | null;
  deliveryAddressLine: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPincode: string | null;
  listing: { title: string; category: string };
  user: { name: string | null; email: string; phone: string | null };
  provider: {
    businessName: string | null;
    phone: string | null;
    city: string | null;
    user: { name: string | null; email: string };
  };
  deliveryTask: {
    stage: string;
    notes: string | null;
    deliveryPartner: {
      fullName: string | null;
      email: string;
      employeeCode: string;
      phone: string | null;
    } | null;
  } | null;
};

type HistoryEntry = {
  orderId: string;
  loggedAt: string;
  action: string;
  deliveryPartnerName: string | null;
  deliveryPartnerPhone: string | null;
  previousDeliveryPartnerName: string | null;
  assignedByAdminName: string | null;
  customerName: string | null;
  providerName: string | null;
};

function fmt(value: string | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const TIMELINE_STEPS: { key: keyof TimelineOrder; label: string }[] = [
  { key: "createdAt", label: "Placed" },
  { key: "acceptedAt", label: "Accepted" },
  { key: "shippedAt", label: "Shipped" },
  { key: "deliveredToCustomerAt", label: "Delivered to Customer" },
  { key: "pickedUpFromCustomerAt", label: "Picked for Return" },
  { key: "returnedToProviderAt", label: "Returned to Provider" },
  { key: "completedAt", label: "Completed" },
  { key: "cancelledAt", label: "Cancelled" },
];

export function OrderTimelineSidebar({
  orderId,
  onClose,
}: {
  orderId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<{ order: TimelineOrder; history: HistoryEntry[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/admin/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError("Could not load order details"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const isOpen = !!orderId;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              {data?.order ? `Order ${data.order.id.slice(0, 8)}` : "Order Timeline"}
            </p>
            {data?.order && (
              <p className="text-xs text-muted-foreground">{data.order.listing.title} · {data.order.status}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
          )}

          {data && !loading && (
            <>
              {/* Contacts */}
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">{data.order.user.name || data.order.user.email}</p>
                  <p className="text-muted-foreground">{data.order.user.email}</p>
                  <p className={data.order.user.phone ? "text-muted-foreground" : "text-red-600"}>
                    {data.order.user.phone || "Phone missing"}
                  </p>
                  {data.order.deliveryCity && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {data.order.deliveryAddressLine}, {data.order.deliveryCity}, {data.order.deliveryState} {data.order.deliveryPincode}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Provider</p>
                  <p className="font-medium text-foreground">
                    {data.order.provider.businessName || data.order.provider.user.name || data.order.provider.user.email}
                  </p>
                  <p className="text-muted-foreground">{data.order.provider.user.email}</p>
                  <p className={data.order.provider.phone ? "text-muted-foreground" : "text-red-600"}>
                    {data.order.provider.phone || "Phone missing"}
                  </p>
                </div>

                <div className="rounded-xl border p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery Agent</p>
                  {data.order.deliveryTask?.deliveryPartner ? (
                    <>
                      <p className="font-medium text-foreground">{data.order.deliveryTask.deliveryPartner.fullName}</p>
                      <p className="text-muted-foreground">{data.order.deliveryTask.deliveryPartner.email}</p>
                      <p className={data.order.deliveryTask.deliveryPartner.phone ? "text-muted-foreground" : "text-red-600"}>
                        {data.order.deliveryTask.deliveryPartner.phone || "Phone missing"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {data.order.deliveryTask.deliveryPartner.employeeCode} · Stage: {data.order.deliveryTask.stage}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Not assigned</p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Timeline</p>
                <ol className="relative border-l border-muted-foreground/20 pl-5 space-y-3">
                  {TIMELINE_STEPS.map(({ key, label }) => {
                    const val = data.order[key] as string | null;
                    const done = !!val;
                    return (
                      <li key={key} className="relative">
                        <span
                          className={`absolute -left-5.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                            done
                              ? "border-green-500 bg-green-500"
                              : "border-muted-foreground/30 bg-white"
                          }`}
                        >
                          {done && (
                            <svg className="h-2 w-2 text-white" viewBox="0 0 8 8" fill="currentColor">
                              <path d="M1.5 4L3 5.5 6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                          )}
                        </span>
                        <p className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground/50"}`}>
                          {label}
                        </p>
                        {done && (
                          <p className="text-xs text-muted-foreground">{fmt(val)}</p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Assignment history */}
              {data.history.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignment History</p>
                  <div className="space-y-2">
                    {data.history.map((entry) => (
                      <div key={`${entry.orderId}-${entry.loggedAt}`} className="rounded-xl border p-3 text-xs">
                        <p className="font-medium text-foreground">{entry.action}</p>
                        <p className="text-muted-foreground">Agent: {entry.deliveryPartnerName || "-"}</p>
                        {entry.previousDeliveryPartnerName && (
                          <p className="text-muted-foreground">Previous: {entry.previousDeliveryPartnerName}</p>
                        )}
                        <p className="text-muted-foreground">{new Date(entry.loggedAt).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
