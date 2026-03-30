import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { OrderRow } from "./orders-list";
import { orderStatusLabel } from "@/lib/rental-helpers";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "COMPLETED") return "default";
  if (status === "CANCELLED") return "destructive";
  if (["ACCEPTED", "SHIPPED", "WITH_CUSTOMER", "RETURNED"].includes(status)) return "outline";
  return "secondary";
}

export function OrdersSummaryList({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-base text-muted-foreground">
          No orders yet. Once shoppers book your items, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const listingImage = order.listing.images?.[0] || "/images/image.png";
        return (
          <article key={order.id} className="rounded-3xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-4">
              <Link
                href={`/provider/orders/item/${order.id}`}
                className="relative block aspect-[0.75] overflow-hidden rounded-xl border border-border/60 bg-muted/20"
              >
                <Image src={listingImage} alt={order.listing.title} fill className="object-cover" sizes="96px" />
              </Link>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground sm:text-base">{order.listing.title}</p>
                  <Badge variant={statusVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
                </div>

                <p className="text-xs text-muted-foreground sm:text-sm">
                  {order.user.name || order.user.email} · Qty {order.quantity} · Ordered {formatDate(order.createdAt)}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2">
                  <p className="text-sm font-semibold text-foreground">Rs. {formatPrice(order.total)}</p>
                  <Link
                    href={`/provider/orders/item/${order.id}`}
                    className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/40"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
