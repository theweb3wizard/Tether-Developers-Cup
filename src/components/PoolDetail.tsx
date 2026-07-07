'use client';

import { useState } from 'react';
import type { Pool, PoolEvent } from '@/lib/pools';

export default function PoolDetail({
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
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Participantes</p>
          <div className="space-y-1">
            {pool.participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-3 py-2.5">
                <div>
                  <span className={p.id === participantId ? 'font-bold text-blue' : ''}>
                    {p.username} {p.id === pool.hostId ? '👑' : ''} {p.id === participantId ? '(vos)' : ''}
                  </span>
                  {p.cabala && <span className="ml-1.5 text-xs text-gray-400">({p.cabala})</span>}
                </div>
                <span className="text-gray-500 font-medium whitespace-nowrap ml-2">{p.staked} USDt</span>
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
        <div className="flex flex-wrap items-center gap-1.5">
          {showBid ? (
            <>
              <span className="text-xs text-gray-500 font-medium">Apuesta:</span>
              <input type="number" className="input-field text-xs py-1 w-20" min={0} step={0.5}
                value={bidInput} onChange={(e) => setBidInput(Number(e.target.value))} />
              <button onClick={() => { onVote(bidInput > 0 ? bidInput : undefined); setShowBid(false); }}
                className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap">
                Votar
              </button>
            </>
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
