'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Pool } from '@/lib/pools';
import type { PoolEvent } from '@/lib/pools';
import { loadIdentity, saveIdentity, generateUserId } from '@/lib/identity';
import { useToast } from '@/components/Toast';
import PoolDetail from '@/components/PoolDetail';
import { requestNotificationPermission, sendNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);

  // Join-via-link state
  const [guestUsername, setGuestUsername] = useState('');
  const [joiningAsGuest, setJoiningAsGuest] = useState(false);

  const identity = loadIdentity();
  const participantId = identity?.userId || generateUserId();

  useEffect(() => {
    requestNotificationPermission();
    const id = params.id as string;
    fetch(`/api/pools/${id}`)
      .then((r) => r.json())
      .then((data) => { setPool(data); setLoading(false); })
      .catch(() => { toast('POZO no encontrado', 'error'); setLoading(false); });
  }, [params.id, toast]);

  useEffect(() => {
    if (!pool) return;
    const channel = supabase
      .channel(`pool-detail-${pool.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pools', filter: `id=eq.${pool.id}` },
        async () => {
          const res = await fetch(`/api/pools/${pool.id}`);
          const fresh = await res.json() as Pool;
          if (fresh?.events && pool) {
            for (const ev of fresh.events) {
              const old = pool.events.find((e: PoolEvent) => e.id === ev.id);
              if (old && ev.voted?.length > old.voted?.length)
                sendNotification('⚡ Evento actualizado', `${ev.label} — ${ev.voted.length} votos`);
              if (ev.resolved && !old?.resolved)
                sendNotification('🏆 Evento resuelto', ev.label);
            }
          }
          setPool(fresh);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool?.id]);

  const refreshPool = async () => {
    if (!pool) return;
    const res = await fetch(`/api/pools/${pool.id}`);
    setPool(await res.json());
  };

  /** Join pool for a brand new guest user (join-via-link flow) */
  const joinAsGuest = async () => {
    if (!guestUsername.trim()) { toast('Poné tu nombre primero', 'error'); return; }
    setJoiningAsGuest(true);
    try {
      const newUserId = generateUserId();
      // Create minimal identity
      saveIdentity({ userId: newUserId, username: guestUsername.trim(), address: '0x...' });

      const res = await fetch(`/api/pools/${pool!.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          participantId: newUserId,
          username: guestUsername.trim(),
          address: '0x...',
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setPool(await res.json());
      toast('Te uniste al POZO!', 'success');
      // Reload to pick up the new identity
      router.refresh();
    } catch (e: unknown) {
      toast((e as Error).message || 'Error al unirse', 'error');
    } finally {
      setJoiningAsGuest(false);
    }
  };

  const joinPool = async () => {
    if (!identity?.username) { toast('Poné un nombre de usuario primero', 'error'); return; }
    try {
      const res = await fetch(`/api/pools/${pool!.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', participantId, username: identity.username, address: identity.address || '0x...', cabala: identity.cábala }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setPool(await res.json());
      toast('Te uniste al POZO!', 'success');
    } catch (e: unknown) { toast((e as Error).message || 'Error al unirse', 'error'); }
  };

  const lockPool = async () => {
    await fetch(`/api/pools/${pool!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lock' }) });
    await refreshPool();
    toast('POZO cerrado', 'info');
  };

  const startPool = async () => {
    await fetch(`/api/pools/${pool!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
    await refreshPool();
    toast('Partido iniciado!', 'success');
  };

  const voteEvent = async (_: string, eventId: string, bidAmount?: number) => {
    await fetch(`/api/pools/${pool!.id}/trigger`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', eventId, participantId, bidAmount }),
    });
    await refreshPool();
    toast('Voto registrado!', 'success');
  };

  const resolveEvent = async (_: string, eventId: string, winnerId: string) => {
    await fetch(`/api/pools/${pool!.id}/trigger`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolve', eventId, winnerId }) });
    await refreshPool();
    toast('Evento resuelto!', 'success');
  };

  const settlePool = async () => {
    await fetch(`/api/pools/${pool!.id}/distribute`, { method: 'POST' });
    await refreshPool();
    toast('POZO liquidado!', 'success');
  };

  const sharePool = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('Link copiado!', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-8 w-40 mb-1" />
        <div className="skeleton h-3 w-52 mb-5" />
        <div className="skeleton h-48 rounded-3xl" />
        <div className="skeleton h-28 rounded-3xl" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <p className="text-2xl">😕</p>
        <p className="font-medium text-white">POZO no encontrado</p>
        <button onClick={() => router.push('/pool')} className="btn btn-primary text-sm">
          Ver POZOs
        </button>
      </div>
    );
  }

  // No identity + pool is open → show join-via-link prompt
  const showGuestJoin = !identity && pool.status === 'open';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <button
        onClick={() => router.push('/pool')}
        className="flex items-center gap-1.5 text-xs font-semibold transition-colors pt-2"
        style={{ color: 'var(--celeste)' }}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
          <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Volver a POZOs
      </button>

      {/* Join-via-link onboarding prompt */}
      {showGuestJoin && (
        <div
          className="rounded-3xl p-5 space-y-4 animate-scale-in"
          style={{
            background: 'linear-gradient(145deg, rgba(255,209,102,0.08) 0%, var(--bg-elevated) 100%)',
            border: '1px solid rgba(255,209,102,0.25)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          <div className="space-y-1">
            <h3 className="font-display text-xl text-white">Unirte al POZO</h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Te compartieron este POZO. Elegí un nombre para unirte ahora.
            </p>
          </div>
          <div className="space-y-2">
            <input
              className="input"
              placeholder="Tu nombre (Cebolla, El Bicho...)"
              value={guestUsername}
              onChange={(e) => setGuestUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinAsGuest()}
              autoFocus
            />
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={joinAsGuest}
              disabled={!guestUsername.trim() || joiningAsGuest}
              className="btn btn-gold flex-1"
            >
              {joiningAsGuest ? 'Uniéndose...' : '⚡ Unirme al POZO'}
            </button>
            <button
              onClick={() => router.push('/onboarding')}
              className="btn btn-ghost text-xs px-3"
            >
              Registro completo
            </button>
          </div>
        </div>
      )}

      <PoolDetail
        pool={pool}
        participantId={participantId}
        onJoin={joinPool}
        onLock={lockPool}
        onStart={startPool}
        onVote={voteEvent}
        onResolve={resolveEvent}
        onSettle={settlePool}
        onShare={sharePool}
      />
    </div>
  );
}
