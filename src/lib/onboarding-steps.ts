// src/lib/onboarding-steps.ts

type OnboardingStepFlags = {
  stepMobileVerified: boolean;
  stepIdentityVerified: boolean;
  stepStoreDetails: boolean;
  stepPickupAddress: boolean;
  stepBankDetails: boolean;
  stepFirstListing: boolean;
};

const ONBOARDING_BASE_PATH = "/become-a-provider/onboarding";

export function getNextAllowedStep(
  profile: OnboardingStepFlags | null
): string {
  if (!profile?.stepMobileVerified) {
    return `${ONBOARDING_BASE_PATH}/1_mobile_verification`;
  }

  if (!profile?.stepIdentityVerified) {
    return `${ONBOARDING_BASE_PATH}/2_identity_verification`;
  }

  if (!profile?.stepStoreDetails) {
    return `${ONBOARDING_BASE_PATH}/3_store_details`;
  }

  if (!profile?.stepPickupAddress) {
    return `${ONBOARDING_BASE_PATH}/4_pickup_address`;
  }

  if (!profile?.stepBankDetails) {
    return `${ONBOARDING_BASE_PATH}/5_bank_account`;
  }

  if (!profile?.stepFirstListing) {
    return `${ONBOARDING_BASE_PATH}/6_first_listing`;
  }

  return "/provider/dashboard";
}