import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderProfileEditForm } from "./_components/provider-profile-edit-form";

const getProviderProfileData = unstable_cache(
	async (userId: string) => {
		return prisma.providerProfile.findUnique({
			where: { userId },
			select: {
				profilePhoto: true,
				providerType: true,
				businessName: true,
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
				user: {
					select: {
						phone: true,
						address: true,
						city: true,
						state: true,
						pincode: true,
					},
				},
			},
		});
	},
	["provider-profile-page-data"],
	{ revalidate: 60 },
);

export default async function ProviderProfilePage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user?.id) {
		redirect("/auth?redirect=/provider/profile");
	}

	const userId = session.user.id;
	const profile = await getProviderProfileData(userId);

	if (!profile) {
		redirect("/become-a-provider/onboarding");
	}

	return (
		<div className="space-y-6">
			<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Edit profile</CardTitle>
				</CardHeader>
				<CardContent>
					<ProviderProfileEditForm
						initialValues={{
							profilePhoto: profile.profilePhoto || "",
							businessName: profile.businessName || "",
							providerType: profile.providerType || "",
							phone: profile.phone || profile.user.phone || "",
						   alternativeMobileNumber: profile.alternate_phone || "",
							address: profile.address || profile.user.address || "",
							city: profile.city || profile.user.city || "",
							state: profile.state || profile.user.state || "",
							pincode: profile.pincode || profile.user.pincode || "",
							description: profile.description || "",
							bankAccountName: profile.bankAccountName || "",
							bankAccountNumber: profile.bankAccountNumber || "",
							bankIfsc: profile.bankIfsc || "",
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}