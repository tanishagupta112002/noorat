import type { Metadata } from "next";
import { MinimalAIComposer } from "./_components/minimal-ai-composer";

import { customRequestPages } from "./content";

const content = customRequestPages.index;

export const metadata: Metadata = {
  title: `${content.title} | noorat`,
  description: content.description,
};

export default function CustomRequestsPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-20 lg:py-8">
        <MinimalAIComposer />
      </div>
    </div>
  );
}
