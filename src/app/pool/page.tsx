'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Pool } from '@/lib/pools';
import { loadIdentity, saveIdentity, generateUserId } from '@/lib/identity';
import { useToast } from '@/components/Toast';
import PoolDetail from '@/components/PoolDetail';
import { requestNotificationPermission, sendNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

export default function PoolPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  const identity = loadIdentity();
  const [participantId, setParticipantId] = useState(identity?.userId || generateUserId());
  const [username, setUsername] = useState(identity?.username || '');
  const [address, setAddress] = useState(identity?.address || '');
  const { toast } = useToast();

  const [newPool, setNewPool] = useState({
    name: '',
    stake: 5,
    capacity: 6,
    events: ['Messi gol'] as string[],
  });

  const eventOptions = [
    'Messi gol',
    'Tarjeta amarilla',
    'Dibu ataja',
    'VAR review',
    'Gol en primer tiempo',
    'Córner para Argentina',
    'Salah al palo',
    'Cambio de Messi',
  ];

  const persistIdentity = useCallback(() => {
    if (username) {
      saveIdentity({ userId: participantId, username, address: address || '0x...' });
    }
  }, [participantId, username, address]);

  useEffect(() => { persistIdentity(); }, [persistIdentity]);

  const fetchPools = useCallback(async () => {
    try {
      const res = await fetch('/api/pools');
      setPools(await res.json());
    } catch {
      setError('No se pudieron cargar los POZOs');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!selectedPool) return;
    const channel = supabase
      .channel(`pool-${selectedPool.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pools', filter: `id=eq.${selectedPool.id}` },
        async () => {
          const res = await fetch(`/api/pools/${selectedPool.id}`);
          const fresh = await res.json();
          if (fresh?.events && selectedPool) {
            for (const ev of fresh.events) {
              const old = selectedPool.events.find((e: any) => e.id === ev.id);
              if (old && ev.voted?.length > old.voted?.length) {
                sendNotification('⚡ Evento actualizado', `${ev.label} — ${ev.voted.length} votos`);
              }
              if (ev.resolved && !old?.resolved) {
                sendNotification('🏆 Evento resuelto', ev.label);
              }
            }
          }
          setSelectedPool(fresh);
          setPools((prev) => prev.map((p) => (p.id === fresh.id ? fresh : p)));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedPool?.id]);

  const fetchPool = async (id: string) => {
    const res = await fetch(`/api/pools/${id}`);
    const data = await res.json();
    setSelectedPool(data);
    setPools((prev) => prev.map((p) => (p.id === id ? data : p)));
  };

  const createPool = async () => {
    if (!username) { toast('Poné un nombre de usuario primero', 'error'); return; }
    try {
      const res = await fetch('/api/pools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPool,
          name: newPool.name || `Pozo del ${new Date().toLocaleDateString('es-AR')}`,
          hostId: participantId,
          hostUsername: username,
          hostAddress: address || '0x...',
          hostCabala: identity?.cábala,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewPool({ name: '', stake: 5, capacity: 6, events: ['Messi gol'] });
        fetchPools();
        toast('POZO creado! Compartí el link con tus amigos', 'success');
      }
    } catch {
      toast('Error al crear POZO', 'error');
    }
  };

  const joinPool = async (poolId: string) => {
    if (!username) { toast('Poné un nombre de usuario primero', 'error'); return; }
    try {
      const res = await fetch(`/api/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', participantId, username, address: address || '0x...', cabala: identity?.cábala }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      fetchPool(poolId);
      toast('Te uniste al POZO!', 'success');
    } catch (e: any) {
      toast(e.message || 'Error al unirse', 'error');
    }
  };

  const lockPool = async (poolId: string) => {
    await fetch(`/api/pools/${poolId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lock' }) });
    toast('POZO cerrado — comenzó el partido!', 'info');
  };

  const startPool = async (poolId: string) => {
    await fetch(`/api/pools/${poolId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
    toast('Partido iniciado! A vivir los eventos ⚡', 'success');
  };

  const voteEvent = async (poolId: string, eventId: string, bidAmount?: number) => {
    await fetch(`/api/pools/${poolId}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', eventId, participantId, bidAmount }),
    });
    toast('Voto registrado!', 'success');
  };

  const resolveEvent = async (poolId: string, eventId: string, winnerId: string) => {
    await fetch(`/api/pools/${poolId}/trigger`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolve', eventId, winnerId }) });
    toast('Evento resuelto!', 'success');
  };

  const settlePool = async (poolId: string) => {
    await fetch(`/api/pools/${poolId}/distribute`, { method: 'POST' });
    toast('POZO liquidado!', 'success');
  };

  const addEvent = (e: string) => {
    if (!newPool.events.includes(e)) setNewPool({ ...newPool, events: [...newPool.events, e] });
  };
  const removeEvent = (e: string) => {
    setNewPool({ ...newPool, events: newPool.events.filter((ev) => ev !== e) });
  };

  const sharePool = (poolId: string) => {
    const url = `${window.location.origin}/pool/${poolId}`;
    navigator.clipboard.writeText(url);
    toast('Link copiado al portapapeles!', 'success');
  };

  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800 border-green-200',
    locked: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    settled: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  const statusLabels: Record<string, string> = {
    open: 'Abierto', locked: 'Trabado', active: 'En vivo', settled: 'Liquidado',
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-8 w-32 rounded-lg mb-2" />
        <div className="skeleton h-4 w-48 rounded-lg mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-5 w-40 rounded-lg" />
            <div className="skeleton h-3 w-24 rounded-lg mt-2" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-blue">POZOs</h1>
          <p className="text-gray-500 text-sm">Pools para la Scaloneta</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelectedPool(null)}
            className={`text-sm px-3 py-1.5 rounded-lg font-semibold transition-all ${selectedPool ? 'btn-primary' : 'hidden'}`}>
            ← Volver
          </button>
          <Link href="/history" className="text-xs text-celeste-dark font-semibold hover:underline self-center">
            Historial
          </Link>
          <button onClick={() => setShowCreate(true)} className="btn-gold text-sm">+ Nuevo POZO</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>
      )}

      {!identity && (
        <div className="card space-y-3 border-2 border-celeste/40 bg-gradient-to-br from-celeste/[0.03] to-white">
          <h3 className="font-bold text-sm text-blue">Tu identidad</h3>
          <p className="text-xs text-gray-400">Se guarda automáticamente en tu navegador</p>
          <input className="input-field text-sm" placeholder="Nombre de usuario" value={username}
            onChange={(e) => setUsername(e.target.value)} />
          <input className="input-field text-sm" placeholder="Dirección wallet (0x...)" value={address}
            onChange={(e) => setAddress(e.target.value)} />
        </div>
      )}

      {showCreate && (
        <div className="card space-y-4 border-2 border-gold/60 shadow-lg">
          <h2 className="font-bold text-lg text-blue">Crear POZO</h2>
          <input className="input-field" placeholder="Nombre del POZO"
            value={newPool.name} onChange={(e) => setNewPool({ ...newPool, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Stake (USDt)</label>
              <input type="number" className="input-field" value={newPool.stake}
                onChange={(e) => setNewPool({ ...newPool, stake: Math.max(1, Number(e.target.value)) })} min={1} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Capacidad</label>
              <input type="number" className="input-field" value={newPool.capacity}
                onChange={(e) => setNewPool({ ...newPool, capacity: Math.min(20, Math.max(2, Number(e.target.value))) })} min={2} max={20} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Eventos</label>
            <div className="flex flex-wrap gap-1.5">
              {newPool.events.map((ev) => (
                <span key={ev} className="bg-celeste/20 text-blue text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 border border-celeste/20">
                  {ev} <button onClick={() => removeEvent(ev)} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
                </span>
              ))}
            </div>
            <select className="input-field text-sm"
              onChange={(e) => { if (e.target.value) { addEvent(e.target.value); e.target.value = ''; } }}>
              <option value="">+ Agregar evento</option>
              {eventOptions.filter((o) => !newPool.events.includes(o)).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={createPool} disabled={!username}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">Crear POZO</button>
            <button onClick={() => setShowCreate(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 flex-1 rounded-xl font-semibold transition-all">Cancelar</button>
          </div>
        </div>
      )}

      {selectedPool ? (
        <PoolDetail pool={selectedPool} participantId={participantId} username={username}
          onJoin={joinPool} onLock={lockPool} onStart={startPool}
          onVote={voteEvent} onResolve={resolveEvent} onSettle={settlePool}
          onShare={sharePool} />
      ) : pools.length === 0 ? (
        <div className="card text-center py-12 space-y-4">
          <div className="relative w-48 h-48 mx-auto">
            <img src="/IMG/empty-pozo.png" alt="No hay POZOs" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-gray-500 font-medium">Todavía no hay POZOs</p>
            <p className="text-xs text-gray-400 mt-1">Creá el primero y empezá la previa</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">Crear el primer POZO</button>
        </div>
      ) : (
        pools.map((pool) => (
          <div key={pool.id} className="card space-y-3 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => setSelectedPool(pool)}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-blue">{pool.name}</h3>
                <p className="text-xs text-gray-500">{pool.match}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[pool.status]}`}>
                {statusLabels[pool.status]}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-celeste/10 rounded-xl p-2.5">
                <p className="font-bold text-blue">{pool.stake} USDt</p>
                <p className="text-gray-500 mt-0.5">Stake</p>
              </div>
              <div className="bg-gold/10 rounded-xl p-2.5">
                <p className="font-bold text-gold-dark">{pool.participants.length}/{pool.capacity}</p>
                <p className="text-gray-500 mt-0.5">Players</p>
              </div>
              <div className="bg-green-50 rounded-xl p-2.5">
                <p className="font-bold text-green-700">{pool.totalPool} USDt</p>
                <p className="text-gray-500 mt-0.5">Total</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-2.5">
                <p className="font-bold text-purple-700">{pool.events.length}</p>
                <p className="text-gray-500 mt-0.5">Eventos</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}


