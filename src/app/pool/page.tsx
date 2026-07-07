'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Pool, PoolEvent } from '@/lib/pools';
import { loadIdentity, saveIdentity, generateUserId } from '@/lib/identity';
import { useToast } from '@/components/Toast';
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
        body: JSON.stringify({ action: 'join', participantId, username, address: address || '0x...' }),
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

function PoolDetail({
  pool, participantId, username, onJoin, onLock, onStart, onVote, onResolve, onSettle, onShare,
}: {
  pool: Pool; participantId: string; username: string;
  onJoin: (id: string) => void; onLock: (id: string) => void; onStart: (id: string) => void;
  onVote: (pid: string, eid: string, bid?: number) => void;
  onResolve: (pid: string, eid: string, wid: string) => void;
  onSettle: (id: string) => void; onShare: (id: string) => void;
}) {
  const isParticipant = pool.participants.some((p) => p.id === participantId);
  const isHost = pool.hostId === participantId;
  const isFull = pool.participants.length >= pool.capacity;

  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800 border-green-200',
    locked: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    settled: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  const statusLabels: Record<string, string> = {
    open: 'Abierto', locked: 'Trabado', active: 'En vivo', settled: 'Liquidado',
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-4 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-blue">{pool.name}</h2>
            <p className="text-sm text-gray-500">{pool.match}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[pool.status]}`}>
            {statusLabels[pool.status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gradient-to-br from-celeste/10 to-celeste/20 rounded-xl p-3">
            <p className="text-lg font-bold text-blue">{pool.stake} USDt</p>
            <p className="text-xs text-gray-500 mt-0.5">Stake</p>
          </div>
          <div className="bg-gradient-to-br from-gold/10 to-gold/20 rounded-xl p-3">
            <p className="text-lg font-bold text-gold-dark">{pool.participants.length}/{pool.capacity}</p>
            <p className="text-xs text-gray-500 mt-0.5">Jugadores</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
            <p className="text-lg font-bold text-green-700">{pool.totalPool} USDt</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Pool</p>
          </div>
        </div>

        <button onClick={() => onShare(pool.id)}
          className="text-xs text-celeste-dark font-semibold hover:underline flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Compartir POZO
        </button>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Participantes:</p>
          <div className="space-y-1">
            {pool.participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-3 py-2.5">
                <span className={p.id === participantId ? 'font-bold text-blue' : ''}>
                  {p.username} {p.id === pool.hostId ? '👑' : ''} {p.id === participantId ? '(vos)' : ''}
                </span>
                <span className="text-gray-500 font-medium">{p.staked} USDt</span>
              </div>
            ))}
            {pool.status === 'open' && !isParticipant && !isFull && (
              <button onClick={() => onJoin(pool.id)} className="btn-primary w-full text-sm mt-2">
                Unirse al POZO
              </button>
            )}
            {pool.status === 'open' && isFull && !isParticipant && (
              <p className="text-xs text-red-500 text-center mt-2 font-medium">POZO lleno</p>
            )}
            {pool.status === 'open' && !username && (
              <p className="text-xs text-gray-400 text-center mt-2">Poné tu nombre de usuario arriba para unirte</p>
            )}
          </div>
        </div>

        {isHost && pool.status === 'open' && pool.participants.length >= 2 && (
          <button onClick={() => onLock(pool.id)} className="btn-gold w-full text-sm">
            Cerrar POZO (comienza el partido)
          </button>
        )}
        {isHost && pool.status === 'open' && pool.participants.length < 2 && (
          <p className="text-xs text-gray-400 text-center">Esperá a que se unan más jugadores</p>
        )}
        {isHost && pool.status === 'locked' && (
          <button onClick={() => onStart(pool.id)} className="btn-gold w-full text-sm">
            Iniciar Partido
          </button>
        )}
      </div>

      {pool.status === 'active' && (
        <div className="card space-y-4">
          <h3 className="font-bold text-lg">Eventos en vivo ⚡</h3>
          {pool.events.map((event) => (
            <EventCard key={event.id} event={event} pool={pool}
              participantId={participantId} isHost={isHost}
              onVote={(bid) => onVote(pool.id, event.id, bid)}
              onResolve={(wid: string) => onResolve(pool.id, event.id, wid)} />
          ))}
          {isHost && pool.events.every((e) => e.resolved) && (
            <button onClick={() => onSettle(pool.id)} className="btn-gold w-full text-sm">
              Liquidar POZO
            </button>
          )}
        </div>
      )}

      {pool.status === 'settled' && (
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <h3 className="font-bold text-green-800">POZO Liquidado</h3>
          <p className="text-sm text-green-700 mt-1">Los ganadores recibieron sus USDt.</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, pool, participantId, isHost, onVote, onResolve }: {
  event: PoolEvent; pool: Pool; participantId: string;
  isHost: boolean; onVote: (bid?: number) => void; onResolve: (wid: string) => void;
}) {
  const hasVoted = event.voted.includes(participantId);
  const confirmed = event.confirmed;
  const majority = Math.floor(pool.participants.length / 2) + 1;
  const [bidInput, setBidInput] = useState(0);
  const [showBid, setShowBid] = useState(false);

  return (
    <div className={`rounded-xl border p-3.5 space-y-2.5 transition-all duration-200 ${
      event.resolved ? 'bg-green-50 border-green-200' :
      confirmed ? 'bg-yellow-50 border-yellow-200' :
      'bg-gray-50 border-gray-200 hover:border-celeste/30'
    }`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{event.label}</span>
        <span className="text-xs text-gray-500 font-medium">
          {event.voted.length}/{majority} votos
          {confirmed && !event.resolved && ' ✅'}
          {event.resolved && ' 🏆'}
        </span>
      </div>

      {pool.status === 'active' && !event.resolved && !hasVoted && (
        <div className="space-y-1.5">
          {showBid ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium">Apuesta extra:</span>
              <input type="number" className="input-field text-xs py-1 w-20" min={0} step={0.5}
                value={bidInput} onChange={(e) => setBidInput(Number(e.target.value))} />
              <button onClick={() => { onVote(bidInput > 0 ? bidInput : undefined); setShowBid(false); }}
                className="btn-primary text-xs py-1.5 px-3">
                Votar
              </button>
            </div>
          ) : (
            <button onClick={() => setShowBid(true)} className="btn-primary text-xs py-1.5 px-3">
              Confirmar evento
            </button>
          )}
        </div>
      )}

      {event.bidAmount && event.bidAmount > 0 && (
        <p className="text-xs text-gold-dark font-semibold">Apuestas: ${event.bidAmount} USDt</p>
      )}

      {confirmed && !event.resolved && isHost && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-600">Quién ganó?</p>
          <div className="flex flex-wrap gap-1.5">
            {pool.participants.map((p) => (
              <button key={p.id} onClick={() => onResolve(p.id)}
                className="bg-white border border-gray-300 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-celeste/10 hover:border-celeste/30 transition-all">
                {p.username}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasVoted && !confirmed && !event.resolved && (
        <p className="text-xs text-gray-500 italic">Voto registrado. Esperando a los demás...</p>
      )}

      {event.resolved && event.winner && (
        <p className="text-sm font-bold text-green-700">
          Ganador: {pool.participants.find((p) => p.id === event.winner)?.username || event.winner}
        </p>
      )}
    </div>
  );
}
