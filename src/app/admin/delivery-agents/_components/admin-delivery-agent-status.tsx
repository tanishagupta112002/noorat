"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AdminDeliveryAgentStatusButton({
  deliveryPartnerId,
  status,
}: {
  deliveryPartnerId: string;
  status: "ACTIVE" | "SUSPENDED";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const nextStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  const handleClick = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/delivery/partners/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryPartnerId,
          status: nextStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Unable to update status");
        return;
      }

      toast.success(data.message || "Status updated");
      router.refresh();
    } catch {
      toast.error("Unable to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
    >
      {loading ? "Updating..." : status === "ACTIVE" ? "Suspend" : "Activate"}
    </button>
  );
}
