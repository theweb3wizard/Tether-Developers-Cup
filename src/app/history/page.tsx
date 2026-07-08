'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type PoolStat = {
  id: string; name: string; match: string;
  totalPool: number; stake: number; participantCount: number; settledAt: string;
};

type UserStat = {
  username: string; poolsJoined: number; poolsWon: number;
  totalEarned: number; totalStaked: number; winRate: number;
};

type RawPool = {
  id: string; name: string; match: string;
  totalPool: number; stake: number;
  participants: { id: string; username: string }[];
  events: { winner?: string }[];
  settled_at?: string;
};

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg, #FFD166, #E5A800)', shadow: '0 0 12px rgba(255,209,102,0.4)', text: '#04060D' },
  { bg: 'linear-gradient(135deg, #C0C8D8, #8A9BC4)', shadow: '0 0 8px rgba(192,200,216,0.3)', text: '#04060D' },
  { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', shadow: '0 0 8px rgba(205,127,50,0.3)', text: '#FFFFFF' },
];

export default function HistoryPage() {
  const [settledPools, setSettledPools] = useState<PoolStat[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pools?status=settled').then((r) => r.json()).then((pools: RawPool[]) => {
      const settled: PoolStat[] = pools.map((p) => ({
        id: p.id, name: p.name, match: p.match, totalPool: p.totalPool,
        stake: p.stake, participantCount: p.participants.length, settledAt: p.settled_at || '—',
      }));
      setSettledPools(settled);

      const userMap = new Map<string, { joined: number; won: number; earned: number; staked: number }>();
      for (const p of pools) {
        for (const part of p.participants) {
          const u = userMap.get(part.id) || { joined: 0, won: 0, earned: 0, staked: 0 };
          u.joined++; u.staked += p.stake;
          if (p.events?.some((e) => e.winner === part.id)) u.won++;
          userMap.set(part.id, u);
        }
      }

      const stats: UserStat[] = Array.from(userMap.entries())
        .map(([id, data]) => ({
          username: pools.find((p) => p.participants.some((pp) => pp.id === id))
            ?.participants.find((pp) => pp.id === id)?.username || id,
          poolsJoined: data.joined, poolsWon: data.won, totalEarned: data.earned,
          totalStaked: data.staked,
          winRate: data.joined > 0 ? Math.round((data.won / data.joined) * 100) : 0,
        }))
        .sort((a, b) => b.poolsWon - a.poolsWon || b.totalEarned - a.totalEarned);

      setUserStats(stats);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-8 w-32 mb-1" />
        <div className="skeleton h-3 w-44 mb-5" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)' }}>
            <div className="skeleton h-5 w-36" />
            <div className="skeleton h-3 w-48" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl text-white">Historial</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>POZOs cerrados y estadísticas</p>
        </div>
        <Link
          href="/pool"
          className="flex items-center gap-1 text-xs font-semibold transition-colors"
          style={{ color: 'var(--celeste)' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          POZOs
        </Link>
      </div>

      {settledPools.length === 0 ? (
        <div
          className="rounded-3xl text-center py-14 space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)' }}
        >
          <div className="w-36 h-36 mx-auto opacity-50">
            <img src="/IMG/empty-pozo.png" alt="Sin historial" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-medium text-white">No hay POZOs cerrados todavía</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Cuando terminen, aparecen acá</p>
          </div>
          <Link href="/pool" className="btn btn-primary text-sm inline-flex">Ver POZOs activos</Link>
        </div>
      ) : (
        <div className="space-y-5 stagger">

          {/* Ranking card */}
          <div
            className="rounded-3xl p-5 space-y-4"
            style={{
              background: 'linear-gradient(145deg, rgba(255,209,102,0.07) 0%, var(--bg-card) 70%)',
              border: '1px solid rgba(255,209,102,0.18)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="font-display text-xl" style={{ color: 'var(--gold)' }}>Ranking</h2>
            </div>

            <div className="space-y-2">
              {userStats.map((u, i) => {
                const rankStyle = RANK_STYLES[i] || null;
                return (
                  <div
                    key={u.username}
                    className="flex items-center justify-between px-3 py-3 rounded-2xl transition-all"
                    style={{
                      background: i === 0 ? 'rgba(255,209,102,0.06)' : 'rgba(255,255,255,0.025)',
                      border: i === 0 ? '1px solid rgba(255,209,102,0.15)' : '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-none"
                        style={rankStyle
                          ? { background: rankStyle.bg, boxShadow: rankStyle.shadow, color: rankStyle.text }
                          : { background: 'rgba(255,255,255,0.08)', color: 'var(--text-tertiary)' }
                        }
                      >
                        {i + 1}
                      </div>
                      <span className="font-semibold text-sm text-white">{u.username}</span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <p
                        className="text-sm font-bold font-mono-nums"
                        style={{ color: u.winRate >= 50 ? 'var(--success)' : 'var(--text-secondary)' }}
                      >
                        {u.winRate}%
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {u.poolsWon}/{u.poolsJoined} ganados
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settled pools list */}
          <div className="space-y-3">
            <h2 className="font-display text-lg text-white px-1">POZOs Cerrados</h2>
            {settledPools.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl p-5 space-y-3"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-white)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-base text-white truncate">{p.name}</h3>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{p.match}</p>
                  </div>
                  <span className="badge badge-settled flex-none">Cerrado</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Jugadores', value: `${p.participantCount}`, color: 'var(--text-primary)' },
                    { label: 'POZO total', value: `$${p.totalPool.toFixed(2)}`, color: 'var(--gold)' },
                    { label: 'Stake c/u', value: `$${p.stake.toFixed(2)}`, color: 'var(--celeste)' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl p-2.5 text-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <p className="font-mono-nums text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[9px] mt-0.5 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
