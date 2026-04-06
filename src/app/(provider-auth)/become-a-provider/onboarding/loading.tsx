import { LogoLoader } from "@/components/ui/logo-loader";

export default function OnboardingLoading() {
  return (
    <div className="fixed inset-0 z-12000 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="rounded-2xl border border-white/40 bg-background/90 px-10 py-8 shadow-2xl">
        <LogoLoader label="Loading" size="sm" />
      </div>
    </div>
  );
}
