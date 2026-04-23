import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/server-timeout";

export default async function AIGeneratedDressesPage() {
  const requestHeaders = await headers();
  const session = (await withTimeout(
    auth.api.getSession({ headers: requestHeaders }),
    8000,
    "Dashboard session lookup",
  )) as any;

  if (!session?.user?.id) {
    redirect("/auth?mode=signup&redirect=/ai-generated-dresses");
  }

  const db = prisma as any;
  const savedLooks = await withTimeout(
    db.customRequestRefinement.findMany({
      where: {
        action: "save",
        request: {
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 60,
      include: {
        request: {
          select: {
            originalPrompt: true,
          },
        },
      },
    }),
    12000,
    "Saved AI generated dresses query",
  );

  return (
    <div>
      <div>
        <h1 className="text-xl font-bold text-foreground">AI Generated Dresses</h1>
        <p className="mt-2 text-muted-foreground">Saved looks from your AI styling history</p>
      </div>

      {savedLooks.length === 0 ? (
        <div className="mt-8 rounded-sm border border-[#ececec] bg-white p-6 text-center sm:mt-12 sm:p-12">
          <p className="mb-4 text-lg text-muted-foreground">No saved AI generated dresses yet.</p>
          <a
            href="/custom-requests"
            className="inline-block rounded-sm bg-primary px-6 py-2 font-medium text-primary-foreground transition hover:opacity-90"
          >
            Generate Looks
          </a>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {savedLooks.map((look: any) => (
            <article key={look.id} className="rounded-sm border border-[#ececec] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <div className="flex items-start gap-3">
                <div className="h-40 w-48 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={look.resultImageUrl}
                    alt="Saved AI generated dress"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "50% 100%" }}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                <p className="line-clamp-2 text-sm font-medium text-foreground">
                  {look.request?.originalPrompt || look.promptUsed}
                </p>
                <p className="text-xs text-muted-foreground">
                  Saved {new Date(look.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
