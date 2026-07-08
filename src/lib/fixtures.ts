export type Fixture = {
  id: string
  homeTeam: string
  awayTeam: string
  date: string // ISO 8601 UTC
  venue: string
  round: string
  flag: string
}

/**
 * Argentina's remaining 2026 World Cup fixtures.
 * All times are UTC. Argentina is UTC-3, so:
 *   QF  — Jul 11 @ 9 PM ET  = Jul 12 01:00 UTC
 *   SF  — Jul 14 @ 9 PM ET  = Jul 15 01:00 UTC
 *   Final — Jul 19 @ 3 PM ET = Jul 19 19:00 UTC
 */
export const ARGENTINA_FIXTURES: Fixture[] = [
  {
    id: 'arg-qf',
    homeTeam: 'Argentina',
    awayTeam: 'Switzerland',
    date: '2026-07-12T01:00:00Z', // Jul 11 9PM ET
    venue: 'Arrowhead Stadium, Kansas City',
    round: 'Cuartos de Final',
    flag: '🇦🇷',
  },
  {
    id: 'arg-sf',
    homeTeam: 'Argentina',
    awayTeam: 'TBD',
    date: '2026-07-15T01:00:00Z', // Jul 14 9PM ET
    venue: 'AT&T Stadium, Arlington TX',
    round: 'Semifinal',
    flag: '🇦🇷',
  },
  {
    id: 'arg-final',
    homeTeam: 'Argentina',
    awayTeam: 'TBD',
    date: '2026-07-19T19:00:00Z', // Jul 19 3PM ET
    venue: 'MetLife Stadium, East Rutherford NJ',
    round: 'Final',
    flag: '🇦🇷',
  },
]

// ─── Per-stage event presets ─────────────────────────────────────────────────
export const EVENTS_BY_STAGE: Record<string, string[]> = {
  'arg-qf': [
    'Messi gol',
    'Gol de Lautaro',
    'Dibu ataja penal',
    'Tarjeta amarilla',
    'VAR review',
    'Gol antes del 30',
    'Córner para Argentina',
    'Cambio de Messi',
  ],
  'arg-sf': [
    'Messi gol',
    'Gol de Di María',
    'Dibu ataja penal',
    'Tarjeta amarilla',
    'VAR review',
    'Primer gol argentino',
    'Córner para Argentina',
    'Gol en tiempo extra',
  ],
  'arg-final': [
    'Messi gol',
    'Gol de Lautaro',
    'Dibu ataja penal',
    'Tarjeta roja',
    'VAR review',
    'Primer gol del mundo',
    'Penal para Argentina',
    'Gol en el 2do tiempo',
  ],
  default: [
    'Messi gol',
    'Dibu ataja',
    'Tarjeta amarilla',
    'VAR review',
    'Gol en primer tiempo',
    'Córner para Argentina',
  ],
}

// ─── Fixture helpers ─────────────────────────────────────────────────────────

/** Returns fixtures whose kickoff date is today or in the future (UTC). */
export function getUpcomingFixtures(): Fixture[] {
  const now = new Date()
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return ARGENTINA_FIXTURES.filter((f) => new Date(f.date).getTime() >= todayUTC)
}

/** Returns the soonest upcoming fixture, falling back to the last fixture. */
export function getCurrentMatch(): Fixture {
  const upcoming = getUpcomingFixtures()
  return upcoming[0] ?? ARGENTINA_FIXTURES[ARGENTINA_FIXTURES.length - 1]
}

// ─── ESPN live score types ────────────────────────────────────────────────────
export type LiveScore = {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: 'pre' | 'in' | 'post'
  statusText: string
  minute?: string
  matchId: string
  matchDate: string // ISO date of the match
}
