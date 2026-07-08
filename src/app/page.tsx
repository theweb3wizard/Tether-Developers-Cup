'use client';

import Link from 'next/link';
import LiveMatchWidget from '@/components/LiveMatchWidget';
import { getCurrentMatch } from '@/lib/fixtures';

const FEATURES = [
  {
    href: '/wallet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: 'Wallet',
    desc: 'Auto-custodia. Tus llaves, tus USDt.',
    badge: 'Crear',
    color: 'var(--celeste)',
    dimColor: 'rgba(99,195,255,0.08)',
    borderColor: 'rgba(99,195,255,0.15)',
  },
  {
    href: '/pool',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
    title: 'POZOs',
    desc: 'Pools de apuestas entre amigos.',
    badge: 'Armar',
    color: 'var(--gold)',
    dimColor: 'rgba(255,209,102,0.08)',
    borderColor: 'rgba(255,209,102,0.15)',
  },
  {
    href: '/asado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 2a5 5 0 00-5 5v3H5a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2v-2a2 2 0 00-2-2h-2V7a5 5 0 00-5-5z" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: 'Asado Fund',
    desc: 'Dividí los gastos de la previa.',
    badge: 'Dividir',
    color: 'var(--violet)',
    dimColor: 'rgba(155,127,255,0.08)',
    borderColor: 'rgba(155,127,255,0.15)',
  },
];

const HIGHLIGHTS = [
  { label: 'Sin registro', desc: 'Tu identidad vive en tu navegador', icon: '🔒' },
  { label: 'USDT directo', desc: 'Pools liquidados al instante', icon: '⚡' },
  { label: 'Auto-custodia', desc: 'Vos tenés las llaves', icon: '🔑' },
];

export default function Home() {
  const currentMatch = getCurrentMatch();
  const matchBadgeText = currentMatch
    ? `🇦🇷 ${currentMatch.homeTeam} vs ${currentMatch.awayTeam} — ${currentMatch.round}`
    : '🇦🇷 Argentina — Próximo partido';

  return (
    <div className="flex flex-col items-center min-h-full">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="w-full relative overflow-hidden">
        {/* Aurora background */}
        <div
          className="absolute inset-0 stripe-texture"
          style={{
            background:
              'radial-gradient(ellipse 100% 70% at 50% -10%, rgba(99,195,255,0.14) 0%, transparent 65%), ' +
              'radial-gradient(ellipse 60% 40% at 90% 100%, rgba(155,127,255,0.08) 0%, transparent 60%)',
          }}
        />
        {/* Fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-surface))' }} />

        <div className="max-w-2xl mx-auto px-4 py-16 md:py-20 text-center relative z-10">

          {/* Match badge — dynamic */}
          <div className="flex items-center justify-center mb-6">
            <span
              className="badge badge-active px-4 py-1.5"
              style={{ fontSize: '0.72rem' }}
            >
              {matchBadgeText}
            </span>
          </div>

          {/* Hero icon */}
          <div
            className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-6 rounded-3xl overflow-hidden animate-float"
            style={{ boxShadow: '0 0 0 1px rgba(99,195,255,0.15), 0 0 40px rgba(99,195,255,0.12), 0 20px 60px rgba(0,0,0,0.5)' }}
          >
            <img src="/IMG/hero-icon.png" alt="POZO" className="w-full h-full object-cover" />
          </div>

          {/* Wordmark */}
          <h1
            className="font-hero leading-none mb-3"
            style={{
              fontSize: 'clamp(5rem, 18vw, 7.5rem)',
              background: 'linear-gradient(160deg, #FFFFFF 0%, #89D6FF 40%, #63C3FF 70%, #9B7FFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              letterSpacing: '0.06em',
            }}
          >
            POZO
          </h1>

          <p
            className="text-base md:text-lg max-w-sm mx-auto leading-relaxed mb-8"
            style={{ color: 'var(--text-secondary)', fontWeight: 400 }}
          >
            Pools para la Scaloneta. Creá tu POZO, invitá amigos, liquidá apuestas al toque con USDT.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/onboarding" className="btn btn-gold px-8 py-3 text-base">
              Arrancar
            </Link>
            <Link href="/pool" className="btn btn-ghost px-6 py-3 text-base">
              Ver POZOs
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTENT ────────────────────────────────────────────── */}
      <div className="max-w-2xl w-full px-4 -mt-2 space-y-4 pb-8 stagger">

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: `linear-gradient(145deg, ${f.dimColor} 0%, var(--bg-card) 70%)`,
                border: `1px solid ${f.borderColor}`,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle, ${f.dimColor} 0%, transparent 70%)` }}
              />
              <div className="relative z-10">
                <div className="mb-3" style={{ color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-display text-base text-white mb-1">{f.title}</h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-tertiary)' }}>{f.desc}</p>
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold transition-all duration-200 group-hover:gap-2"
                  style={{ color: f.color, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                  {f.badge}
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Live match widget — replaces hardcoded promo card */}
        <div
          className="relative overflow-hidden rounded-2xl p-1"
          style={{
            background: 'linear-gradient(145deg, rgba(99,195,255,0.05) 0%, var(--bg-card) 60%)',
            border: '1px solid var(--border-accent)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Partido</span>
            </div>
            <LiveMatchWidget compact={false} />
            <Link href="/onboarding" className="btn btn-gold text-sm w-full">
              Armar la previa 🥩
            </Link>
          </div>
        </div>

        {/* Highlights row */}
        <div className="grid grid-cols-3 gap-3">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.label}
              className="rounded-2xl p-4 text-center"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-white)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <span className="text-xl mb-2 block">{h.icon}</span>
              <p
                className="font-display text-xs mb-1"
                style={{
                  background: 'linear-gradient(135deg, var(--gold-bright), var(--gold))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {h.label}
              </p>
              <p className="text-[10px] leading-tight" style={{ color: 'var(--text-tertiary)' }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
