import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "sixsense | Premium Roblox Scripts",
  description: "Premium automation scripts for Roblox games. Completely free, always updated, and built with performance in mind.",
  keywords: ["roblox", "scripts", "automation", "sixsense", "gaming"],
  authors: [{ name: "xXehub" }],
  openGraph: {
    title: "sixsense | Premium Roblox Scripts",
    description: "Premium automation scripts for Roblox games.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ToastProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
