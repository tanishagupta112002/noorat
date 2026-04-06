import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
  imageClassName?: string;
};

export function Logo({ className, imageClassName }: LogoProps) {
  const resolvedImageClassName = imageClassName ?? "h-20";

  return (
    <Link
      href="/"
      className="group inline-flex shrink-0 cursor-pointer rounded-md outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Go to home"
    >
      <div className={`inline-flex shrink-0 items-center  gap-0 whitespace-nowrap ${className || ""}`}>
        <Image
          src="/images/Name.png"
          alt="Noorat Logo"
          width={160}
          height={60}
          className={`block ${resolvedImageClassName} w-auto shrink-0 rounded-full object-contain transition-transform duration-200 group-hover:scale-[1.02]`}
        />
        
      </div>
    </Link>
  );
}