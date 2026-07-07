'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Pool } from '@/lib/pools';
import { loadIdentity, generateUserId } from '@/lib/identity';
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

  const identity = loadIdentity();
  const participantId = identity?.userId || generateUserId();
  const username = identity?.username || '';

  useEffect(() => {
    requestNotificationPermission();
    const id = params.id as string;
    fetch(`/api/pools/${id}`).then((r) => r.json()).then((data) => {
      setPool(data);
      setLoading(false);
    }).catch(() => {
      toast('POZO no encontrado', 'error');
      setLoading(false);
    });
  }, [params.id, toast]);

  useEffect(() => {
    if (!pool) return;
    const channel = supabase
      .channel(`pool-detail-${pool.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pools', filter: `id=eq.${pool.id}` },
        async () => {
          const res = await fetch(`/api/pools/${pool.id}`);
          const fresh = await res.json();
          if (fresh?.events && pool) {
            for (const ev of fresh.events) {
              const old = pool.events.find((e: any) => e.id === ev.id);
              if (old && ev.voted?.length > old.voted?.length) {
                sendNotification('⚡ Evento actualizado', `${ev.label} — ${ev.voted.length} votos`);
              }
              if (ev.resolved && !old?.resolved) {
                sendNotification('🏆 Evento resuelto', ev.label);
              }
            }
          }
          setPool(fresh);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pool?.id]);

  const joinPool = async () => {
    if (!identity?.username) { toast('Poné un nombre de usuario primero', 'error'); return; }
    try {
      const res = await fetch(`/api/pools/${pool!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', participantId, username: identity.username, address: identity.address || '0x...', cabala: identity.cábala }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const fresh = await res.json();
      setPool(fresh);
      toast('Te uniste al POZO!', 'success');
    } catch (e: any) {
      toast(e.message || 'Error al unirse', 'error');
    }
  };

  const lockPool = async () => {
    await fetch(`/api/pools/${pool!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lock' }) });
    const res = await fetch(`/api/pools/${pool!.id}`);
    setPool(await res.json());
    toast('POZO cerrado', 'info');
  };

  const startPool = async () => {
    await fetch(`/api/pools/${pool!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
    const res = await fetch(`/api/pools/${pool!.id}`);
    setPool(await res.json());
    toast('Partido iniciado!', 'success');
  };

  const voteEvent = async (_: string, eventId: string, bidAmount?: number) => {
    await fetch(`/api/pools/${pool!.id}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', eventId, participantId, bidAmount }),
    });
    const res = await fetch(`/api/pools/${pool!.id}`);
    setPool(await res.json());
    toast('Voto registrado!', 'success');
  };

  const resolveEvent = async (_: string, eventId: string, winnerId: string) => {
    await fetch(`/api/pools/${pool!.id}/trigger`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolve', eventId, winnerId }) });
    const res = await fetch(`/api/pools/${pool!.id}`);
    setPool(await res.json());
    toast('Evento resuelto!', 'success');
  };

  const settlePool = async () => {
    await fetch(`/api/pools/${pool!.id}/distribute`, { method: 'POST' });
    const res = await fetch(`/api/pools/${pool!.id}`);
    setPool(await res.json());
    toast('POZO liquidado!', 'success');
  };

  const sharePool = (id: string) => {
    navigator.clipboard.writeText(window.location.href);
    toast('Link copiado!', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-8 w-40 rounded-lg mb-2" />
        <div className="skeleton h-4 w-52 rounded-lg mb-6" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-gray-500 font-medium">POZO no encontrado</p>
        <button onClick={() => router.push('/pool')} className="btn-primary text-sm">Ver POZOs</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/pool')} className="btn-primary text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition-all">
          ← POZOs
        </button>
      </div>
      <PoolDetail pool={pool} participantId={participantId} username={username}
        onJoin={joinPool} onLock={lockPool} onStart={startPool}
        onVote={voteEvent} onResolve={resolveEvent} onSettle={settlePool}
        onShare={sharePool} />
    </div>
  );
}
