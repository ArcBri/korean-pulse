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
    "Learn practical Korean vocabulary every hour from 9 AM to 5 PM with Hangul, pronunciation, and spaced review.",
  applicationName: "Hangul Hour",
  manifest: "/manifest.webmanifest",
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
