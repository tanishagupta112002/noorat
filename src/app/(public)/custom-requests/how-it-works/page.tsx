import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { customRequestPages } from "../content";

const content = customRequestPages["how-it-works"];

export const metadata: Metadata = {
  title: `${content.title} | noorat`,
  description: content.description,
};

export default function CustomRequestHowItWorksPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/70 bg-linear-to-br from-lime-50/80 via-background to-emerald-100/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <Badge variant="outline" className="rounded-full bg-white/80 px-4 py-1">
            {content.eyebrow}
          </Badge>
          <h1 className="mt-5 font-playfair text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{content.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{content.description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="space-y-5">
          {content.cards?.map((card, index) => (
            <Card key={card.title} className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Phase {index + 1}</p>
                  <CardTitle className="mt-1 text-xl">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{card.description}</p>
              </CardContent>
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
                    <ul className="space-y-2">
                      {column.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
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
