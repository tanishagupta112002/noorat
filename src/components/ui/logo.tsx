import Image from "next/image";
import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="group inline-flex shrink-0">
      <div className={`inline-flex shrink-0 items-center  gap-0 whitespace-nowrap ${className || ""}`}>
        <Image
          src="/images/Name.png"
          alt="Noorat Logo"
          width={160}
          height={60}
          className="block shrink-0 object-contain h-20 w-auto rounded-full"
        />
        
      </div>
    </Link>
  );
}