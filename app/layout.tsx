import type { Metadata } from "next";
import { Noto_Sans_Georgian } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const defaultFont = Noto_Sans_Georgian({ subsets: ["latin"] });

const ORIGIN_URL =
  process.env.NODE_ENV === "production"
    ? "https://tasks.rspcbassembly.com"
    : "http://localhost:3000";

export const metadata: Metadata = {
  title: "RS Tasks",
  description: "RS PCB Assembly's internal task manager.",
  icons: {
    icon: "/icon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL(ORIGIN_URL),
  alternates: {
    canonical: ORIGIN_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RS Tasks",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={defaultFont.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
