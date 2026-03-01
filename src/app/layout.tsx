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
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon-57x57.png", sizes: "57x57" },
      { url: "/apple-icon-60x60.png", sizes: "60x60" },
      { url: "/apple-icon-72x72.png", sizes: "72x72" },
      { url: "/apple-icon-76x76.png", sizes: "76x76" },
      { url: "/apple-icon-114x114.png", sizes: "114x114" },
      { url: "/apple-icon-120x120.png", sizes: "120x120" },
      { url: "/apple-icon-144x144.png", sizes: "144x144" },
      { url: "/apple-icon-152x152.png", sizes: "152x152" },
      { url: "/apple-icon-180x180.png", sizes: "180x180" },
    ],
  },
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
  other: {
    "msapplication-TileColor": "#ffffff",
    "msapplication-TileImage": "/ms-icon-144x144.png",
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
