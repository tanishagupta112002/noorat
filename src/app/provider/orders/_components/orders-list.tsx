"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowLeft } from "lucide-react";
import { nextProviderActions, orderStatusLabel } from "@/lib/rental-helpers";

export type OrderRow = {
  id: string;
  status: string;
  deliveryTaskStage: string | null;
  deliveryName: string | null;
  deliveryAddressLine: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPincode: string | null;
  listing: { id: string; title: string; size: string; category: string; images: string[]; stockQuantity: number };
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
  quantity: number;
  total: number;
  createdAt: string;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  expectedReturnDate: string | null;
  acceptedAt: string | null;
  shippedAt: string | null;
  pickedUpFromProviderAt: string | null;
  deliveredToCustomerAt: string | null;
  pickedUpFromCustomerAt: string | null;
  returnedToProviderAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  availability: {
    activeCount: number;
    nextAvailableAt: string | null;
  };
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function addDaysIso(iso: string | null, days: number) {
  if (!iso) return null;
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function formatTimelineDate({
  actualDate,
  expectedDate,
  done,
}: {
  actualDate?: string | null;
  expectedDate?: string | null;
  done: boolean;
}) {
  if (actualDate) return formatDate(actualDate);
  if (!done && expectedDate) return `Expected ${formatDate(expectedDate)}`;
  if (done && expectedDate) return formatDate(expectedDate);
  return "-";
}

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "PENDING":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    case "WITH_CUSTOMER":
    case "SHIPPED":
    case "RETURNED":
    case "ACCEPTED":
      return "outline";
    default:
      return "secondary";
  }
}

