"use client";

import { useState, useEffect, useCallback } from "react";
import type { Pool, PoolEvent } from "@/lib/pools";

export default function PoolPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [participantId, setParticipantId] = useState(`user-${Math.random().toString(36).slice(2, 8)}`);
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState("");

  const [newPool, setNewPool] = useState({
    name: "",
    stake: 5,
    capacity: 6,
    events: ["Messi gol"] as string[],
  });

  const eventOptions = [
    "Messi gol",
    "Tarjeta amarilla",
    "Dibu ataja",
    "VAR review",
    "Gol en primer tiempo",
    "Córner para Argentina",
    "Salah al palo",
    "Cambio de Messi",
  ];

  const fetchPools = useCallback(async () => {
    try {
      const res = await fetch("/api/pools");
      const data = await res.json();
      setPools(data);
    } catch {
      setError("No se pudieron cargar los POZOs");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  const fetchPool = async (id: string) => {
    const res = await fetch(`/api/pools/${id}`);
    const data = await res.json();
    setSelectedPool(data);
    setPools((prev) => prev.map((p) => (p.id === id ? data : p)));
  };

  const createPool = async () => {
    try {
      const res = await fetch("/api/pools/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPool,
          name: newPool.name || `Pozo del ${new Date().toLocaleDateString("es-AR")}`,
          hostId: participantId,
          hostUsername: username || "Cebolla",
          hostAddress: address || "0x...",
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewPool({ name: "", stake: 5, capacity: 6, events: ["Messi gol"] });
        fetchPools();
      }
    } catch {
      setError("Error al crear POZO");
    }
  };

  const joinPool = async (poolId: string) => {
    try {
      await fetch(`/api/pools/${poolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          participantId,
          username: username || "Anonymous",
          address: address || "0x...",
        }),
      });
      fetchPool(poolId);
    } catch { setError("Error al unirse"); }
  };

  const lockPool = async (poolId: string) => {
    await fetch(`/api/pools/${poolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lock" }),
    });
    fetchPool(poolId);
  };

  const startPool = async (poolId: string) => {
    await fetch(`/api/pools/${poolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    fetchPool(poolId);
  };

  const voteEvent = async (poolId: string, eventId: string) => {
    await fetch(`/api/pools/${poolId}/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "vote", eventId, participantId }),
    });
    fetchPool(poolId);
  };

  const resolveEvent = async (poolId: string, eventId: string, winnerId: string) => {
    await fetch(`/api/pools/${poolId}/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", eventId, winnerId: winnerId }),
    });
    fetchPool(poolId);
  };

  const settlePool = async (poolId: string) => {
    await fetch(`/api/pools/${poolId}/distribute`, { method: "POST" });
    fetchPool(poolId);
  };

  const addEvent = (e: string) => {
    if (!newPool.events.includes(e)) setNewPool({ ...newPool, events: [...newPool.events, e] });
  };
  const removeEvent = (e: string) => {
    setNewPool({ ...newPool, events: newPool.events.filter((ev) => ev !== e) });
  };

  const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    locked: "bg-yellow-100 text-yellow-800",
    active: "bg-blue-100 text-blue-800",
    settled: "bg-gray-100 text-gray-800",
  };
  const statusLabels: Record<string, string> = {
    open: "Abierto", locked: "Trabado", active: "En vivo", settled: "Liquidado",
  };

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4 animate-pulse">💰</div>
      <p className="text-gray-500">Cargando POZOs...</p>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue">POZOs</h1>
          <p className="text-gray-500 text-sm">Pools para la Scaloneta</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelectedPool(null)} className={`text-sm px-3 py-1.5 rounded-lg ${selectedPool ? "btn-primary" : "hidden"}`}>
            ← Volver
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-gold text-sm">+ Nuevo POZO</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}

      {!username && (
        <div className="card space-y-3 border-2 border-celeste">
          <h3 className="font-semibold text-sm">Tu identidad</h3>
          <input className="input-field text-sm" placeholder="Tu nombre de usuario" value={username}
            onChange={(e) => setUsername(e.target.value)} />
          <input className="input-field text-sm" placeholder="Tu dirección (0x...)" value={address}
            onChange={(e) => setAddress(e.target.value)} />
        </div>
      )}

      {showCreate && (
        <div className="card space-y-4 border-2 border-gold">
          <h2 className="font-semibold text-lg">Crear POZO</h2>
          <input className="input-field" placeholder="Nombre del POZO"
            value={newPool.name} onChange={(e) => setNewPool({ ...newPool, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Stake (USDt)</label>
              <input type="number" className="input-field" value={newPool.stake}
                onChange={(e) => setNewPool({ ...newPool, stake: Number(e.target.value) })} min={1} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Capacidad</label>
              <input type="number" className="input-field" value={newPool.capacity}
                onChange={(e) => setNewPool({ ...newPool, capacity: Number(e.target.value) })} min={2} max={20} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Eventos</label>
            <div className="flex flex-wrap gap-1">
              {newPool.events.map((ev) => (
                <span key={ev} className="bg-celeste/20 text-blue text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {ev} <button onClick={() => removeEvent(ev)} className="text-red-400">&times;</button>
                </span>
              ))}
            </div>
            <select className="input-field text-sm"
              onChange={(e) => { if (e.target.value) { addEvent(e.target.value); e.target.value = ""; } }}>
              <option value="">+ Agregar evento</option>
              {eventOptions.filter((o) => !newPool.events.includes(o)).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={createPool} className="btn-primary flex-1">Crear POZO</button>
            <button onClick={() => setShowCreate(false)} className="btn-primary flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700">Cancelar</button>
          </div>
        </div>
      )}

      {selectedPool ? (
        <PoolDetail pool={selectedPool} participantId={participantId}
          onJoin={joinPool} onLock={lockPool} onStart={startPool}
          onVote={voteEvent} onResolve={resolveEvent} onSettle={settlePool} />
      ) : pools.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <div className="text-5xl">💰</div>
          <p className="text-gray-500">Todavía no hay POZOs</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">Crear el primer POZO</button>
        </div>
      ) : (
        pools.map((pool) => (
          <div key={pool.id} className="card space-y-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedPool(pool)}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-blue">{pool.name}</h3>
                <p className="text-xs text-gray-500">{pool.match}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[pool.status]}`}>
                {statusLabels[pool.status]}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-celeste/10 rounded p-2">
                <p className="font-bold text-blue">{pool.stake} USDt</p>
                <p className="text-gray-500">Stake</p>
              </div>
              <div className="bg-gold/10 rounded p-2">
                <p className="font-bold text-gold-dark">{pool.participants.length}/{pool.capacity}</p>
                <p className="text-gray-500">Players</p>
              </div>
              <div className="bg-green-50 rounded p-2">
                <p className="font-bold text-green-700">{pool.totalPool} USDt</p>
                <p className="text-gray-500">Total</p>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <p className="font-bold text-purple-700">{pool.events.length}</p>
                <p className="text-gray-500">Eventos</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PoolDetail({
  pool, participantId, onJoin, onLock, onStart, onVote, onResolve, onSettle,
}: {
  pool: Pool; participantId: string; onJoin: (id: string) => void;
  onLock: (id: string) => void; onStart: (id: string) => void;
  onVote: (pid: string, eid: string) => void;
  onResolve: (pid: string, eid: string, wid: string) => void;
  onSettle: (id: string) => void;
}) {
  const isParticipant = pool.participants.some((p) => p.id === participantId);
  const isHost = pool.hostId === participantId;

  const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    locked: "bg-yellow-100 text-yellow-800",
    active: "bg-blue-100 text-blue-800",
    settled: "bg-gray-100 text-gray-800",
  };
  const statusLabels: Record<string, string> = {
    open: "Abierto", locked: "Trabado", active: "En vivo", settled: "Liquidado",
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-blue">{pool.name}</h2>
            <p className="text-sm text-gray-500">{pool.match}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[pool.status]}`}>
            {statusLabels[pool.status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-celeste/10 rounded-lg p-3">
            <p className="text-lg font-bold text-blue">{pool.stake} USDt</p>
            <p className="text-xs text-gray-500">Stake</p>
          </div>
          <div className="bg-gold/10 rounded-lg p-3">
            <p className="text-lg font-bold text-gold-dark">{pool.participants.length}/{pool.capacity}</p>
            <p className="text-xs text-gray-500">Jugadores</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-lg font-bold text-green-700">{pool.totalPool} USDt</p>
            <p className="text-xs text-gray-500">Total Pool</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Participantes:</p>
          <div className="space-y-1">
            {pool.participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className={p.id === participantId ? "font-bold text-blue" : ""}>
                  {p.username} {p.id === pool.hostId ? "👑" : ""} {p.id === participantId ? "(vos)" : ""}
                </span>
                <span className="text-gray-500">{p.staked} USDt</span>
              </div>
            ))}
            {pool.status === "open" && !isParticipant && (
              <button onClick={() => onJoin(pool.id)} className="btn-primary w-full text-sm mt-2">
                Unirse al POZO
              </button>
            )}
          </div>
        </div>

        {isHost && pool.status === "open" && pool.participants.length >= 2 && (
          <button onClick={() => onLock(pool.id)} className="btn-gold w-full text-sm">
            Cerrar POZO (comienza el partido)
          </button>
        )}
        {isHost && pool.status === "locked" && (
          <button onClick={() => onStart(pool.id)} className="btn-gold w-full text-sm">
            Iniciar Partido
          </button>
        )}
      </div>

      {pool.status === "active" && (
        <div className="card space-y-4">
          <h3 className="font-bold text-lg">Eventos en vivo ⚡</h3>
          {pool.events.map((event) => (
            <EventCard key={event.id} event={event} pool={pool}
              participantId={participantId} isHost={isHost}
              onVote={() => onVote(pool.id, event.id)}
              onResolve={(wid: string) => onResolve(pool.id, event.id, wid)} />
          ))}

          {isHost && pool.events.every((e) => e.resolved) && (
            <button onClick={() => onSettle(pool.id)} className="btn-gold w-full text-sm">
              Liquidar POZO
            </button>
          )}
        </div>
      )}

      {pool.status === "settled" && (
        <div className="card bg-green-50 border border-green-200">
          <h3 className="font-bold text-green-800">✅ POZO Liquidado</h3>
          <p className="text-sm text-green-700 mt-1">Los ganadores recibieron sus USDt.</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, pool, participantId, isHost, onVote, onResolve }: {
  event: PoolEvent; pool: Pool; participantId: string;
  isHost: boolean; onVote: () => void; onResolve: (wid: string) => void;
}) {
  const hasVoted = event.voted.includes(participantId);
  const confirmed = event.confirmed;
  const majority = Math.floor(pool.participants.length / 2) + 1;

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${
      event.resolved ? "bg-green-50 border-green-200" :
      confirmed ? "bg-yellow-50 border-yellow-200" :
      "bg-gray-50 border-gray-200"
    }`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{event.label}</span>
        <span className="text-xs text-gray-500">
          {event.voted.length}/{majority} votos
          {confirmed && !event.resolved && " ✅ Confirmado"}
          {event.resolved && " 🏆 Resuelto"}
        </span>
      </div>

      {pool.status === "active" && !event.resolved && !hasVoted && (
        <button onClick={onVote} className="btn-primary text-xs py-1 px-3">
          Confirmar evento
        </button>
      )}

      {confirmed && !event.resolved && isHost && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Quién ganó?</p>
          <div className="flex flex-wrap gap-1">
            {pool.participants.map((p) => (
              <button key={p.id} onClick={() => onResolve(p.id)}
                className="bg-white border border-gray-300 text-xs px-2 py-1 rounded-lg hover:bg-celeste/10">
                {p.username}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasVoted && !confirmed && !event.resolved && (
        <p className="text-xs text-gray-500">Voto registrado. Esperando a los demás...</p>
      )}

      {event.resolved && event.winner && (
        <p className="text-sm font-bold text-green-700">
          Ganador: {pool.participants.find((p) => p.id === event.winner)?.username || event.winner}
        </p>
      )}
    </div>
  );
}
