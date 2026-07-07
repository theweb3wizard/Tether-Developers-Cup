"use client";

import { useState } from "react";

type Pool = {
  id: string;
  name: string;
  match: string;
  stake: number;
  participants: number;
  totalPool: number;
  status: "open" | "locked" | "active" | "settled";
  events: string[];
};

export default function PoolPage() {
  const [pools, setPools] = useState<Pool[]>([
    {
      id: "1",
      name: "Pozo del 7 de Julio",
      match: "Argentina vs Egypt — R16",
      stake: 5,
      participants: 3,
      totalPool: 15,
      status: "open",
      events: ["Messi gol", "Tarjeta amarilla", "Dibu ataja"],
    },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPool, setNewPool] = useState({
    name: "",
    stake: 5,
    events: ["Messi gol"],
  });

  const createPool = () => {
    const pool: Pool = {
      id: String(pools.length + 1),
      name: newPool.name || `Pozo del ${new Date().toLocaleDateString("es-AR")}`,
      match: "Argentina vs Egypt — R16",
      stake: newPool.stake,
      participants: 1,
      totalPool: newPool.stake,
      status: "open",
      events: newPool.events,
    };
    setPools([pool, ...pools]);
    setShowCreate(false);
    setNewPool({ name: "", stake: 5, events: ["Messi gol"] });
  };

  const addEvent = (e: string) => {
    if (!newPool.events.includes(e)) {
      setNewPool({ ...newPool, events: [...newPool.events, e] });
    }
  };

  const removeEvent = (e: string) => {
    setNewPool({ ...newPool, events: newPool.events.filter((ev) => ev !== e) });
  };

  const eventOptions = [
    "Messi gol",
    "Tarjeta amarilla",
    "Dibu ataja",
    "VAR review",
    "Gol en primer tiempo",
    "Córner para Argentina",
  ];

  const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    locked: "bg-yellow-100 text-yellow-800",
    active: "bg-blue-100 text-blue-800",
    settled: "bg-gray-100 text-gray-800",
  };

  const statusLabels: Record<string, string> = {
    open: "Abierto",
    locked: "Trabado",
    active: "En vivo",
    settled: "Liquidado",
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue">POZOs</h1>
          <p className="text-gray-500 text-sm">Pools para la Scaloneta</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold text-sm">
          + Nuevo POZO
        </button>
      </div>

      {showCreate && (
        <div className="card space-y-4 border-2 border-gold">
          <h2 className="font-semibold text-lg">Crear POZO</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Nombre del POZO</label>
            <input
              className="input-field"
              placeholder="Pozo del 7 de Julio"
              value={newPool.name}
              onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Stake por persona (USDt)</label>
            <input
              type="number"
              className="input-field"
              value={newPool.stake}
              onChange={(e) => setNewPool({ ...newPool, stake: Number(e.target.value) })}
              min={1}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Eventos del POZO</label>
            <div className="flex flex-wrap gap-2">
              {newPool.events.map((ev) => (
                <span key={ev} className="bg-celeste/20 text-blue text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {ev}
                  <button onClick={() => removeEvent(ev)} className="text-red-400 hover:text-red-600">&times;</button>
                </span>
              ))}
            </div>
            <select
              className="input-field text-sm"
              onChange={(e) => { if (e.target.value) addEvent(e.target.value); e.target.value = ""; }}
            >
              <option value="">+ Agregar evento</option>
              {eventOptions.filter((o) => !newPool.events.includes(o)).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={createPool} className="btn-primary flex-1">Crear POZO</button>
            <button onClick={() => setShowCreate(false)} className="btn-primary flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {pools.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <div className="text-5xl">💰</div>
          <p className="text-gray-500">Todavía no hay POZOs</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            Crear el primer POZO
          </button>
        </div>
      ) : (
        pools.map((pool) => (
          <div key={pool.id} className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-blue">{pool.name}</h3>
                <p className="text-sm text-gray-500">{pool.match}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[pool.status]}`}>
                {statusLabels[pool.status]}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-celeste/10 rounded-lg p-2">
                <p className="text-xs text-gray-500">Stake</p>
                <p className="font-bold text-blue">{pool.stake} USDt</p>
              </div>
              <div className="bg-gold/10 rounded-lg p-2">
                <p className="text-xs text-gray-500">Participants</p>
                <p className="font-bold text-gold-dark">{pool.participants}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-bold text-green-700">{pool.totalPool} USDt</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Eventos:</p>
              <div className="flex flex-wrap gap-1">
                {pool.events.map((ev) => (
                  <span key={ev} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{ev}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn-primary flex-1 text-sm">Unirse al POZO</button>
              <button className="btn-gold flex-1 text-sm">Compartir</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