function RentalTimeline({
  createdAt,
  rentalStartDate,
  rentalEndDate,
  expectedReturnDate,
  acceptedAt,
  shippedAt,
  pickedUpFromProviderAt,
  deliveredToCustomerAt,
  pickedUpFromCustomerAt,
  returnedToProviderAt,
  completedAt,
  status,
  deliveryTaskStage,
}: {
  createdAt: string;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  expectedReturnDate: string | null;
  acceptedAt: string | null;
  shippedAt: string | null;
  pickedUpFromProviderAt: string | null;
  deliveredToCustomerAt: string | null;
  pickedUpFromCustomerAt: string | null;
  returnedToProviderAt: string | null;
  completedAt: string | null;
  status: string;
  deliveryTaskStage: string | null;
}) {
  const dispatchExpectedAt = addDaysIso(createdAt, 1);
  const riderPickupExpectedAt = addDaysIso(createdAt, 1);
  const returnPickupExpectedAt = addDaysIso(rentalEndDate, 1);

  const steps = [
    {
      label: "Order received",
      date: createdAt,
      done: true,
    },
    {
      label: "You accepted order",
      actualDate: acceptedAt,
      expectedDate: createdAt,
      done: ["ACCEPTED", "SHIPPED", "WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(status),
    },
    {
      label: "You dispatched item",
      actualDate: shippedAt,
      expectedDate: dispatchExpectedAt,
      done: ["SHIPPED", "WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(status),
    },
    {
      label: "Rider picked up from you",
      actualDate: pickedUpFromProviderAt,
      expectedDate: riderPickupExpectedAt,
      done: ["SHIPPED", "WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(status),
    },
    {
      label: "Rider reached customer doorstep",
      actualDate: deliveryTaskStage === "DELIVERED_TO_CUSTOMER" ? deliveredToCustomerAt : null,
      expectedDate: rentalStartDate,
      done:
        deliveryTaskStage === "DELIVERED_TO_CUSTOMER" ||
        ["PICKED_UP_FROM_CUSTOMER", "DELIVERED_TO_PROVIDER", "CLOSED"].includes(
          deliveryTaskStage || "",
        ),
    },
    {
      label: "Customer accepted order",
      actualDate: deliveredToCustomerAt,
      expectedDate: rentalStartDate,
      done: ["WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(status),
    },
    {
      label: "Customer rental period ended",
      actualDate: pickedUpFromCustomerAt,
      expectedDate: rentalEndDate,
      done: Boolean(pickedUpFromCustomerAt || returnedToProviderAt || completedAt),
    },
    {
      label: "Rider picked up return",
      actualDate: pickedUpFromCustomerAt,
      expectedDate: returnPickupExpectedAt,
      done: Boolean(pickedUpFromCustomerAt || returnedToProviderAt || completedAt),
    },
    {
      label: "Item returned to you",
      actualDate: returnedToProviderAt,
      expectedDate: expectedReturnDate,
      done: ["RETURNED", "COMPLETED"].includes(status),
    },
    {
      label: "You completed inspection & settlement",
      actualDate: completedAt,
      expectedDate: expectedReturnDate,
      done: ["COMPLETED"].includes(status),
    },
  ];

  return (
    <ol className="space-y-5">
      {steps.map((step, index) => (
        <li key={step.label} className="relative pl-9">
          {index !== steps.length - 1 ? (
            <span className="absolute left-2 top-5 h-[calc(100%+0.75rem)] w-px bg-border/70" />
          ) : null}
          <span
            className={`absolute left-0 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
              step.done ? "bg-emerald-500" : "bg-muted-foreground/35"
            }`}
          />
          <p className={`text-sm leading-tight ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
            {step.label}
          </p>
          <p className={`mt-1 text-sm font-medium ${step.done ? "text-emerald-700" : "text-muted-foreground"}`}>
            {formatTimelineDate({
              actualDate: "actualDate" in step ? step.actualDate : step.date,
              expectedDate: "expectedDate" in step ? step.expectedDate : null,
              done: step.done,
            })}
          </p>
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order: initial }: { order: OrderRow }) {
  const [order, setOrder] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [dispatchProofFile, setDispatchProofFile] = useState<File | null>(null);
  const listingImage = order.listing.images?.[0] || "/images/image.png";

  const actions = nextProviderActions(order.status);
  const availableUnits = Math.max(0, order.listing.stockQuantity - order.availability.activeCount);
  const customerAddress = [
    order.deliveryAddressLine,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryPincode,
  ]
    .filter(Boolean)
    .join(", ");

  const handleAction = async (nextStatus: string) => {
    if (nextStatus === "SHIPPED" && !dispatchProofFile) {
      toast.error("Dispatch proof photo is required before marking shipped");
      return;
    }

    setLoading(nextStatus);
    try {
      let res: Response;

      if (nextStatus === "SHIPPED") {
        const formData = new FormData();
        formData.append("status", nextStatus);
        if (dispatchProofFile) {
          formData.append("proofImage", dispatchProofFile);
        }

        res = await fetch(`/api/provider/orders/${order.id}/status`, {
          method: "PATCH",
          body: formData,
        });
      } else {
        res = await fetch(`/api/provider/orders/${order.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Status update failed");
        return;
      }
      setOrder((prev) => ({
        ...prev,
        status: data.order.status,
        rentalStartDate: data.order.rentalStartDate,
        rentalEndDate: data.order.rentalEndDate,
        expectedReturnDate: data.order.expectedReturnDate,
        acceptedAt: data.order.acceptedAt,
        shippedAt: data.order.shippedAt,
        pickedUpFromProviderAt: data.order.pickedUpFromProviderAt,
        deliveredToCustomerAt: data.order.deliveredToCustomerAt,
        pickedUpFromCustomerAt: data.order.pickedUpFromCustomerAt,
        returnedToProviderAt: data.order.returnedToProviderAt,
        completedAt: data.order.completedAt,
        cancelledAt: data.order.cancelledAt,
      }));
      if (nextStatus === "SHIPPED") {
        setDispatchProofFile(null);
      }
      toast.success(`Order moved to "${orderStatusLabel(data.order.status)}"`);
    } catch {
      toast.error("Unable to update order status");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-white p-6 shadow-sm">
      {/* ── Header row ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
            <Image
              src={listingImage}
              alt={order.listing.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">{order.listing.title}</p>
            <p className="text-sm text-muted-foreground">
              Size <span className="font-medium text-foreground">{order.listing.size}</span>
              {" · "}
              {order.listing.category}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.quantity} item{order.quantity === 1 ? "" : "s"} · Ordered{" "}
              <span className="font-medium text-foreground">{formatDate(order.createdAt)}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={statusBadgeVariant(order.status)} className="px-3 py-1 text-sm">
            {orderStatusLabel(order.status)}
          </Badge>
          <span className="text-lg font-bold text-foreground">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(order.total)}
          </span>
        </div>
      </div>

      {/* ── Customer & Delivery info ── */}
      <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
          <p className="text-sm font-medium text-foreground">
            {order.user.name || order.user.email}
          </p>
          <p className="text-sm text-muted-foreground">{order.user.phone || order.user.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Address</p>
          {order.deliveryName ? (
            <p className="text-sm font-medium text-foreground">{order.deliveryName}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {customerAddress || "Address not provided"}
          </p>
        </div>
      </div>

      {order.status !== "CANCELLED" ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-fit">
              View Full Timeline
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
            <div className="sticky top-0 z-10 border-b border-border/70 bg-background/95 px-6 py-4 backdrop-blur">
              <div className="mb-3">
                <SheetClose asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                </SheetClose>
              </div>
              <SheetHeader className="space-y-1 text-left">
                <SheetTitle>Provider Fulfillment Timeline</SheetTitle>
                <SheetDescription>
                  {order.listing.title} • {orderStatusLabel(order.status)}
                </SheetDescription>
              </SheetHeader>
            </div>
            <div className="px-6 py-6">
              <RentalTimeline
                createdAt={order.createdAt}
                rentalStartDate={order.rentalStartDate}
                rentalEndDate={order.rentalEndDate}
                expectedReturnDate={order.expectedReturnDate}
                acceptedAt={order.acceptedAt}
                shippedAt={order.shippedAt}
                pickedUpFromProviderAt={order.pickedUpFromProviderAt}
                deliveredToCustomerAt={order.deliveredToCustomerAt}
                pickedUpFromCustomerAt={order.pickedUpFromCustomerAt}
                returnedToProviderAt={order.returnedToProviderAt}
                completedAt={order.completedAt}
                status={order.status}
                deliveryTaskStage={order.deliveryTaskStage}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      {order.status === "SHIPPED" && (
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {order.deliveryTaskStage === "DELIVERED_TO_CUSTOMER"
            ? "Rider reached customer. Waiting for customer accept/decline decision from My Orders."
            : "Waiting for delivery partner: pickup confirmation and doorstep handover."}
        </p>
      )}
      {order.status === "WITH_CUSTOMER" && (
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Item is with customer. Waiting for return updates from delivery partner.
        </p>
      )}
      {order.status === "RETURNED" && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Item returned. Please inspect condition and close the order.
        </p>
      )}

      {order.status === "ACCEPTED" ? (
        <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Dispatch Proof</p>
          <p className="mb-2 text-sm text-muted-foreground">Required before marking as Shipped</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm"
            onChange={(e) => setDispatchProofFile(e.target.files?.[0] ?? null)}
          />
          {dispatchProofFile ? (
            <p className="mt-2 text-sm text-green-700">✓ {dispatchProofFile.name}</p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/60 bg-muted/10 px-4 py-3">
        {availableUnits > 0 ? (
          <p className="text-sm text-green-700">
            <span className="font-semibold">Available for new orders</span> — {availableUnits} unit{availableUnits === 1 ? "" : "s"} free
          </p>
        ) : (
          <p className="text-sm text-amber-700">
            <span className="font-semibold">Not available</span> for new orders
            {order.availability.nextAvailableAt ? (
              <> · likely free from{" "}
                <span className="font-semibold">{formatDate(order.availability.nextAvailableAt)}</span>
              </>
            ) : null}
          </p>
        )}
      </div>

      {/* ── Action buttons ── */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-1">
          {actions.map((action) => (
            <Button
              key={action.nextStatus}
              variant={action.variant}
              disabled={loading !== null}
              onClick={() => handleAction(action.nextStatus)}
            >
              {loading === action.nextStatus ? "Updating…" : action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrdersList({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    const intervalId = window.setInterval(() => {
      refresh();
    }, 30000);

    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-base text-muted-foreground">No orders yet. Once shoppers book your items, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
