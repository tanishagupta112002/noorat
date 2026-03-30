import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-auth";
import { AdminDeliveryAgentStatusButton } from "./_components/admin-delivery-agent-status";
import { AdminDeliveryInviteForm } from "./_components/admin-delivery-invite-form";

export default async function AdminDeliveryAgentsPage() {
  const db = prisma as any;
  await requireAdminUser();

  const [partners, latestInvites, inviteTokens, openTasksCount] = await Promise.all([
    db.deliveryPartnerProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    }),
    db.deliveryPartnerInvite.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        fullName: true,
        email: true,
        usedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    db.verification.findMany({
      where: { identifier: { startsWith: "delivery_invite:" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        identifier: true,
        value: true,
      },
    }),
    db.deliveryTask.count({ where: { stage: { not: "CLOSED" } } }),
  ]);

  const tokenMap = new Map<string, string>();
  for (const row of inviteTokens) {
    tokenMap.set(row.identifier.replace("delivery_invite:", ""), row.value);
  }

  const activePartners = partners.filter((partner: any) => partner.status === "ACTIVE");
  const suspendedPartners = partners.filter((partner: any) => partner.status === "SUSPENDED");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Delivery Operations Panel</h1>
        <p className="text-sm text-muted-foreground">
          Manage delivery agents and invite onboarding.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total Agents</p>
          <p className="mt-2 text-2xl font-semibold">{partners.length}</p>
        </article>
        <article className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Active Agents</p>
          <p className="mt-2 text-2xl font-semibold">{activePartners.length}</p>
        </article>
        <article className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Suspended Agents</p>
          <p className="mt-2 text-2xl font-semibold">{suspendedPartners.length}</p>
        </article>
        <article className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Open Delivery Tasks</p>
          <p className="mt-2 text-2xl font-semibold">{openTasksCount}</p>
        </article>
      </section>

      <AdminDeliveryInviteForm />

      <div className="grid gap-2 text-sm sm:grid-cols-1">
        <Link href="/admin/order-assign" className="rounded-xl border bg-white px-4 py-3 font-medium shadow-sm hover:bg-muted/30">
          Assign/reassign orders from Order Assign
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Delivery Partners</h2>
          <p className="text-xs text-muted-foreground">Active and suspended delivery agents with workload snapshot.</p>
        </div>
        <table className="min-w-225 w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total Tasks</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner: any) => (
              <tr key={partner.id} className="border-t">
                <td className="px-4 py-3 font-medium text-foreground">{partner.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{partner.employeeCode}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p>{partner.email}</p>
                  <p className="text-xs">{partner.phone || "No phone"}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${partner.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {partner.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{partner._count.tasks}</td>
                <td className="px-4 py-3 text-muted-foreground">{partner.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <AdminDeliveryAgentStatusButton deliveryPartnerId={partner.id} status={partner.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="font-semibold">Latest Invites</h2>
        <div className="mt-3 space-y-2 text-sm">
          {latestInvites.map((invite) => (
            <div key={invite.id} className="rounded-lg border p-3">
              <p className="font-medium">{invite.fullName} ({invite.email})</p>
              <p className="text-xs text-muted-foreground">
                Status: {invite.usedAt ? "Registered" : invite.expiresAt < new Date() ? "Expired" : "Pending"}
              </p>
              {!invite.usedAt ? (
                <p className="mt-1 text-xs text-foreground">
                  Invite code: <span className="font-semibold">{tokenMap.get(invite.id) || "Unavailable"}</span>
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">Created on {invite.createdAt.toLocaleDateString("en-IN")}.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
