'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Inicio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/pool',
    label: 'POZOs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    href: '/wallet',
    label: 'Wallet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'Historial',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/asado',
    label: 'Asado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2a5 5 0 00-5 5v3H5a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2v-2a2 2 0 00-2-2h-2V7a5 5 0 00-5-5z" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2"
      style={{
        height: '64px',
        background: 'rgba(7,12,24,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200"
            style={{
              color: active ? 'var(--celeste-bright)' : 'var(--text-tertiary)',
              minWidth: '52px',
            }}
          >
            {/* Active background glow */}
            {active && (
              <span
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'rgba(99,195,255,0.08)',
                  border: '1px solid rgba(99,195,255,0.12)',
                }}
              />
            )}

            {/* Icon */}
            <span className="relative" style={{ filter: active ? 'drop-shadow(0 0 8px rgba(99,195,255,0.5))' : 'none' }}>
              {item.icon}
            </span>

            {/* Label */}
            <span
              className="relative"
              style={{
                fontSize: '0.6rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: active ? 700 : 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {item.label}
            </span>

            {/* Active dot indicator */}
            {active && (
              <span
                className="absolute -bottom-0.5"
                style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  background: 'var(--celeste)',
                  boxShadow: '0 0 6px var(--celeste)',
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
