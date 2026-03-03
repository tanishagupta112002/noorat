// src/components/layout/search-auth.tsx
import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchAuth() {
  return (
    <div className="hidden md:flex items-center gap-4">
      <div className="relative w-64 lg:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search outfits or describe your design..."
          className="pl-9 bg-muted/40 border-muted focus-visible:ring-primary/50"
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        asChild
        className="border-primary/30 hover:border-primary"
      >
        <Link href="/sign-in">Sign In</Link>
      </Button>
      <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
        <Link href="/sign-up">Get Started</Link>
      </Button>
    </div>
  );
}