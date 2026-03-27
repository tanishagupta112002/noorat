"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
	Boxes,
	ChevronRight,
	LayoutDashboard,
	Menu,
	PackagePlus,
	ShoppingBag,
	User,
	Wallet,
	Star,
	BadgeIndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";

type ProviderNavItem = {
	href: string;
	label: string;
	description?: string;
	icon: typeof Boxes;
};

const providerNavItems: ProviderNavItem[] = [
	{
		href: "/provider/dashboard",
		label: "Dashboard",
		description: "View your store's performance and key metrics at a glance",
		icon: LayoutDashboard,
	},
	{
		href: "/provider/profile",
		label: "Profile",
		description: "Edit your personal and store information to keep your profile up to date",
		icon: User,
	},
	{
		href: "/provider/inventory",
		label: "My Store",
		description: "Manage your product listings and inventory",
		icon: Boxes,
	},
	{
		href: "/provider/add-stock",
		label: "Add New Stock",
		description: "Add new products to your inventory and expand your offerings",
		icon: PackagePlus,
	},
	{
		href: "/provider/orders",
		label: "Orders",
		description: "Track and manage incoming customer orders",
		icon: ShoppingBag,
	},
	{
		href: "/provider/sells",
		label: "Sells",
		description: "View your sales performance and revenue metrics",
		icon: BadgeIndianRupee,
	},
	{
		href: "/provider/payments",
		label: "Payment Summary",
	    description: "View your payment history and manage payouts",
		icon: Wallet,
	},
	{
		href: "/provider/reviews",
		label: "Reviews",
		description: "View customer feedback and ratings to improve your service",
		icon: Star,
	},
];

function isActivePath(pathname: string, href: string) {
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProviderMobileNav() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	const handleSheetInteraction = (event: React.MouseEvent<HTMLDivElement>) => {
		const target = event.target as HTMLElement;
		if (target.closest("a, button")) {
			setOpen(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button size="icon" variant="ghost" className="rounded-full">
					<Menu className="h-5 w-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-[85vw] max-w-72 p-0">
				<div className="flex h-full flex-col bg-background" onClick={handleSheetInteraction}>
					<div className="px-5 py-5">
						<Logo />
					</div>

					<div className="flex-1 overflow-y-auto px-3 py-4">
						<div className="space-y-2">
							{providerNavItems.map((item) => {
								const Icon = item.icon;
								const isActive = isActivePath(pathname, item.href);

								return (
									<Link
										key={item.label}
										href={item.href}
										className={[
											"flex items-center justify-between rounded-2xl border px-4 py-4 transition-colors",
											isActive
												? "border-primary/30 bg-primary/10 text-primary"
												: "border-transparent bg-background hover:border-border hover:bg-muted/60",
										].join(" ")}
									>
										<div className="flex items-center gap-3">
											<span className={[
												"rounded-xl p-2",
												isActive ? "bg-primary/15" : "bg-muted",
											].join(" ")}>
												<Icon className="h-4 w-4" />
											</span>
											<div>
												<p className="block text-sm font-semibold text-foreground">{item.label}</p>
												{item.description ? <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p> : null}
											</div>
										</div>
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</Link>
								);
							})}
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}

export function ProviderDesktopNav() {
	const pathname = usePathname();

	return (
		<nav className="flex items-center justify-center gap-1.5">
			{providerNavItems.map((item) => {
				const isActive = isActivePath(pathname, item.href);

				return (
					<Link
						key={item.label}
						href={item.href}
						className={[
							"group relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
							isActive
								? "bg-primary/20 text-primary"
								: "text-gray-700 hover:bg-primary/10 hover:text-primary",
						].join(" ")}
					>
						<item.icon className="h-4 w-4" />
						{item.label}
						{item.description ? (
							<span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-max max-w-56 -translate-x-1/2 rounded-md border border-border/60 bg-popover px-2.5 py-1.5 text-center text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
								{item.description}
							</span>
						) : null}
						{isActive ? <span className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-primary" /> : null}
					</Link>
				);
			})}
		</nav>
	);
}