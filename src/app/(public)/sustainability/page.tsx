import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { content } from "./content";

export const metadata: Metadata = {
  title: `${content.title} | TaniTwirl`,
  description: content.description,
};

export default function SustainabilityPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/70 bg-linear-to-br from-emerald-100/70 via-background to-lime-100/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <Badge variant="outline" className="rounded-full bg-white/80 px-4 py-1">
            {content.eyebrow}
          </Badge>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="font-playfair text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{content.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{content.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {content.stats?.slice(0, 2).map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-emerald-200/50 bg-white/90 px-4 py-4">
                  <p className="text-2xl font-semibold text-emerald-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {content.cards?.map((card) => (
            <Card key={card.title} className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{card.description}</CardContent>
            </Card>
          ))}
        </div>

        {content.columns?.length ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {content.columns.map((column) => {
              const Icon = column.icon;
              return (
                <Card key={column.title} className="rounded-3xl border-border/70 bg-muted/30 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
                      {column.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {column.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={content.primaryCta.href}>{content.primaryCta.label}</Link>
          </Button>
          {content.secondaryCta ? (
            <Button variant="outline" asChild>
              <Link href={content.secondaryCta.href}>{content.secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
