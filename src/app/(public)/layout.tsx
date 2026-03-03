import type { ReactNode } from "react";
import Navbar from "./_components/header/header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pb-16 lg:pb-0">
        {children}
      </main>
    </>
  );
}
