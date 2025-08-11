import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "FryFlip — Oven→Air-Fryer Converter",
  description: "Turn any oven recipe into air-fryer settings in one click. Fast, mobile-first, and CLS-safe.",
  openGraph: {
    title: "FryFlip — Oven→Air-Fryer Converter",
    description: "Turn any oven recipe into air-fryer settings in one click. Fast, mobile-first, and CLS-safe.",
    url: "https://fryflip.xyz",
    siteName: "FryFlip",
    images: [],
    type: "website",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-0000000000000000";
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <meta name="google-adsense-account" content={clientId} />
        <Script
          id="adsbygoogle-init"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
