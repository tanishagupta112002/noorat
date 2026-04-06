import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/server-timeout";
import { OrderReviewPanel } from "../../_components/order-review-panel";
import { OrderDecisionActions } from "../../_components/order-decision-actions";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function addDays(date: Date | null, days: number) {
  if (!date) return null;
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

function formatTimelineDate({
  actualDate,
  expectedDate,
  done,
}: {
  actualDate?: Date | null;
  expectedDate?: Date | null;
  done: boolean;
}) {
  if (actualDate) return formatDate(actualDate);
  if (!done && expectedDate) return `Expected ${formatDate(expectedDate)}`;
  if (done && expectedDate) return formatDate(expectedDate);
  return "-";
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderItemPage({ params }: PageProps) {
  const requestHeaders = await headers();
  const session = (await withTimeout(
    auth.api.getSession({ headers: requestHeaders }),
    8000,
    "Dashboard session lookup"
  )) as any;

  if (!session?.user?.id) {
    redirect("/auth?mode=signup&redirect=/orders");
  }

  const { id } = await params;
  const reviewerEmail = session.user.email ?? "";

  const order = await withTimeout(prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      quantity: true,
      total: true,
      status: true,
      createdAt: true,
      acceptedAt: true,
      shippedAt: true,
      pickedUpFromProviderAt: true,
      deliveredToCustomerAt: true,
      pickedUpFromCustomerAt: true,
      returnedToProviderAt: true,
      rentalStartDate: true,
      rentalEndDate: true,
      expectedReturnDate: true,
      completedAt: true,
      cancelledAt: true,
      deliveryTask: {
        select: {
          stage: true,
          notes: true,
          deliveryPartner: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },
      },
      deliveryName: true,
      deliveryAddressLine: true,
      deliveryCity: true,
      deliveryState: true,
      deliveryPincode: true,
      listing: {
        select: {
          id: true,
          title: true,
          size: true,
          category: true,
          images: true,
        },
      },
      provider: {
        select: {
          businessName: true,
        },
      },
    },
  }), 12000, "Order details query");

  if (!order) {
    notFound();
  }

  if (order.userId !== session.user.id) {
    notFound();
  }

  const alreadyReviewed = reviewerEmail
    ? Boolean(
        await withTimeout(prisma.listingReview.findFirst({
          where: {
            listingId: order.listing.id,
            reviewerEmail,
            createdAt: {
              gte: order.createdAt,
            },
          },
          select: {
            id: true,
          },
        }), 10000, "Order review lookup")
      )
    : false;

  const isDoorstepDeclined = Boolean(
    order.status === "CANCELLED" &&
      order.deliveryTask?.notes?.includes("Customer declined order at doorstep."),
  );

  const canWriteReview = Boolean(
    order.deliveryTask?.stage === "DELIVERED_TO_CUSTOMER" ||
      order.deliveredToCustomerAt ||
    ["WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(order.status) ||
    isDoorstepDeclined,
  );

  const dispatchExpectedAt = addDays(order.createdAt, 1);
  const pickupExpectedAt = addDays(order.createdAt, 1);
  const returnPickupExpectedAt = addDays(order.rentalEndDate, 1);
  const primaryImage = order.listing.images[0] || "/images/image.png";
  const deliveryAddress = [
    order.deliveryAddressLine,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryPincode,
  ]
    .filter(Boolean)
    .join(", ");

  const steps = [
    {
      label: "You placed order",
      actualDate: order.createdAt,
      expectedDate: order.createdAt,
      done: true,
    },
    {
      label: "Provider accepted your order",
      actualDate: order.acceptedAt,
      expectedDate: order.createdAt,
      done: ["ACCEPTED", "SHIPPED", "WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(order.status),
    },
    {
      label: "Provider dispatched your item",
      actualDate: order.shippedAt,
      expectedDate: dispatchExpectedAt,
      done: ["SHIPPED", "WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(order.status),
    },
    {
      label: "Delivery partner picked up your item",
      actualDate: order.pickedUpFromProviderAt,
      expectedDate: pickupExpectedAt,
      done: Boolean(order.pickedUpFromProviderAt || order.deliveredToCustomerAt || order.returnedToProviderAt || order.completedAt),
    },
    {
      label: "You accepted order at doorstep",
      actualDate: order.deliveredToCustomerAt,
      expectedDate: order.rentalStartDate,
      done: ["WITH_CUSTOMER", "RETURNED", "COMPLETED"].includes(order.status),
    },
    {
      label: "Your rental period ended",
      actualDate: order.pickedUpFromCustomerAt,
      expectedDate: order.rentalEndDate,
      done: Boolean(order.pickedUpFromCustomerAt || order.returnedToProviderAt || order.completedAt),
    },
    {
      label: "Delivery partner picked up return",
      actualDate: order.pickedUpFromCustomerAt,
      expectedDate: returnPickupExpectedAt,
      done: Boolean(order.pickedUpFromCustomerAt || order.returnedToProviderAt || order.completedAt),
    },
    {
      label: "Item returned to provider",
      actualDate: order.returnedToProviderAt,
      expectedDate: order.expectedReturnDate,
      done: ["RETURNED", "COMPLETED"].includes(order.status),
    },
    {
      label: "Provider completed inspection & settlement",
      actualDate: order.completedAt,
      expectedDate: order.expectedReturnDate,
      done: order.status === "COMPLETED",
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Order Details</h1>
          <p className="mt-2 text-muted-foreground">Track this order, rental timeline, and review status.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <section className="rounded-sm border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
              <div className="relative aspect-[0.75] overflow-hidden rounded-md bg-white">
                <Image src={primaryImage} alt={order.listing.title} fill className="object-contain p-1" sizes="(max-width: 640px) 88px, 120px" />
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                    {order.provider.businessName || "noorat Partner"}
                  </p>
                  <span className="rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-semibold text-foreground">
                    {orderStatusLabel(order.status)}
                  </span>
                </div>

                <Link href={`/rentals/item/${order.listing.id}`} className="block text-base font-semibold text-foreground transition hover:text-primary sm:text-lg">
                  {order.listing.title}
                </Link>

                <p className="text-sm text-muted-foreground">
                  Size {order.listing.size} · {order.listing.category} · Qty {order.quantity}
                </p>

                <div className="grid gap-3 border-t border-border pt-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Placed on</p>
                    <p className="mt-1 font-medium text-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
                    <p className="mt-1 font-medium text-foreground">Rs. {formatPrice(order.total)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Delivery address</p>
                    <p className="mt-1 font-medium text-foreground">{order.deliveryName || "Customer"}</p>
                    <p className="mt-1 wrap-break-word text-muted-foreground">{deliveryAddress || "Address not available"}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <h2 className="text-base font-semibold text-foreground">Rental Timeline</h2>
            <div className="mt-5">
              <ol className="space-y-5">
                {steps.map((step, index) => (
                  <li key={`${step.label}-${index}`} className="relative pl-9">
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
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <OrderDecisionActions
            orderId={order.id}
            status={order.status}
            deliveredToCustomerAt={order.deliveredToCustomerAt?.toISOString() ?? null}
            deliveryTaskStage={order.deliveryTask?.stage ?? null}
          />

          {canWriteReview ? (
            <section>
              <OrderReviewPanel
                listingId={order.listing.id}
                orderId={order.id}
                listingTitle={order.listing.title}
                alreadyReviewed={alreadyReviewed}
              />
            </section>
          ) : (
            <section className="rounded-sm border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <h2 className="text-base font-semibold text-foreground">Review</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Review will be available once rider reaches your doorstep, including doorstep decline.
              </p>
            </section>
          )}

          <section className="rounded-sm border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <h2 className="text-base font-semibold text-foreground">Order Snapshot</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Order ID</span>
                <span className="break-all text-right font-medium text-foreground">{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Rental Start</span>
                <span className="font-medium text-foreground">{formatDate(order.rentalStartDate)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Rental End</span>
                <span className="font-medium text-foreground">{formatDate(order.rentalEndDate)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Delivery Partner</span>
                <span className="font-medium text-foreground">{order.deliveryTask?.deliveryPartner?.fullName || "Not assigned"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Delivery Partner Phone</span>
                <span className="font-medium text-foreground">{order.deliveryTask?.deliveryPartner?.phone || "Will appear after assignment"}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
