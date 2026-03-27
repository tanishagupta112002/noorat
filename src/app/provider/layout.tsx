import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNextAllowedStep } from "@/lib/onboarding-steps";
import { Logo } from "@/components/ui/logo";
import { ProviderDesktopNav } from "./_components/provider-nav";
import { ProviderMobileLayout } from "./_components/provider-mobile-layout";

type ProviderLayoutProps = {
	children: React.ReactNode;
};

export default async function ProviderLayout({ children }: ProviderLayoutProps) {
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
			city: true,
			stepMobileVerified: true,
			stepIdentityVerified: true,
			stepStoreDetails: true,
			stepPickupAddress: true,
			stepBankDetails: true,
			stepFirstListing: true,
		},
	});

	const nextStep = getNextAllowedStep(profile);
	if (nextStep !== "/provider/dashboard") {
		redirect(nextStep);
	}

	if (!profile?.id) {
		redirect("/become-a-provider/onboarding");
	}

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.85),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,255,255,0))]">
			{/* ── Mobile: full UI handled by client wrapper ── */}
			<div className="lg:hidden">
				<ProviderMobileLayout>{children}</ProviderMobileLayout>
			</div>

			{/* ── Desktop: original layout ── */}
			<div className="hidden lg:block">
				<header className="sticky top-0 z-200 w-full border-b bg-white backdrop-blur-md">
					<div className="w-full">
						<div className="mx-auto flex max-w-6xl flex-col gap-3 overflow-visible px-4 py-4 lg:gap-2 lg:px-5">
							<div className="relative flex w-full items-center justify-center">
								<Logo />
							</div>
						</div>

						<div className="relative">
							<div className="mx-auto flex max-w-6xl items-center justify-center px-5 pb-3">
								<ProviderDesktopNav />
							</div>
						</div>
					</div>
				</header>

				<main className="mx-auto min-w-0 px-4 py-6 sm:px-5 lg:px-6 xl:px-8">{children}</main>
			</div>
		</div>
	);
}