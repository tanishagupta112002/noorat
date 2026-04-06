import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { content } from "./content";

export const metadata: Metadata = {
  title: `${content.title} | noorat`,
  description: content.description,
};

export default function HowItWorksPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/70 bg-linear-to-br from-emerald-50/80 via-background to-lime-100/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-20 lg:py-20">
          <Badge variant="outline" className="rounded-full bg-white/80 px-4 py-1">
            {content.eyebrow}
          </Badge>
          <h1 className="mt-5 font-playfair text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{content.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{content.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
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
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-20 lg:py-16">
        <h2 className="font-playfair text-3xl font-semibold sm:text-4xl">{content.cardsTitle ?? "Customer journey"}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {content.cards?.map((card, index) => (
            <Card key={card.title} className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader className="space-y-3">
                <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Step {index + 1}
                </span>
                <CardTitle className="text-xl">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{card.description}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {content.columns?.length ? (
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-20 lg:pb-16">
          <Card className="rounded-[2rem] border-border/70 bg-muted/40 shadow-sm">
            <CardHeader>
              <CardTitle className="font-playfair text-3xl font-semibold">{content.columnsTitle ?? "Process notes"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-3">
              {content.columns.map((column) => {
                const Icon = column.icon;
                return (
                  <div key={column.title} className="space-y-3 rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-2">
                      {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
                      <h3 className="font-semibold">{column.title}</h3>
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
