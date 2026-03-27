import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNextAllowedStep } from "@/lib/onboarding-steps";

export default async function OnboardingIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/auth?redirect=/become-a-provider/onboarding");
  }

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      stepMobileVerified: true,
      stepIdentityVerified: true,
      stepStoreDetails: true,
      stepPickupAddress: true,
      stepBankDetails: true,
      stepFirstListing: true,
    },
  });

  redirect(getNextAllowedStep(profile));
}