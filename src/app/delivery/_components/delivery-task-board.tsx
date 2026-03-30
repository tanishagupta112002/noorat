"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DELIVERY_TASK_NEXT_STAGE, stageLabel } from "@/lib/delivery-workflow";

type DeliveryTaskRow = {
  id: string;
  stage: string;
  notes: string | null;
  order: {
    id: string;
    status: string;
    createdAt: string;
    acceptedAt: string | null;
    shippedAt: string | null;
    pickedUpFromProviderAt: string | null;
    deliveredToCustomerAt: string | null;
    pickedUpFromCustomerAt: string | null;
    returnedToProviderAt: string | null;
    rentalStartDate: string | null;
    rentalEndDate: string | null;
    expectedReturnDate: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    deliveryName: string | null;
    deliveryAddressLine: string | null;
    deliveryCity: string | null;
    deliveryState: string | null;
    deliveryPincode: string | null;
    listing: {
      title: string;
      size: string;
      category: string;
    };
    user: {
      name: string | null;
      email: string;
      phone: string | null;
    };
    provider: {
      businessName: string | null;
      phone: string;
      address: string | null;
      city: string | null;
      state: string | null;
      pincode: string | null;
    };
  };
};

type UpdatedOrderPayload = {
  status: string;
  acceptedAt: string | null;
  shippedAt: string | null;
  pickedUpFromProviderAt: string | null;
  deliveredToCustomerAt: string | null;
  pickedUpFromCustomerAt: string | null;
  returnedToProviderAt: string | null;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  expectedReturnDate: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function addDaysIso(iso: string | null, days: number) {
  if (!iso) return null;
  const next = new Date(iso);
  next.setDate(next.getDate() + days);
  return next.toISOString();
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

function formatAddress(parts: Array<string | null | undefined>) {
  const value = parts.filter(Boolean).join(", ");
  return value || "Not available";
}

function stageBadgeVariant(stage: string): "default" | "secondary" | "destructive" | "outline" {
  if (stage === "CLOSED") return "default";
  return "outline";
}

function orderStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "CANCELLED") return "destructive";
  if (status === "COMPLETED") return "default";
  return "secondary";
}

function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    SHIPPED: "Dispatched",
    WITH_CUSTOMER: "With Customer",
    RETURNED: "Returned",
    COMPLETED: "Completed",
    CANCELLED: "Order Cancelled",
  };
  return labels[status] ?? status;
}

function DeliveryTimeline({ task }: { task: DeliveryTaskRow }) {
  const dispatchExpectedAt = addDaysIso(task.order.createdAt, 1);
  const pickupExpectedAt = addDaysIso(task.order.createdAt, 1);
  const returnPickupExpectedAt = addDaysIso(task.order.rentalEndDate, 1);
  const doorstepReached =
    task.stage === "DELIVERED_TO_CUSTOMER" ||
    ["PICKED_UP_FROM_CUSTOMER", "DELIVERED_TO_PROVIDER", "CLOSED"].includes(task.stage);

  const steps = [
    {
      label: "Order created",
      actualDate: task.order.createdAt,
      expectedDate: task.order.createdAt,
      done: true,
    },
    {
      label: "Provider accepted order",
      actualDate: task.order.acceptedAt,
      expectedDate: task.order.createdAt,
      done: ["ACCEPTED", "SHIPPED", "WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(task.order.status),
    },
    {
      label: "Provider dispatched package",
      actualDate: task.order.shippedAt,
      expectedDate: dispatchExpectedAt,
      done: ["SHIPPED", "WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(task.order.status),
    },
    {
      label: "You picked up from provider",
      actualDate: task.order.pickedUpFromProviderAt,
      expectedDate: pickupExpectedAt,
      done: Boolean(task.order.pickedUpFromProviderAt || task.order.deliveredToCustomerAt || task.order.returnedToProviderAt || task.order.completedAt),
    },
    {
      label: "You reached customer doorstep",
      actualDate: doorstepReached ? task.order.deliveredToCustomerAt : null,
      expectedDate: task.order.rentalStartDate,
      done: doorstepReached,
    },
    {
      label: "Customer accepted order",
      actualDate: task.order.deliveredToCustomerAt,
      expectedDate: task.order.rentalStartDate,
      done: ["WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(task.order.status),
    },
    {
      label: "Customer rental period ended",
      actualDate: task.order.pickedUpFromCustomerAt,
      expectedDate: task.order.rentalEndDate,
      done: Boolean(task.order.pickedUpFromCustomerAt || task.order.returnedToProviderAt || task.order.completedAt),
    },
    {
      label: "You picked up return from customer",
      actualDate: task.order.pickedUpFromCustomerAt,
      expectedDate: returnPickupExpectedAt,
      done: Boolean(task.order.pickedUpFromCustomerAt || task.order.returnedToProviderAt || task.order.completedAt),
    },
    {
      label: "You returned item to provider",
      actualDate: task.order.returnedToProviderAt,
      expectedDate: task.order.expectedReturnDate,
      done: ["RETURNED", "COMPLETED"].includes(task.order.status),
    },
    {
      label: "Provider completed inspection & settlement",
      actualDate: task.order.completedAt,
      expectedDate: task.order.expectedReturnDate,
      done: task.order.status === "COMPLETED",
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
              actualDate: step.actualDate,
              expectedDate: step.expectedDate,
              done: step.done,
            })}
          </p>
        </li>
      ))}
    </ol>
  );
}

