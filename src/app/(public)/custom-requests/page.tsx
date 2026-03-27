import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { customRequestPages } from "./content";

const content = customRequestPages.index;

export const metadata: Metadata = {
  title: `${content.title} | noorat`,
  description: content.description,
};

export default function CustomRequestsPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/70 bg-linear-to-br from-orange-100/70 via-background to-rose-100/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full bg-white/80 px-4 py-1">
                {content.eyebrow}
              </Badge>
              <h1 className="font-playfair text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{content.title}</h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{content.description}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={content.primaryCta.href}>{content.primaryCta.label}</Link>
                </Button>
                {content.secondaryCta ? (
                  <Button asChild variant="outline">
                    <Link href={content.secondaryCta.href}>{content.secondaryCta.label}</Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <Card className="rounded-3xl border-orange-200/50 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">What you submit</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {content.columns?.[1]?.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {content.stats?.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border/70 bg-white/90 px-4 py-4">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 className="font-playfair text-3xl font-semibold sm:text-4xl">{content.cardsTitle ?? "Use cases"}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {content.cards?.map((card) => (
            <Card key={card.title} className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                {card.eyebrow ? <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{card.eyebrow}</p> : null}
                <CardTitle className="text-xl">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">{card.description}</p>
                {card.href ? (
                  <Link href={card.href} className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    {card.linkLabel ?? "Open"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        {content.finalCta ? (
          <Card className="mt-8 rounded-[2rem] border-border/70 bg-linear-to-r from-orange-100/70 via-white to-rose-100/70 shadow-sm">
            <CardContent className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <h2 className="font-playfair text-3xl font-semibold sm:text-4xl">{content.finalCta.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">{content.finalCta.description}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={content.finalCta.primary.href}>{content.finalCta.primary.label}</Link>
                </Button>
                {content.finalCta.secondary ? (
                  <Button asChild variant="outline">
                    <Link href={content.finalCta.secondary.href}>{content.finalCta.secondary.label}</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
