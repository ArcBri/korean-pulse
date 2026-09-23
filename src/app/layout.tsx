import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, Noto_Sans_KR } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const hangul = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-hangul",
});

export const metadata: Metadata = {
  title: "Hangul Hour",
  description:
    "One Korean word an hour — Hangul, how to say it, and a quick review so it sticks.",
  applicationName: "Hangul Hour",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/icons/favicon-32.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Hangul Hour",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f5c4a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${hangul.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-[color:var(--ink)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
