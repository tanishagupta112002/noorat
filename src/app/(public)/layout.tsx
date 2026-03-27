import type { ReactNode } from "react";
import Header from "./_components/header/header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen pb-0">
        {children}
      </main>
    </>
  );
}
