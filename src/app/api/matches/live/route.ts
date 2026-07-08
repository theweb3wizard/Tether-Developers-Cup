import { NextResponse } from 'next/server'

export type MatchScore = {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: 'pre' | 'in' | 'post'
  statusText: string // "HT", "FT", "45'", "Upcoming" etc
  minute?: string
  date: string
  venue?: string
}

export async function GET() {
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
      { next: { revalidate: 30 } }
    )

    if (!res.ok) {
      return NextResponse.json([], { status: 200 })
    }

    const json = await res.json()
    const events: unknown[] = json?.events ?? []

    const matches: MatchScore[] = events.map((evt) => {
      const event = evt as Record<string, unknown>
      const comp = (event.competitions as Record<string, unknown>[])?.[0] ?? {}

      const competitors = (comp.competitors as Record<string, unknown>[]) ?? []
      const homeComp = competitors.find(
        (c) => (c as Record<string, unknown>).homeAway === 'home'
      ) as Record<string, unknown> | undefined
      const awayComp = competitors.find(
        (c) => (c as Record<string, unknown>).homeAway === 'away'
      ) as Record<string, unknown> | undefined

      const homeTeam =
        ((homeComp?.team as Record<string, unknown>)?.displayName as string) ?? 'Home'
      const awayTeam =
        ((awayComp?.team as Record<string, unknown>)?.displayName as string) ?? 'Away'

      const statusObj = (comp.status as Record<string, unknown>) ?? {}
      const statusType =
        ((statusObj.type as Record<string, unknown>)?.name as string) ?? ''
      const statusText =
        ((statusObj.type as Record<string, unknown>)?.description as string) ?? ''
      const minute = statusObj.displayClock as string | undefined

      let status: 'pre' | 'in' | 'post' = 'pre'
      if (statusType === 'STATUS_IN_PROGRESS') status = 'in'
      else if (
        statusType === 'STATUS_FINAL' ||
        statusType === 'STATUS_FULL_TIME'
      )
        status = 'post'

      const venueObj = (comp.venue as Record<string, unknown>) ?? {}
      const venue = (venueObj.fullName as string) ?? undefined

      return {
        id: event.id as string,
        homeTeam,
        awayTeam,
        homeScore: Number(homeComp?.score ?? 0),
        awayScore: Number(awayComp?.score ?? 0),
        status,
        statusText,
        minute,
        date: (event.date as string) ?? '',
        venue,
      }
    })

    return NextResponse.json(matches, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
