import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import BottomNav from "@/components/BottomNav";

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

export const viewport: Viewport = {
  themeColor: "#070C18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Premium font preconnects */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg-surface)' }}>
        <ServiceWorkerRegistration />
        <ToastProvider>
          {/* Premium Header */}
          <header
            className="fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between"
            style={{
              background: 'rgba(7,12,24,0.85)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-xl overflow-hidden transition-all duration-300"
                style={{
                  boxShadow: '0 0 0 1px rgba(99,195,255,0.2)',
                }}
              >
                <img src="/IMG/hero-icon.png" alt="POZO" className="w-full h-full object-cover" />
              </div>
              <span
                className="font-display text-xl tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #89D6FF 0%, #63C3FF 60%, #2EA8F0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                POZO
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <span
                className="badge badge-active"
                style={{ fontSize: '0.65rem' }}
              >
                Partido en vivo
              </span>
            </div>
          </header>

          <main className="flex-1 pt-14 pb-20">{children}</main>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
