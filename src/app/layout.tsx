import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POZO — Albiceleste Fan Wallet",
  description: "Self-custodial watch party pools for La Albiceleste — powered by Tether WDK",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "POZO — Albiceleste Fan Wallet",
    description: "Self-custodial watch party pools for Argentina fans",
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
        <nav className="argentina-flag px-4 py-2.5 flex items-center justify-between shadow-sm sticky top-0 z-50">
          <a href="/" className="flex items-center gap-2.5 group">
            <img
              src="/IMG/hero-icon.png"
              alt="POZO"
              className="w-8 h-8 rounded-xl group-hover:scale-110 transition-transform duration-300"
            />
            <span className="font-bold text-blue text-lg">POZO</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/wallet" className="text-sm font-semibold text-blue hover:text-celeste-dark transition-colors px-2 py-1">Wallet</a>
            <a href="/pool" className="text-sm font-semibold text-blue hover:text-celeste-dark transition-colors px-2 py-1">POZO</a>
            <a href="/pool" className="text-sm font-semibold text-blue hover:text-celeste-dark transition-colors px-2 py-1">POZO</a>
            <a href="/history" className="text-sm font-semibold text-blue hover:text-celeste-dark transition-colors px-2 py-1">Historial</a>
            <a href="/asado" className="text-sm font-semibold text-blue hover:text-celeste-dark transition-colors px-2 py-1">Asado</a>
          </div>
        </nav>
        <main className="flex-1"><ToastProvider>{children}</ToastProvider></main>
        <footer className="bg-blue text-white text-center text-xs py-4">
          ⚽ POZO — Tether Developers Cup 2026
        </footer>
      </body>
    </html>
  );
}
