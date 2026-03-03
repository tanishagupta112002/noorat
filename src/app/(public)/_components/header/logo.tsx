// src/components/layout/logo.tsx
import Image from "next/image";
import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center justify-center ${className || ""}`}>
      <Image
        src="/images/logo.png"
        alt="TaniTwirl Logo"
        width={48}
        height={48}
        priority
        className="object-contain"
      />
    </Link>
  );
}