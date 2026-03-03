// src/components/layout/logo.tsx
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className || ""}`}>
      <Image
        src="/images/logo.png"
        alt="TaniTwirl Logo"
        width={48}
        height={48}
        priority
        className="object-contain"
      />
      <span className="font-playfair font-bold text-xl md:text-2xl text-foreground">
        TaniTwirl
      </span>
    </div>
  );
}