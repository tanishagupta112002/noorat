import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { content } from "./content";

export const metadata: Metadata = {
  title: `${content.title} | noorat`,
  description: content.description,
};

export default function ContactPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/70 bg-linear-to-br from-orange-50/80 via-background to-rose-100/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full bg-white/80 px-4 py-1">
                {content.eyebrow}
              </Badge>
              <div className="space-y-3">
                <h1 className="font-playfair text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  {content.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {content.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
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

            <Card className="rounded-3xl border-orange-200/40 bg-white/85 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">When to reach support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {content.badges?.map((badge) => (
                  <p key={badge} className="rounded-xl bg-orange-50/80 px-3 py-2">
                    {badge}
                  </p>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-16">
        {content.cards?.map((card) => (
          <Card key={card.title} className="rounded-3xl border-border/70 shadow-sm">
            <CardHeader className="space-y-2">
              {card.eyebrow ? (
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {card.eyebrow}
                </span>
              ) : null}
              <CardTitle className="text-xl">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">{card.description}</p>
              {card.href ? (
                <Link href={card.href} className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  {card.linkLabel ?? "Explore"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {content.columns?.length ? (
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
          <Card className="rounded-[2rem] border-border/70 bg-muted/40 shadow-sm">
            <CardHeader>
              <CardTitle className="font-playfair text-3xl font-semibold">
                {content.columnsTitle ?? "Before you contact us"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-3">
              {content.columns.map((column) => {
                const Icon = column.icon;
                return (
                  <div key={column.title} className="space-y-4 rounded-2xl bg-white p-5">
                    <div className="flex items-center gap-3">
                      {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
                      <h2 className="text-base font-semibold">{column.title}</h2>
                    </div>
                    <ul className="space-y-2">
                      {column.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
