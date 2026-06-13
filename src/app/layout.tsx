import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Raamatun käännöstyökalu",
  description: "Raamatun käännösehdotusten hallinta ja arviointi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi" className={`${serif.variable} ${sans.variable} h-full antialiased`}>
      <body className="h-screen overflow-hidden flex flex-col font-sans bg-stone-50 text-stone-900">
        <AppShell>
          <Header />
          <MobileNav />
          <main className="flex-1 min-h-0 overflow-hidden">
            {children}
          </main>
        </AppShell>
      </body>
    </html>
  );
}
