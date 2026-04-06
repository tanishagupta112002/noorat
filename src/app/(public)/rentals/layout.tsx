import type { ReactNode } from "react";
import { MobileBackBar } from "../_components/mobile-back-bar";

export default function RentalsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileBackBar fallbackHref="/" />
      {children}
    </>
  );
}