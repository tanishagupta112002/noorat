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

type OrderOption = {
  id: string;
  status: string;
  listing: { title: string };
  user: { name: string | null; email: string };
};

export function AdminDeliveryActions({
  partners,
  orders,
}: {
  partners: PartnerOption[];
  orders: OrderOption[];
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [deliveryPartnerId, setDeliveryPartnerId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const handleCreateInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Could not generate invite");
        return;
      }

      toast.success("Invite generated successfully");
      setFullName("");
      setEmail("");
      setPhone("");
      router.refresh();
    } catch {
      toast.error("Could not generate invite");
    } finally {
      setInviteLoading(false);
    }
  };

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

      window.alert("Delivery assigned successfully");
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
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={handleCreateInvite} className="space-y-3 rounded-2xl border bg-white p-4">
        <h2 className="font-semibold">Create Invite</h2>
        <input
          name="fullName"
          placeholder="Full name"
          className="w-full rounded-md border px-3 py-2"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          name="email"
          placeholder="Email"
          type="email"
          className="w-full rounded-md border px-3 py-2"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          name="phone"
          placeholder="Phone (optional)"
          className="w-full rounded-md border px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className="rounded-md bg-black px-4 py-2 text-white" type="submit" disabled={inviteLoading}>
          {inviteLoading ? "Generating..." : "Generate Invite"}
        </button>
      </form>

      <form onSubmit={handleAssignOrder} className="relative z-10 space-y-3 overflow-visible rounded-2xl border bg-white p-4">
        <h2 className="font-semibold">Assign Order</h2>
        <CustomSelect
          name="orderId"
          required
          value={orderId}
          onValueChange={setOrderId}
          options={[
            { value: "", label: "Select order" },
            ...orders.map((order) => ({
              value: order.id,
              label: `${order.listing.title} — ${order.user.name || order.user.email} (${order.status})`,
            })),
          ]}
        />
        {orders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No accepted unassigned orders available right now.</p>
        ) : null}
        <CustomSelect
          name="deliveryPartnerId"
          required
          value={deliveryPartnerId}
          onValueChange={setDeliveryPartnerId}
          options={[
            { value: "", label: "Select delivery partner" },
            ...partners.map((partner) => ({
              value: partner.id,
              label: `${partner.employeeCode} — ${partner.fullName || partner.email}`,
            })),
          ]}
        />
        {partners.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active delivery partners available.</p>
        ) : null}
        <button className="rounded-md bg-black px-4 py-2 text-white" type="submit" disabled={assignLoading}>
          {assignLoading ? "Assigning..." : "Assign Delivery"}
        </button>
      </form>
    </div>
  );
}
