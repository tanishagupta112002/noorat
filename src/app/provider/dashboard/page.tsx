import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Clock3,
  CreditCard,
  MapPin,
  Package2,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  BadgeIndianRupee,
  ChevronRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function valueOrFallback(
  value: string | null | undefined,
  fallback = "Not set",
) {
  return value?.trim() ? value : fallback;
}

function getOrderBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "PENDING":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function ProviderDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/auth?redirect=/provider/dashboard");
  }

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      businessName: true,
      providerType: true,
      profilePhoto: true,
      description: true,
      phone: true,
      alternate_phone: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankIfsc: true,
      panNumber: true,
      idDocument: true,
      createdAt: true,
    },
  });

  if (!profile) {
    redirect("/become-a-provider/onboarding");
  }

  const providerId = profile.id;
  const storeName = profile.businessName || session.user.name || "Your store";

  // Get listing IDs first for review count
  const providerListingIds = await prisma.listing
    .findMany({
      where: { providerId },
      select: { id: true },
    })
    .then((listings) => listings.map((l) => l.id));

  const [
    totalListings,
    activeListings,
    totalOrders,
    openOrders,
    grossValue,
    recentListings,
    recentOrders,
    user,
    totalReviews,
  ] = await Promise.all([
    prisma.listing.count({ where: { providerId } }),
    prisma.listing.count({ where: { providerId, status: true } }),
    prisma.order.count({ where: { providerId } }),
    prisma.order.count({
      where: {
        providerId,
        status: { in: ["PENDING", "ACCEPTED", "SHIPPED"] },
      },
    }),
    prisma.order.aggregate({
      where: {
        providerId,
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    }),
    prisma.listing.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        size: true,
        images: true,
        price: true,
        category: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        total: true,
        status: true,
        quantity: true,
        createdAt: true,
        listing: {
          select: {
            title: true,
            size: true,
            category: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        dob: true,
        createdAt: true,
      },
    }),
    prisma.listingReview.count({
      where: {
        listingId: { in: providerListingIds },
      },
    }),
  ]);

  const totalValue = grossValue._sum.total ?? 0;
  const estimatedPayout = totalValue * 0.9;
  const maskedAccountNumber = profile.bankAccountNumber
    ? `•••• ${profile.bankAccountNumber.slice(-4)}`
    : "Not set";
  const quickActions = [
    {
      href: "/provider/inventory",
      label: "Manage store",
      meta: `${totalListings} listings`,
      icon: Boxes,
    },
    {
      href: "/provider/orders",
      label: "Open orders",
      meta: `${openOrders} pending`,
      icon: Clock3,
    },
    {
      href: "/provider/sells",
      label: "Sells",
      meta: `${totalOrders} all-time`,
      icon: BadgeIndianRupee,
    },
    {
      href: "/provider/payments",
      label: "Payment summary",
      meta: formatCurrency(estimatedPayout),
      icon: CreditCard,
    },
    {
      href: "/provider/reviews",
      label: "Reviews",
      meta: `${totalReviews} ratings`,
      icon: Star,
    },
    {
      href: "/provider/profile",
      label: "Profile",
      meta: "Update store details",
      icon: ShieldCheck,
    },
  ];
  const overviewCards = [
    {
      label: "Total listings",
      value: String(totalListings),
      meta: `${activeListings} active`,
      icon: Package2,
    },
    {
      label: "Open orders",
      value: String(openOrders),
      meta: "Awaiting fulfilment",
      icon: Clock3,
    },
    {
      label: "Gross value",
      value: formatCurrency(totalValue),
      meta: "Non-cancelled sales",
      icon: CircleDollarSign,
    },
    {
      label: "All orders",
      value: String(totalOrders),
      meta: "All-time purchases",
      icon: TrendingUp,
    },
  ];
  const checklistItems = [
    {
      label: "Description added",
      complete: Boolean(profile.description?.trim()),
      completeLabel: "Done",
      pendingLabel: "Pending",
    },
    {
      label: "KYC verification",
      complete: Boolean(profile.panNumber && profile.idDocument),
      completeLabel: "Complete",
      pendingLabel: "Needs action",
    },
    {
      label: "Payout details",
      complete: Boolean(profile.bankAccountNumber && profile.bankIfsc),
      completeLabel: "Ready",
      pendingLabel: "Missing",
    },
  ];
  const profileCompletionCount = checklistItems.filter((item) => item.complete).length;
  const completionPercent = Math.round(
    (profileCompletionCount / checklistItems.length) * 100,
  );
  const storeInitial = (profile.businessName || session.user.name || "P")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(135deg,rgba(255,94,125,0.14),rgba(255,255,255,0.98)_42%,rgba(255,210,120,0.28))] p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Seller dashboard
            </Badge>

            <div className="flex items-start gap-3 sm:gap-4">
              <Avatar className="h-14 w-14 shrink-0 border border-white/80 shadow-md sm:h-16 sm:w-16">
                <AvatarImage
                  src={profile.profilePhoto || undefined}
                  alt={profile.businessName || session.user.name || "Provider"}
                />
                <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary sm:text-lg">
                  {storeInitial}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Welcome back
                  </p>
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {storeName}
                  </h1>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Fast mobile snapshot of sales, order load, and store readiness.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 shadow-sm">
                <Store className="h-3.5 w-3.5" />
                {valueOrFallback(profile.providerType, "Provider")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 shadow-sm">
                Joined {formatDate(profile.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 shadow-sm">
                {completionPercent}% setup complete
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-stretch lg:min-w-70">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Today view
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {openOrders}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                orders need attention
              </p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-foreground p-4 text-background shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-background/70">
                Est. payout
              </p>
              <p className="mt-2 text-2xl font-semibold leading-tight">
                {formatCurrency(estimatedPayout)}
              </p>
              <p className="mt-1 text-sm text-background/70">
                ready for settlement
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-full px-5">
            <Link href="/provider/inventory">
              <Boxes className="h-4 w-4" />
              Manage inventory
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-full border-white/80 bg-white/80 px-5 backdrop-blur">
            <Link href="/provider/orders">
              View orders
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Quick actions
            </h2>
            <p className="text-sm text-muted-foreground">
              App-like shortcuts for daily work
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3 pb-1">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="min-w-42 rounded-[28px] border border-border/70 bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {action.meta}
                  </p>
                </Link>
              ))}
            </div>
          </div>
          {/* Arrow indicator for horizontal scroll — mobile only */}
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 sm:hidden">
            <ChevronRight className="h-6 w-6 text-foreground/70 animate-pulse" />
          </div>
        </div>
      </section>

      <section id="sales-overview" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            Sales overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Core business numbers at a glance
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[26px] border border-border/70 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {card.label}
                </p>
                <card.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {card.meta}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Recent orders
                </h2>
                <p className="text-sm text-muted-foreground">
                  Latest customer activity
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/provider/orders">See all orders</Link>
              </Button>
            </div>
            {recentOrders.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-border/70 bg-white px-4 py-10 text-center text-sm text-muted-foreground">
                No orders yet. New customer orders will appear here.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-border/70 border border-border/70 bg-white p-4 shadow-sm sm:p-5">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {order.listing.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Size {order.listing.size} · {order.listing.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.user.name || order.user.email} ·{" "}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <Badge variant={getOrderBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Latest listings
                </h2>
                <p className="text-sm text-muted-foreground">
                  Newest products from your catalog
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/provider/inventory">See inventory</Link>
              </Button>
            </div>
            {recentListings.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-border/70 bg-white px-4 py-10 text-center text-sm text-muted-foreground">
                You have not published any listings yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-border/70 rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
                {recentListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center gap-4 px-4 py-4"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {listing.images[0] ? (
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <p className="truncate font-medium text-foreground">
                          {listing.title}
                        </p>
                        <Badge variant={listing.status ? "default" : "outline"}>
                          {listing.status ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Size {listing.size} · {listing.category}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatDate(listing.createdAt)}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(listing.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <section
            id="payment-summary"
            className="rounded-[30px] border border-border/70 bg-white p-4 shadow-sm sm:p-5"
          >
            <h2 className="text-xl font-semibold text-foreground">
              Payment summary
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compact payout summary for mobile and desktop.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm text-muted-foreground">Gross sales</p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm text-muted-foreground">
                  Estimated payout
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatCurrency(estimatedPayout)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm text-muted-foreground">Paid orders</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalOrders}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Profile and contact
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your public-facing store identity.
                </p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {profileCompletionCount}/{checklistItems.length} done
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-border/70">
                    <AvatarImage
                      src={profile.profilePhoto || undefined}
                      alt={profile.businessName || session.user.name || "Provider"}
                    />
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {storeInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground text-base">
                      {valueOrFallback(
                        profile.businessName || session.user.name,
                        "Your store",
                      )}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {user?.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 text-sm">
                <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
                  <p className="mb-3 flex items-center gap-2 font-medium text-foreground text-base">
                    <Phone className="h-4 w-4 text-primary" /> Contact
                  </p>
                  <p className="text-muted-foreground mb-2">
                    {valueOrFallback(profile.phone || user?.phone)}
                  </p>
                  <p className="text-muted-foreground">
                    Alt: {valueOrFallback(profile?.alternate_phone)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
                  <p className="mb-3 flex items-center gap-2 font-medium text-foreground text-base">
                    <MapPin className="h-4 w-4 text-primary" /> Address
                  </p>
                  <p className="text-muted-foreground mb-2">
                    {valueOrFallback(profile.address || user?.address)}
                  </p>
                  <p className="text-muted-foreground mb-2">
                    {valueOrFallback(profile.city || user?.city)}, {" "}
                    {valueOrFallback(profile.state || user?.state)}
                  </p>
                  <p className="text-muted-foreground">
                    PIN {valueOrFallback(profile.pincode || user?.pincode)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-xl font-semibold text-foreground">
              Payout and compliance
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Banking and verification status.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5 text-sm">
                <p className="flex items-center gap-2 font-medium text-foreground text-base">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {valueOrFallback(profile.bankAccountName)}
                </p>
                <p className="mt-2 text-muted-foreground">
                  Account: {maskedAccountNumber}
                </p>
                <p className="text-muted-foreground">
                  IFSC: {valueOrFallback(profile.bankIfsc)}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5 text-sm">
                <p className="flex items-center gap-2 font-medium text-foreground text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Verification
                </p>
                <p className="mt-2 text-muted-foreground">
                  PAN: {valueOrFallback(profile.panNumber)}
                </p>
                <p className="text-muted-foreground">
                  Document: {profile.idDocument ? "Uploaded" : "Missing"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-xl font-semibold text-foreground">
              Business checklist
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Store health checklist to keep the account conversion-ready.
            </p>

            <div className="mt-5 rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Setup progress
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profileCompletionCount} of {checklistItems.length} essentials done
                  </p>
                </div>
                <span className="text-2xl font-semibold text-foreground">
                  {completionPercent}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-border/70">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm ">
              {checklistItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between border border-border/70 bg-white p-4 shadow-sm sm:p-5"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <Badge variant={item.complete ? "default" : "outline"}>
                    {item.complete ? item.completeLabel : item.pendingLabel}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href="/provider/profile">Update profile details</Link>
              </Button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
