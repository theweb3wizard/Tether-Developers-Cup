'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCurrentMatch, type Fixture } from '@/lib/fixtures'
import type { MatchScore } from '@/app/api/matches/live/route'

// How long after a match finishes to keep showing the score (ms)
const POST_MATCH_DISPLAY_MS = 4 * 60 * 60 * 1000 // 4 hours

function formatMatchDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    })
  } catch {
    return isoDate
  }
}

/**
 * Returns true if a finished (post) match is recent enough to display.
 * Prevents showing yesterday's score on the homepage indefinitely.
 */
function isRecentEnough(match: MatchScore): boolean {
  if (match.status !== 'post') return true // live or upcoming always shown
  if (!match.date) return false
  const matchTime = new Date(match.date).getTime()
  return Date.now() - matchTime < POST_MATCH_DISPLAY_MS
}

interface LiveMatchWidgetProps {
  /** compact = true for a slim banner row; false = full card */
  compact?: boolean
}

export default function LiveMatchWidget({ compact = false }: LiveMatchWidgetProps) {
  const [matches, setMatches] = useState<MatchScore[]>([])
  const [loading, setLoading] = useState(true)
  const nextFixture: Fixture = getCurrentMatch()

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches/live')
      if (res.ok) {
        const data: MatchScore[] = await res.json()
        setMatches(data)
      }
    } catch {
      // Network error — silently keep showing the fallback fixture card
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMatches()
    const interval = setInterval(() => void fetchMatches(), 30_000)
    return () => clearInterval(interval)
  }, [fetchMatches])

  // Find an Argentina match that is live, upcoming, OR recently finished
  const argMatch = matches.find(
    (m) =>
      (m.homeTeam.toLowerCase().includes('argentina') ||
        m.awayTeam.toLowerCase().includes('argentina')) &&
      isRecentEnough(m)
  )

  const isLive = argMatch?.status === 'in'
  const isArgHome = argMatch
    ? argMatch.homeTeam.toLowerCase().includes('argentina')
    : false

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return compact ? (
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)' }}
      >
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-5 w-12 rounded" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
    ) : (
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)' }}
      >
        <div className="skeleton h-4 w-32 rounded" />
        <div className="flex items-center justify-between gap-4">
          <div className="skeleton h-6 w-28 rounded" />
          <div className="skeleton h-8 w-16 rounded" />
          <div className="skeleton h-6 w-28 rounded" />
        </div>
        <div className="skeleton h-3 w-40 rounded" />
      </div>
    )
  }

  // ── Live / recent score view ─────────────────────────────────────────────────
  if (argMatch) {
    const homeScore = argMatch.homeScore
    const awayScore = argMatch.awayScore

    if (compact) {
      return (
        <div
          className="rounded-2xl px-4 py-2.5 flex items-center gap-2 overflow-hidden"
          style={{
            background: isLive
              ? 'linear-gradient(90deg, rgba(99,195,255,0.1) 0%, var(--bg-card) 100%)'
              : 'var(--bg-card)',
            border: isLive ? '1px solid var(--celeste-border)' : '1px solid var(--border-white)',
          }}
        >
          {isLive && <span className="dot-live shrink-0" />}
          <span
            className="text-sm font-semibold truncate"
            style={{ color: isArgHome ? 'var(--celeste)' : 'var(--text-secondary)' }}
          >
            {argMatch.homeTeam}
          </span>
          <span
            className="font-mono-nums font-bold text-base shrink-0 px-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {homeScore} — {awayScore}
          </span>
          <span
            className="text-sm font-semibold truncate"
            style={{ color: !isArgHome ? 'var(--celeste)' : 'var(--text-secondary)' }}
          >
            {argMatch.awayTeam}
          </span>
          <span
            className="ml-auto text-xs shrink-0 font-mono-nums uppercase tracking-wider"
            style={{ color: isLive ? 'var(--celeste)' : 'var(--text-tertiary)' }}
          >
            {isLive && argMatch.minute ? argMatch.minute : argMatch.statusText}
          </span>
        </div>
      )
    }

    return (
      <div
        className="rounded-3xl p-5 space-y-4 relative overflow-hidden"
        style={{
          background: isLive
            ? 'linear-gradient(145deg, rgba(99,195,255,0.08) 0%, var(--bg-elevated) 70%)'
            : 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
          border: isLive ? '1px solid rgba(99,195,255,0.2)' : '1px solid var(--border-accent)',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isLive && <span className="dot-live" />}
          <span
            className="badge"
            style={
              isLive
                ? { background: 'var(--celeste-dim)', color: 'var(--celeste-bright)', border: '1px solid var(--celeste-border)' }
                : argMatch.status === 'post'
                  ? { background: 'rgba(74,90,128,0.2)', color: 'var(--text-tertiary)', border: '1px solid rgba(74,90,128,0.3)' }
                  : { background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }
            }
          >
            {isLive ? '🔴 En vivo' : argMatch.status === 'post' ? '✓ Final' : '⏰ Próximamente'}
          </span>
          {isLive && argMatch.minute && (
            <span className="font-mono-nums text-xs ml-auto" style={{ color: 'var(--celeste)' }}>
              {argMatch.minute}
            </span>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-between gap-3">
          <p
            className="font-display text-lg leading-tight text-center flex-1"
            style={{ color: isArgHome ? 'var(--celeste)' : 'var(--text-primary)' }}
          >
            {argMatch.homeTeam}
          </p>
          <div className="text-center shrink-0 min-w-[80px]">
            <span className="font-mono-nums font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
              {homeScore}
            </span>
            <span className="font-mono-nums text-xl mx-1" style={{ color: 'var(--text-muted)' }}>—</span>
            <span className="font-mono-nums font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
              {awayScore}
            </span>
          </div>
          <p
            className="font-display text-lg leading-tight text-center flex-1"
            style={{ color: !isArgHome ? 'var(--celeste)' : 'var(--text-primary)' }}
          >
            {argMatch.awayTeam}
          </p>
        </div>

        {/* Venue / status */}
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>{argMatch.statusText}</span>
          {argMatch.venue && <span>📍 {argMatch.venue}</span>}
        </div>
      </div>
    )
  }

  // ── No live / recent match — show next fixture ──────────────────────────────
  if (compact) {
    return (
      <div
        className="rounded-2xl px-4 py-2.5 flex items-center gap-2 overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)' }}
      >
        <span className="text-base">{nextFixture.flag}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {nextFixture.homeTeam} vs {nextFixture.awayTeam}
        </span>
        <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          {formatMatchDate(nextFixture.date)}
        </span>
      </div>
    )
  }

  return (
    <div
      className="rounded-3xl p-5 space-y-4"
      style={{
        background: 'linear-gradient(145deg, rgba(255,209,102,0.06) 0%, var(--bg-card) 60%)',
        border: '1px solid var(--border-gold)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{nextFixture.flag}</span>
        <span
          className="badge"
          style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
        >
          Próximo partido
        </span>
        <span className="ml-auto text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
          {nextFixture.round}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl text-center flex-1" style={{ color: 'var(--celeste)' }}>
          {nextFixture.homeTeam}
        </p>
        <span className="text-2xl font-bold shrink-0" style={{ color: 'var(--text-muted)' }}>vs</span>
        <p className="font-display text-xl text-center flex-1" style={{ color: 'var(--text-primary)' }}>
          {nextFixture.awayTeam}
        </p>
      </div>

      {/* Date + venue */}
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          📅 {formatMatchDate(nextFixture.date)}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          📍 {nextFixture.venue}
        </p>
      </div>
    </div>
  )
}
