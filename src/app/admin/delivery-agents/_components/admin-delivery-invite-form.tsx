"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AdminDeliveryInviteForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

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

      toast.success("Delivery invite generated successfully");
      setFullName("");
      setEmail("");
      setPhone("");
      router.refresh();
    } catch {
      toast.error("Could not generate invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="font-semibold">Create Delivery Invite</h2>
      <p className="text-xs text-muted-foreground">
        Phone is mandatory so customer can contact delivery agent during handover.
      </p>
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
        placeholder="Phone"
        className="w-full rounded-md border px-3 py-2"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button className="rounded-md bg-black px-4 py-2 text-white" type="submit" disabled={loading}>
        {loading ? "Generating..." : "Generate Invite"}
      </button>
    </form>
  );
}
