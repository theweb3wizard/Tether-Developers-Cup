'use client';

import { useState } from 'react';
import type { Pool, PoolEvent } from '@/lib/pools';

const STATUS_META: Record<string, { label: string; badge: string }> = {
  open: { label: 'Abierto', badge: 'badge-open' },
  locked: { label: 'Trabado', badge: 'badge-locked' },
  active: { label: 'En vivo', badge: 'badge-active' },
  settled: { label: 'Liquidado', badge: 'badge-settled' },
};

export default function PoolDetail({
  pool, participantId, onJoin, onLock, onStart, onVote, onResolve, onSettle, onShare,
}: {
  pool: Pool; participantId: string;
  onJoin: (id: string) => void; onLock: (id: string) => void; onStart: (id: string) => void;
  onVote: (pid: string, eid: string, bid?: number) => void;
  onResolve: (pid: string, eid: string, wid: string) => void;
  onSettle: (id: string) => void; onShare: (id: string) => void;
}) {
  const isParticipant = pool.participants.some((p) => p.id === participantId);
  const isHost = pool.hostId === participantId;
  const isFull = pool.participants.length >= pool.capacity;
  const meta = STATUS_META[pool.status] || STATUS_META.settled;
  const isLive = pool.status === 'active';

  return (
    <div className="space-y-4 stagger">

      {/* Main info card */}
      <div
        className="rounded-3xl p-5 space-y-5"
        style={{
          background: isLive
            ? 'linear-gradient(145deg, rgba(99,195,255,0.07) 0%, var(--bg-elevated) 70%)'
            : 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
          border: isLive ? '1px solid rgba(99,195,255,0.2)' : '1px solid var(--border-accent)',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isLive && <span className="dot-live" />}
              <h2 className="font-display text-2xl text-white leading-tight">{pool.name}</h2>
              <span className={`badge ${meta.badge}`}>{meta.label}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{pool.match || 'Partido por definir'}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: `${pool.stake}`, label: 'Stake', sub: 'USDt', color: 'var(--celeste)' },
            {
              value: `${pool.participants.length}/${pool.capacity}`,
              label: 'Jugadores',
              sub: pool.participants.length === pool.capacity ? 'Completo' : 'Disponible',
              color: 'var(--text-primary)',
            },
            { value: `${pool.totalPool}`, label: 'POZO', sub: 'USDt total', color: 'var(--gold)' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="font-mono-nums text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
              <p className="text-[8px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Share button */}
        <button
          onClick={() => onShare(pool.id)}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: 'var(--celeste)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Compartir POZO
        </button>

        {/* Participants */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
            <span className="status-dot status-dot--active" />
            Participantes ({pool.participants.length})
          </p>
          <div className="space-y-1.5">
            {pool.participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{
                  background: p.id === participantId ? 'rgba(99,195,255,0.06)' : 'rgba(255,255,255,0.025)',
                  border: p.id === participantId ? '1px solid rgba(99,195,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-sm truncate font-medium"
                    style={{ color: p.id === participantId ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {p.username}
                    {p.id === pool.hostId && (
                      <span style={{ color: 'var(--gold)', marginLeft: '4px' }}>★</span>
                    )}
                    {p.id === participantId && (
                      <span style={{ color: 'var(--celeste)', fontSize: '0.65rem', marginLeft: '4px' }}>(vos)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.cabala && <span className="text-[10px] italic" style={{ color: 'var(--text-tertiary)' }}>{p.cabala}</span>}
                  <span className="font-mono-nums text-xs font-bold" style={{ color: 'var(--gold)' }}>{p.staked || pool.stake}</span>
                  <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>USDt</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {pool.status === 'open' && !isParticipant && (
          <button onClick={() => onJoin(pool.id)} disabled={isFull} className="btn btn-gold w-full">
            {isFull ? 'POZO completo' : 'Unirse al POZO'}
          </button>
        )}
        {isHost && pool.status === 'open' && (
          <button onClick={() => onLock(pool.id)} disabled={pool.participants.length < 2} className="btn btn-primary w-full">
            {pool.participants.length < 2 ? 'Esperando jugadores...' : 'Cerrar POZO — arranca el partido'}
          </button>
        )}
        {isHost && pool.status === 'locked' && (
          <button onClick={() => onStart(pool.id)} className="btn btn-gold w-full">
            🏟️ Iniciar Partido
          </button>
        )}
      </div>

      {/* Live events */}
      {pool.status === 'active' && (
        <div className="space-y-3">
          <h3 className="font-display text-lg text-white flex items-center gap-2 px-1">
            <span className="dot-live" />
            Eventos en vivo
          </h3>
          {pool.events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              pool={pool}
              participantId={participantId}
              isHost={isHost}
              onVote={(bid) => onVote(pool.id, event.id, bid)}
              onResolve={(wid) => onResolve(pool.id, event.id, wid)}
            />
          ))}
          {isHost && pool.events.every((e) => e.resolved) && (
            <button onClick={() => onSettle(pool.id)} className="btn btn-gold w-full">
              💸 Liquidar POZO
            </button>
          )}
        </div>
      )}

      {/* Settled */}
      {pool.status === 'settled' && (
        <div
          className="rounded-3xl p-6 text-center space-y-3"
          style={{
            background: 'linear-gradient(145deg, rgba(255,209,102,0.07) 0%, var(--bg-card) 70%)',
            border: '1px solid rgba(255,209,102,0.2)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <span className="text-4xl block">🏆</span>
          <h3 className="font-display text-xl" style={{ color: 'var(--gold)' }}>POZO Liquidado</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Los ganadores recibieron sus USDt.</p>
          {pool.txHashes && pool.txHashes.length > 0 && (
            <div className="space-y-2 text-left mt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--text-tertiary)' }}>
                Transacciones on-chain
              </p>
              {pool.txHashes.map((hash) => (
                <a
                  key={hash}
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono-nums transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--celeste)',
                    wordBreak: 'break-all',
                  }}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0">
                    <path d="M10 3h3v3M9 7l4-4M6 4H3v9h9v-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {hash.slice(0, 10)}…{hash.slice(-8)}
                </a>
              ))}
            </div>
          )}
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
  const progress = Math.min(event.voted.length / majority, 1);

  return (
    <div
      className="rounded-3xl p-4 space-y-3 transition-all duration-200"
      style={{
        background: event.resolved
          ? 'linear-gradient(145deg, rgba(0,229,160,0.06) 0%, var(--bg-card) 70%)'
          : confirmed
            ? 'linear-gradient(145deg, rgba(255,209,102,0.06) 0%, var(--bg-card) 70%)'
            : 'var(--bg-card)',
        border: event.resolved
          ? '1px solid rgba(0,229,160,0.2)'
          : confirmed
            ? '1px solid rgba(255,209,102,0.2)'
            : '1px solid var(--border-white)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Event header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: event.resolved ? 'var(--success)' : confirmed ? 'var(--gold)' : 'var(--text-muted)',
              boxShadow: event.resolved ? '0 0 8px var(--success)' : confirmed ? '0 0 8px var(--gold)' : 'none',
            }}
          />
          <span className="font-semibold text-sm text-white">{event.label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono-nums" style={{ color: 'var(--text-secondary)' }}>
            {event.voted.length}/{majority}
          </span>
          {event.resolved && <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>✓</span>}
          {confirmed && !event.resolved && <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>★</span>}
        </div>
      </div>

      {/* Vote progress bar */}
      <div
        className="rounded-full overflow-hidden"
        style={{ height: '3px', background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            background: event.resolved
              ? 'var(--success)'
              : confirmed
                ? 'linear-gradient(90deg, var(--gold), var(--gold-dark))'
                : 'linear-gradient(90deg, var(--celeste), var(--celeste-glow))',
          }}
        />
      </div>

      {/* Vote action */}
      {pool.status === 'active' && !event.resolved && !hasVoted && (
        <div className="flex flex-wrap items-center gap-2">
          {showBid ? (
            <>
              <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Micro-puja:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  className="input text-xs w-20"
                  style={{ padding: '0.35rem 0.6rem', minHeight: '34px' }}
                  min={0} step={0.5}
                  value={bidInput}
                  onChange={(e) => setBidInput(Number(e.target.value))}
                  placeholder="USDT"
                />
                <button
                  onClick={() => { onVote(bidInput > 0 ? bidInput : undefined); setShowBid(false); }}
                  className="btn btn-primary text-xs"
                  style={{ padding: '0.35rem 0.85rem', minHeight: '34px' }}
                >
                  Votar
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowBid(true)}
              className="btn btn-ghost text-xs"
              style={{ padding: '0.35rem 0.85rem', minHeight: '34px' }}
            >
              + Confirmar evento
            </button>
          )}
        </div>
      )}

      {/* Bid amount */}
      {event.bidAmount && event.bidAmount > 0 && (
        <p className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--gold)' }}>
          <span>POZO</span>
          <span className="font-mono-nums">${event.bidAmount}</span>
          <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>USDt en apuestas</span>
        </p>
      )}

      {/* Host resolve */}
      {confirmed && !event.resolved && isHost && (
        <div
          className="space-y-2 rounded-2xl p-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>¿Quién ganó?</p>
          <div className="flex flex-wrap gap-1.5">
            {pool.participants.map((p) => (
              <button
                key={p.id}
                onClick={() => onResolve(p.id)}
                className="text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(99,195,255,0.1)';
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(99,195,255,0.3)';
                  (e.target as HTMLButtonElement).style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }}
              >
                {p.username}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasVoted && !confirmed && !event.resolved && (
        <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
          Voto registrado. Esperando a los demás...
        </p>
      )}

      {event.resolved && event.winner && (
        <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
          <span>🏆</span>
          {pool.participants.find((p) => p.id === event.winner)?.username || event.winner}
        </p>
      )}
    </div>
  );
}
