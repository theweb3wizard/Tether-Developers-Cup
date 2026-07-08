'use client';

import { useState, useEffect } from 'react';
import type { Pool } from '@/lib/pools';
import { loadIdentity, saveIdentity, generateUserId } from '@/lib/identity';
import { useToast } from '@/components/Toast';
import PoolDetail from '@/components/PoolDetail';
import { requestNotificationPermission, sendNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { getUpcomingFixtures, EVENTS_BY_STAGE, type Fixture } from '@/lib/fixtures';

const STATUS_META: Record<string, { label: string; badge: string; color: string }> = {
  open: { label: 'Abierto', badge: 'badge-open', color: 'var(--success)' },
  locked: { label: 'Trabado', badge: 'badge-locked', color: 'var(--warning)' },
  active: { label: 'En vivo', badge: 'badge-active', color: 'var(--celeste)' },
  settled: { label: 'Liquidado', badge: 'badge-settled', color: 'var(--text-tertiary)' },
};

function formatFixtureDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    });
  } catch {
    return isoDate;
  }
}

export default function PoolPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  const identity = loadIdentity();
  const [participantId] = useState(identity?.userId || generateUserId());
  const [username, setUsername] = useState(identity?.username || '');
  const [address, setAddress] = useState(identity?.address || '');
  const { toast } = useToast();

  // Fixture selector
  const upcomingFixtures = getUpcomingFixtures();
  const defaultFixture = upcomingFixtures[0] ?? null;
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(defaultFixture?.id ?? 'arg-qf');

  const selectedFixture: Fixture | undefined =
    upcomingFixtures.find((f) => f.id === selectedFixtureId) ?? upcomingFixtures[0];

  const defaultEvents = selectedFixture
    ? (EVENTS_BY_STAGE[selectedFixture.id] ?? EVENTS_BY_STAGE.default)
    : EVENTS_BY_STAGE.default;

  const [newPool, setNewPool] = useState({
    name: '', stake: 5, capacity: 6, events: defaultEvents as string[],
  });

  // When fixture selection changes, update events
  const handleFixtureSelect = (fixtureId: string) => {
    setSelectedFixtureId(fixtureId);
    const fix = upcomingFixtures.find((f) => f.id === fixtureId);
    if (fix) {
      setNewPool((prev) => ({
        ...prev,
        events: EVENTS_BY_STAGE[fix.id] ?? EVENTS_BY_STAGE.default,
      }));
    }
  };

  const allEventOptions: string[] = selectedFixture
    ? (EVENTS_BY_STAGE[selectedFixture.id] ?? EVENTS_BY_STAGE.default)
    : EVENTS_BY_STAGE.default;

  useEffect(() => {
    if (username) saveIdentity({ userId: participantId, username, address: address || '0x...' });
  }, [participantId, username, address]);

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/pools');
      setPools(await res.json());
    } catch { setError('No se pudieron cargar los POZOs'); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchPools(); }, []);
  useEffect(() => { requestNotificationPermission(); }, []);

  useEffect(() => {
    if (!selectedPool) return;
    const channel = supabase
      .channel(`pool-${selectedPool.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pools', filter: `id=eq.${selectedPool.id}` },
        async () => {
          const res = await fetch(`/api/pools/${selectedPool.id}`);
          const fresh = await res.json() as Pool;
          if (fresh?.events && selectedPool) {
            for (const ev of fresh.events) {
              const old = selectedPool.events.find((e) => e.id === ev.id);
              if (old && ev.voted?.length > old.voted?.length)
                sendNotification('⚡ Evento actualizado', `${ev.label} — ${ev.voted.length} votos`);
              if (ev.resolved && !old?.resolved)
                sendNotification('🏆 Evento resuelto', ev.label);
            }
          }
          setSelectedPool(fresh);
          setPools((prev) => prev.map((p) => (p.id === fresh.id ? fresh : p)));
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPool?.id]);

  const fetchPool = async (id: string) => {
    const res = await fetch(`/api/pools/${id}`);
    const data = await res.json();
    setSelectedPool(data);
    setPools((prev) => prev.map((p) => (p.id === id ? data : p)));
  };

  const createPool = async () => {
    if (!username) { toast('Poné un nombre de usuario primero', 'error'); return; }
    const matchLabel = selectedFixture
      ? `${selectedFixture.homeTeam} vs ${selectedFixture.awayTeam} — ${selectedFixture.round}`
      : 'Argentina — Próximo partido';
    try {
      const res = await fetch('/api/pools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPool,
          name: newPool.name || `Pozo del ${new Date().toLocaleDateString('es-AR')}`,
          match: matchLabel,
          hostId: participantId, hostUsername: username,
          hostAddress: address || '0x...', hostCabala: identity?.cábala,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewPool({ name: '', stake: 5, capacity: 6, events: defaultEvents });
        fetchPools();
        toast('POZO creado! Compartí el link', 'success');
      }
    } catch { toast('Error al crear POZO', 'error'); }
  };

  const joinPool = async (poolId: string) => {
    if (!username) { toast('Poné un nombre de usuario primero', 'error'); return; }
    try {
      const res = await fetch(`/api/pools/${poolId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', participantId, username, address: address || '0x...', cabala: identity?.cábala }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      fetchPool(poolId);
      toast('Te uniste al POZO!', 'success');
    } catch (e: unknown) { toast((e as Error).message || 'Error al unirse', 'error'); }
  };

  const lockPool = async (poolId: string) => {
    await fetch(`/api/pools/${poolId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lock' }) });
    toast('POZO cerrado — comenzó el partido!', 'info');
  };
  const startPool = async (poolId: string) => {
    await fetch(`/api/pools/${poolId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
    toast('Partido iniciado!', 'success');
  };
  const voteEvent = async (poolId: string, eventId: string, bidAmount?: number) => {
    await fetch(`/api/pools/${poolId}/trigger`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', eventId, participantId, bidAmount }),
    });
    fetchPool(poolId);
    toast('Voto registrado!', 'success');
  };
  const resolveEvent = async (poolId: string, eventId: string, winnerId: string) => {
    await fetch(`/api/pools/${poolId}/trigger`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolve', eventId, winnerId }) });
    fetchPool(poolId);
    toast('Evento resuelto!', 'success');
  };
  const settlePool = async (poolId: string) => {
    await fetch(`/api/pools/${poolId}/distribute`, { method: 'POST' });
    fetchPool(poolId);
    toast('POZO liquidado!', 'success');
  };
  const sharePool = (poolId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/pool/${poolId}`);
    toast('Link copiado!', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-8 w-28 mb-1" />
        <div className="skeleton h-3 w-44 mb-5" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)' }}>
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-3 w-24" />
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4].map((j) => <div key={j} className="skeleton h-14 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl text-white">POZOs</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Pools para la Scaloneta</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn btn-gold text-sm"
          style={{ padding: '0.5rem 1.1rem', minHeight: '38px' }}
        >
          + Nuevo
        </button>
      </div>

      {error && (
        <div className="rounded-2xl p-3 text-sm" style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Identity prompt if not set */}
      {!identity && (
        <div className="rounded-3xl p-4 space-y-3" style={{ background: 'rgba(99,195,255,0.05)', border: '1px solid var(--celeste-border)' }}>
          <h3 className="font-semibold text-sm text-white">Tu identidad</h3>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Se guarda automáticamente en tu navegador</p>
          <input className="input text-sm" placeholder="Nombre de usuario" value={username}
            onChange={(e) => setUsername(e.target.value)} />
          <input className="input text-sm" placeholder="Dirección wallet (0x...) — opcional" value={address}
            onChange={(e) => setAddress(e.target.value)} />
        </div>
      )}

      {/* Create panel */}
      {showCreate && (
        <div
          className="rounded-3xl p-5 space-y-4 animate-scale-in"
          style={{
            background: 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
            border: '1px solid var(--border-accent)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          <h2 className="font-display text-lg text-white">Crear POZO</h2>

          <input className="input" placeholder="Nombre del POZO"
            value={newPool.name} onChange={(e) => setNewPool({ ...newPool, name: e.target.value })} />

          {/* Fixture selector */}
          {upcomingFixtures.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                Partido
              </label>
              <div className="space-y-2">
                {upcomingFixtures.map((fixture) => {
                  const isSelected = selectedFixtureId === fixture.id;
                  return (
                    <button
                      key={fixture.id}
                      type="button"
                      onClick={() => handleFixtureSelect(fixture.id)}
                      className="w-full rounded-2xl p-3.5 text-left transition-all duration-200"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(99,195,255,0.1) 0%, var(--bg-card) 100%)'
                          : 'rgba(255,255,255,0.02)',
                        border: isSelected
                          ? '1px solid var(--celeste-border)'
                          : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: isSelected ? '0 0 16px rgba(99,195,255,0.1)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0">{fixture.flag}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-white truncate">
                              {fixture.homeTeam} vs {fixture.awayTeam}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                              {fixture.round} · {formatFixtureDate(fixture.date)}
                            </p>
                          </div>
                        </div>
                        <div
                          className="shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                          style={{
                            borderColor: isSelected ? 'var(--celeste)' : 'rgba(255,255,255,0.2)',
                            background: isSelected ? 'var(--celeste)' : 'transparent',
                          }}
                        >
                          {isSelected && (
                            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="#04060D" strokeWidth={2}>
                              <polyline points="2,5 4,7 8,3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                        📍 {fixture.venue}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Stake (USDt)</label>
              <input type="number" className="input" value={newPool.stake}
                onChange={(e) => setNewPool({ ...newPool, stake: Math.max(1, Number(e.target.value)) })} min={1} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Capacidad</label>
              <input type="number" className="input" value={newPool.capacity}
                onChange={(e) => setNewPool({ ...newPool, capacity: Math.min(20, Math.max(2, Number(e.target.value))) })} min={2} max={20} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Eventos</label>
            <div className="flex flex-wrap gap-1.5">
              {newPool.events.map((ev) => (
                <span key={ev}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--celeste-dim)', color: 'var(--celeste)', border: '1px solid var(--celeste-border)' }}
                >
                  {ev}
                  <button
                    onClick={() => setNewPool({ ...newPool, events: newPool.events.filter((e) => e !== ev) })}
                    className="font-bold leading-none transition-opacity hover:opacity-60"
                    style={{ color: 'var(--danger)' }}
                  >&times;</button>
                </span>
              ))}
            </div>
            <select className="select text-sm w-full"
              onChange={(e) => { if (e.target.value) { setNewPool({ ...newPool, events: [...newPool.events, e.target.value] }); e.target.value = ''; } }}>
              <option value="">+ Agregar evento</option>
              {allEventOptions.filter((o) => !newPool.events.includes(o)).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5">
            <button onClick={createPool} disabled={!username} className="btn btn-primary flex-1">
              Crear POZO
            </button>
            <button onClick={() => setShowCreate(false)} className="btn btn-ghost flex-1">Cancelar</button>
          </div>
        </div>
      )}

      {/* Pool view or list */}
      {selectedPool ? (
        <>
          <button
            onClick={() => setSelectedPool(null)}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: 'var(--celeste)' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver a POZOs
          </button>
          <PoolDetail pool={selectedPool} participantId={participantId}
            onJoin={joinPool} onLock={lockPool} onStart={startPool}
            onVote={voteEvent} onResolve={resolveEvent} onSettle={settlePool}
            onShare={sharePool} />
        </>
      ) : pools.length === 0 ? (
        <div
          className="rounded-3xl text-center py-14 space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)' }}
        >
          <div className="w-36 h-36 mx-auto opacity-50">
            <img src="/IMG/empty-pozo.png" alt="No hay POZOs" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-medium text-white">Todavía no hay POZOs</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Creá el primero y empezá la previa</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
            Crear primer POZO
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pools.map((pool) => {
            const meta = STATUS_META[pool.status] || STATUS_META.settled;
            const isLive = pool.status === 'active';
            return (
              <div
                key={pool.id}
                className="rounded-3xl p-5 space-y-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: isLive
                    ? 'linear-gradient(145deg, rgba(99,195,255,0.07) 0%, var(--bg-card) 70%)'
                    : 'var(--bg-card)',
                  border: isLive ? '1px solid rgba(99,195,255,0.18)' : '1px solid var(--border-white)',
                  boxShadow: isLive ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
                }}
                onClick={() => setSelectedPool(pool)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {isLive && <span className="dot-live" />}
                      <h3 className="font-display text-lg text-white">{pool.name}</h3>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{pool.match}</p>
                  </div>
                  <span className={`badge ${meta.badge}`}>{meta.label}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { value: `${pool.stake}`, label: 'Stake', color: 'var(--celeste)' },
                    { value: `${pool.participants.length}/${pool.capacity}`, label: 'Players', color: 'var(--text-primary)' },
                    { value: `${pool.totalPool}`, label: 'POZO', color: 'var(--gold)' },
                    { value: `${pool.events.length}`, label: 'Eventos', color: 'var(--violet)' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl p-2.5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <p className="font-mono-nums text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
