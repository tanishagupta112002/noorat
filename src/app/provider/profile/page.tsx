import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderProfileEditForm } from "./_components/provider-profile-edit-form";

export default async function ProviderProfilePage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user?.id) {
		redirect("/auth?redirect=/provider/profile");
	}

	const userId = session.user.id;

	const [user, profile] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				phone: true,
				address: true,
				city: true,
				state: true,
				pincode: true,
			},
		}),
		prisma.providerProfile.findUnique({
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
			},
		}),
	]);

	return (
		<div className="space-y-6">
			<Card className="rounded-[28px] border-border/70 bg-white/70 shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Edit profile</CardTitle>
				</CardHeader>
				<CardContent>
					<ProviderProfileEditForm
						initialValues={{
							profilePhoto: profile?.profilePhoto || "",
							businessName: profile?.businessName || "",
							providerType: profile?.providerType || "",
							phone: profile?.phone || user?.phone || "",
						   alternativeMobileNumber: profile?.alternate_phone || "",
							address: profile?.address || user?.address || "",
							city: profile?.city || user?.city || "",
							state: profile?.state || user?.state || "",
							pincode: profile?.pincode || user?.pincode || "",
							description: profile?.description || "",
							bankAccountName: profile?.bankAccountName || "",
							bankAccountNumber: profile?.bankAccountNumber || "",
							bankIfsc: profile?.bankIfsc || "",
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}