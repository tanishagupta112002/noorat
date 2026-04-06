// src/app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NavigationLoadingOverlay } from "@/components/ui/navigation-loading-overlay";

const inter = Inter({ subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "Noorat",
  description: "Rent or Provide designer ethnic wear easily",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon-128.png", type: "image/png", sizes: "128x128" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon-256.png", type: "image/png", sizes: "256x256" },
      { url: "/favicon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <NavigationLoadingOverlay />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}