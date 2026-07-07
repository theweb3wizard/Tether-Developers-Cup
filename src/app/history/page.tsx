'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type PoolStat = {
  id: string;
  name: string;
  match: string;
  totalPool: number;
  stake: number;
  participantCount: number;
  settledAt: string;
};

type UserStat = {
  username: string;
  poolsJoined: number;
  poolsWon: number;
  totalEarned: number;
  totalStaked: number;
  winRate: number;
};

export default function HistoryPage() {
  const [settledPools, setSettledPools] = useState<PoolStat[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/pools?status=settled').then((r) => r.json()),
    ]).then(([pools]) => {
      const settled: PoolStat[] = pools.map((p: any) => ({
        id: p.id,
        name: p.name,
        match: p.match,
        totalPool: p.totalPool,
        stake: p.stake,
        participantCount: p.participants.length,
        settledAt: p.settled_at || '—',
      }));
      setSettledPools(settled);

      const userMap = new Map<string, { joined: number; won: number; earned: number; staked: number }>();
      for (const p of pools) {
        for (const part of p.participants) {
          const u = userMap.get(part.id) || { joined: 0, won: 0, earned: 0, staked: 0 };
          u.joined++;
          u.staked += p.stake;
          if (p.events?.some((e: any) => e.winner === part.id)) u.won++;
          userMap.set(part.id, u);
        }
      }

      const winnerIds = new Set<string>();
      for (const p of pools) {
        for (const e of p.events || []) {
          if (e.winner) winnerIds.add(e.winner);
        }
      }

      const stats: UserStat[] = Array.from(userMap.entries())
        .map(([id, data]) => ({
          username: pools.find((p: any) => p.participants.some((pp: any) => pp.id === id))
            ?.participants.find((pp: any) => pp.id === id)?.username || id,
          poolsJoined: data.joined,
          poolsWon: data.won,
          totalEarned: data.earned,
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
        <div className="skeleton h-8 w-40 rounded-lg mb-2" />
        <div className="skeleton h-4 w-52 rounded-lg mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-5 w-36 rounded-lg" />
            <div className="skeleton h-3 w-48 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-blue">Historial</h1>
          <p className="text-gray-500 text-sm">POZOs cerrados y estadísticas</p>
        </div>
        <Link href="/pool" className="btn-primary text-sm">← POZOs</Link>
      </div>

      {settledPools.length === 0 ? (
        <div className="card text-center py-12 space-y-4">
          <div className="relative w-48 h-48 mx-auto">
            <img src="/IMG/empty-pozo.png" alt="Sin historial" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-gray-500 font-medium">No hay POZOs cerrados todavía</p>
            <p className="text-xs text-gray-400 mt-1">Cuando terminen, aparecen acá</p>
          </div>
          <Link href="/pool" className="btn-primary text-sm">Ver POZOs activos</Link>
        </div>
      ) : (
        <>
          <div className="card space-y-3">
            <h2 className="font-bold text-lg text-blue">Ranking</h2>
            {userStats.map((u, i) => (
              <div key={u.username} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    i === 0 ? 'bg-gold-dark' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-medium">{u.username}</span>
                </div>
                <div className="text-right text-xs">
                  <p className={u.winRate >= 50 ? 'text-green-600 font-semibold' : 'text-gray-500'}>{u.winRate}%</p>
                  <p className="text-gray-400">{u.poolsWon}/{u.poolsJoined} ganados</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-lg text-blue">POZOs Cerrados</h2>
            {settledPools.map((p) => (
              <div key={p.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-blue">{p.name}</h3>
                    <p className="text-xs text-gray-400">{p.match}</p>
                  </div>
                  <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Cerrado
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{p.participantCount} participantes</span>
                  <span className="font-bold text-gold-dark">${p.totalPool.toFixed(2)} pozo</span>
                  <span>${p.stake.toFixed(2)} c/u</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
