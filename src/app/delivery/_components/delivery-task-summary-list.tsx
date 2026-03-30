import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { stageLabel } from "@/lib/delivery-workflow";

type DeliveryTaskRow = {
  id: string;
  stage: string;
  notes: string | null;
  order: {
    id: string;
    status: string;
    createdAt: string;
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
  };
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
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

export function DeliveryTaskSummaryList({ tasks }: { tasks: DeliveryTaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <p className="text-base text-muted-foreground">No delivery tasks assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <article key={task.id} className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="line-clamp-1 text-sm font-semibold text-foreground sm:text-base">{task.order.listing.title}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{stageLabel(task.stage)}</Badge>
                <Badge variant={task.order.status === "CANCELLED" ? "destructive" : "secondary"}>
                  {orderStatusLabel(task.order.status)}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground sm:text-sm">
              {task.order.user.name || task.order.user.email} · Ordered {formatDate(task.order.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Size {task.order.listing.size} · {task.order.listing.category}
            </p>

            {task.stage === "DELIVERED_TO_CUSTOMER" && task.order.status === "SHIPPED" ? (
              <p className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700 sm:text-sm">
                Waiting for customer accept/decline confirmation.
              </p>
            ) : null}

            <div className="flex justify-end border-t border-border/70 pt-2">
              <Link
                href={`/delivery/dashboard/item/${task.id}`}
                className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/40"
              >
                View Details
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