function TaskCard({
  task,
  onUpdated,
}: {
  task: DeliveryTaskRow;
  onUpdated: (nextStage: string, nextOrder?: UpdatedOrderPayload | null) => void;
}) {
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [loading, setLoading] = useState(false);

  const nextStage = DELIVERY_TASK_NEXT_STAGE[task.stage];
  const isCancelled = task.order.status === "CANCELLED";
  const waitingForCustomerDecision =
    task.stage === "DELIVERED_TO_CUSTOMER" &&
    task.order.status === "SHIPPED" &&
    !task.order.deliveredToCustomerAt;

  const handleAdvance = async () => {
    if (!nextStage || loading) return;

    if (!proofImage) {
      toast.error("Proof photo is required for this update");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("notes", notes);
      if (proofImage) {
        formData.append("proofImage", proofImage);
      }

      const res = await fetch(`/api/delivery/tasks/${task.id}/stage`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Could not update delivery task");
        return;
      }

      onUpdated(data.task.stage, data.order ?? null);
      setProofImage(null);
      toast.success(`Task moved to ${stageLabel(data.task.stage)}`);
    } catch {
      toast.error("Unable to update task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border bg-white p-6 shadow-sm ${
      isCancelled ? "border-red-200" : "border-border/70"
    }`}>
      {/* ── Cancelled banner ── */}
      {isCancelled ? (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">Order Cancelled</p>
          <p className="mt-0.5 text-sm text-red-600">This order has been cancelled. No further delivery action is required.</p>
        </div>
      ) : null}

      {waitingForCustomerDecision ? (
        <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3">
          <p className="text-sm font-semibold text-blue-700">Waiting for customer decision</p>
          <p className="mt-0.5 text-sm text-blue-600">
            Ask customer to Accept or Decline this order from My Orders. You can continue only after acceptance.
          </p>
        </div>
      ) : null}

      {/* ── Title + Stage badges ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">{task.order.listing.title}</p>
          <p className="text-sm text-muted-foreground">
            Size <span className="font-medium text-foreground">{task.order.listing.size}</span>
            {" · "}
            {task.order.listing.category}
            {" · "}
            Ordered {formatDate(task.order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isCancelled ? (
            <Badge variant="destructive" className="px-3 py-1 text-sm">
              Order Cancelled
            </Badge>
          ) : (
            <Badge variant={orderStatusBadgeVariant(task.order.status)} className="px-3 py-1 text-sm">
              {orderStatusLabel(task.order.status)}
            </Badge>
          )}
          <Badge variant={stageBadgeVariant(task.stage)} className="px-3 py-1 text-sm">
            {stageLabel(task.stage)}
          </Badge>
        </div>
      </div>

      {/* ── Customer & Provider info ── */}
      <div className="mt-4 grid gap-4 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
          <p className="text-sm font-medium text-foreground">
            {task.order.user.name || task.order.user.email}
          </p>
          <p className="text-sm text-muted-foreground">
            {task.order.user.phone || task.order.user.email}
          </p>
          {task.order.deliveryName ? (
            <p className="text-sm text-muted-foreground">Deliver to: {task.order.deliveryName}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {formatAddress([
              task.order.deliveryAddressLine,
              task.order.deliveryCity,
              task.order.deliveryState,
              task.order.deliveryPincode,
            ])}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider Pickup / Drop</p>
          <p className="text-sm font-medium text-foreground">
            {task.order.provider.businessName || "Provider"}
          </p>
          <p className="text-sm text-muted-foreground">{task.order.provider.phone}</p>
          <p className="text-sm text-muted-foreground">
            {formatAddress([
              task.order.provider.address,
              task.order.provider.city,
              task.order.provider.state,
              task.order.provider.pincode,
            ])}
          </p>
        </div>
      </div>

      {!isCancelled ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="mt-4 w-fit">
              Open Delivery Timeline
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
                <SheetTitle>Your Delivery Timeline</SheetTitle>
                <SheetDescription>
                  {task.order.listing.title} • {orderStatusLabel(task.order.status)}
                </SheetDescription>
              </SheetHeader>
            </div>
            <div className="px-6 py-6">
              <DeliveryTimeline task={task} />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      {/* ── Next step action ── */}
      {!isCancelled && nextStage && !waitingForCustomerDecision ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
          <p className="text-sm font-semibold text-foreground">
            Next step:{" "}
            <span className="text-primary">{stageLabel(nextStage)}</span>
          </p>
          <div className="space-y-2">
            <label className="block text-sm text-muted-foreground">Upload proof photo</label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm"
              onChange={(e) => setProofImage(e.target.files?.[0] ?? null)}
            />
            {proofImage ? (
              <p className="text-sm text-green-700">✓ {proofImage.name}</p>
            ) : null}
          </div>
          <Input
            placeholder="Add notes (optional)"
            value={notes}
            className="text-sm"
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button disabled={loading} onClick={handleAdvance}>
            {loading ? "Updating..." : `Mark as ${stageLabel(nextStage)}`}
          </Button>
        </div>
      ) : !isCancelled && !waitingForCustomerDecision ? (
        <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-700">✓ Task completed</p>
        </div>
      ) : null}
    </div>
  );
}

export function DeliveryTaskBoard({ tasks }: { tasks: DeliveryTaskRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(tasks);

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

  const updateTaskStage = (
    taskId: string,
    nextStage: string,
    nextOrder?: UpdatedOrderPayload | null,
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== taskId) return row;
        return {
          ...row,
          stage: nextStage,
          order: nextOrder
            ? {
                ...row.order,
                status: nextOrder.status,
                acceptedAt: nextOrder.acceptedAt,
                shippedAt: nextOrder.shippedAt,
                pickedUpFromProviderAt: nextOrder.pickedUpFromProviderAt,
                deliveredToCustomerAt: nextOrder.deliveredToCustomerAt,
                pickedUpFromCustomerAt: nextOrder.pickedUpFromCustomerAt,
                returnedToProviderAt: nextOrder.returnedToProviderAt,
                rentalStartDate: nextOrder.rentalStartDate,
                rentalEndDate: nextOrder.rentalEndDate,
                expectedReturnDate: nextOrder.expectedReturnDate,
                completedAt: nextOrder.completedAt,
                cancelledAt: nextOrder.cancelledAt,
              }
            : row.order,
        };
      }),
    );
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <p className="text-base text-muted-foreground">No delivery tasks assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdated={(next, nextOrder) => updateTaskStage(task.id, next, nextOrder)}
        />
      ))}
    </div>
  );
}
