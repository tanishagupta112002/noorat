import { requireAdminUser } from "@/lib/admin-auth";
import { AdminNav } from "./_components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminUser();

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Noorat Admin Console
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Operations Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage orders, delivery assignments, and partner operations from one place.
              </p>
            </div>
            <div className="rounded-xl border bg-muted/50 px-3 py-2 text-right text-xs text-muted-foreground">
              <p>Signed in as admin</p>
              <p className="font-medium text-foreground">{admin.name || admin.email}</p>
            </div>
          </div>
          <div className="mt-5">
            <AdminNav />
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
