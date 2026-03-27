import type { Metadata } from "next";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { content } from "./content";

export const metadata: Metadata = {
  title: `${content.title} | TaniTwirl`,
  description: content.description,
};

export default function FaqPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/70 bg-linear-to-br from-rose-50/80 via-background to-orange-100/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="space-y-6">
            <Badge variant="outline" className="rounded-full bg-white/80 px-4 py-1">
              {content.eyebrow}
            </Badge>
            <h1 className="font-playfair text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {content.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{content.description}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {content.stats?.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border/70 bg-white/90 px-4 py-4">
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-16">
        <Card className="rounded-[2rem] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="font-playfair text-3xl font-semibold sm:text-4xl">
              {content.faqTitle ?? "Questions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {content.faqs?.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-6 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-3xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href={content.primaryCta.href}>{content.primaryCta.label}</Link>
              </Button>
              {content.secondaryCta ? (
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href={content.secondaryCta.href}>{content.secondaryCta.label}</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {content.finalCta ? (
            <Card className="rounded-3xl border-border/70 bg-muted/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{content.finalCta.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">{content.finalCta.description}</p>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={content.finalCta.primary.href}>{content.finalCta.primary.label}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
