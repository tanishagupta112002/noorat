import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNextAllowedStep } from "@/lib/onboarding-steps";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ authenticated: false, canAccessProviderMode: false, providerHref: "/auth" });
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

  if (!profile) {
    return Response.json({
      authenticated: true,
      canAccessProviderMode: false,
      providerHref: "/become-a-provider/onboarding/1_mobile_verification",
    });
  }

  const nextStep = getNextAllowedStep(profile);
  const canAccessProviderMode = nextStep === "/provider/dashboard";

  return Response.json({
    authenticated: true,
    canAccessProviderMode,
    providerHref: canAccessProviderMode ? "/provider/dashboard" : nextStep,
  });
}