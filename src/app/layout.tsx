import type { Metadata, Viewport } from "next";
import { Baloo_2, Inter } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

const baloo2 = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-baloo-2",
});

const resnick = localFont({
  src: "./fonts/Resnick.ttf",
  variable: "--font-resnick",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://bookburr.com"),
  title: "BookBurr",
  description: "Koordinasi bukber anti ribet",
  manifest: "/manifest.json",
  openGraph: {
    title: "BookBurr",
    description: "Koordinasi bukber anti ribet",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookBurr",
    description: "Koordinasi bukber anti ribet",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F14641",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${baloo2.variable} ${resnick.variable} font-sans bg-white min-h-dvh antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
