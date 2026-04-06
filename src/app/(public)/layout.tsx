import type { ReactNode } from "react";
import { Suspense } from "react";
import Header from "./_components/header/header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main id="main-content" className="min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
    </>
  );
}
