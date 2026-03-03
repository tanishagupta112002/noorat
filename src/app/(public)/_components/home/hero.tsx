// src/components/home/HeroSection.tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-background to-accent/10 py-16  overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left – Text + CTA */}
          <div className="text-center lg:text-left space-y-8">
            

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Rent Designer Ethnic Wear
              <br />
              <span className="text-primary">Affordably & Stylishly</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Premium lehengas, sarees, anarkalis & more — delivered to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/rentals">Browse Rentals</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10"
              >
                <Link href="/custom-requests">Custom Request</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span> Free Delivery
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span> Easy Returns
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span> Verified Tailors
              </div>
            </div>
          </div>

          {/* Right – Hero Image */}
          <div className="relative overflow-hidden w-full h-[500px] lg:h-[600px]">
            <Image
              src="/images/heroin.png"
              alt="Designer ethnic wear showcase"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}