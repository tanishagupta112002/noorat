import Image from "next/image";

type LogoLoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const loaderSizeMap = {
  sm: {
    frame: "h-16 w-16",
    inner: "inset-[5px]",
    logoWrap: "h-10 w-10",
    text: "text-xs",
  },
  md: {
    frame: "h-22 w-22",
    inner: "inset-[7px]",
    logoWrap: "h-12 w-12",
    text: "text-sm",
  },
  lg: {
    frame: "h-28 w-28",
    inner: "inset-[8px]",
    logoWrap: "h-16 w-16",
    text: "text-sm",
  },
} as const;

export function LogoLoader({ label = "Loading", size = "md" }: LogoLoaderProps) {
  const preset = loaderSizeMap[size];

  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite" aria-label={label}>
      <div className={`relative ${preset.frame}`}>
        <div className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,rgba(109,16,31,0.12)_0deg,rgba(109,16,31,0.95)_140deg,rgba(109,16,31,0.18)_240deg,rgba(109,16,31,0.12)_360deg)] shadow-[0_0_40px_rgba(109,16,31,0.18)]" />
        <div className={`absolute ${preset.inner} rounded-full bg-background/95 backdrop-blur-sm`} />
        <div className="relative flex h-full w-full items-center justify-center">
          <div className={`${preset.logoWrap} animate-pulse rounded-full bg-white/50 p-2 shadow-[0_14px_35px_rgba(109,16,31,0.18)]`}>
            <Image
              src="/favicon-512.png"
              alt="Noorat logo"
              width={160}
              height={160}
              priority
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1 text-center">
        <p className={`font-medium tracking-[0.22em] text-primary uppercase ${preset.text}`}>{label}</p>
        <p className="text-xs text-muted-foreground">Please wait a moment</p>
      </div>
    </div>
  );
}