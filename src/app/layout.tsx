import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Albiceleste Fan Wallet",
  description: "Self-custodial watch party pools for La Albiceleste — powered by Tether WDK",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "La Albiceleste Fan Wallet",
    description: "POZO — Self-custodial watch party pools for Argentina fans",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#75AADB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-full flex flex-col">
        <nav className="argentina-flag px-4 py-3 flex items-center justify-between shadow-sm">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🇦🇷</span>
            <span className="font-bold text-blue text-lg">Albiceleste Wallet</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/wallet" className="text-sm font-medium text-blue hover:text-celeste-dark transition-colors">Wallet</a>
            <a href="/pool" className="text-sm font-medium text-blue hover:text-celeste-dark transition-colors">POZO</a>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="bg-blue text-white text-center text-xs py-4">
          ⚽ La Albiceleste Fan Wallet — Tether Developers Cup 2026
        </footer>
      </body>
    </html>
  );
}
