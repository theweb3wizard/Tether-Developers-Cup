export type PoolEvent = {
  id: string;
  label: string;
  voted: string[];
  confirmed: boolean;
  resolved: boolean;
  winner?: string;
};

export type Participant = {
  id: string;
  username: string;
  address: string;
  staked: number;
};

export type Pool = {
  id: string;
  name: string;
  match: string;
  stake: number;
  totalPool: number;
  capacity: number;
  status: "open" | "locked" | "active" | "settled";
  participants: Participant[];
  events: PoolEvent[];
  created: number;
  hostId: string;
};

const pools = new Map<string, Pool>();

export function createPool(data: {
  name: string;
  match: string;
  stake: number;
  capacity: number;
  events: string[];
  hostId: string;
  hostUsername: string;
  hostAddress: string;
}): Pool {
  const pool: Pool = {
    id: crypto.randomUUID().slice(0, 8),
    name: data.name,
    match: data.match,
    stake: data.stake,
    totalPool: data.stake,
    capacity: data.capacity,
    status: "open",
    participants: [
      {
        id: data.hostId,
        username: data.hostUsername,
        address: data.hostAddress,
        staked: data.stake,
      },
    ],
    events: data.events.map((e) => ({
      id: crypto.randomUUID().slice(0, 6),
      label: e,
      voted: [],
      confirmed: false,
      resolved: false,
    })),
    created: Date.now(),
    hostId: data.hostId,
  };
  pools.set(pool.id, pool);
  return pool;
}

export function getPool(id: string): Pool | undefined {
  return pools.get(id);
}

export function listPools(): Pool[] {
  return Array.from(pools.values()).sort((a, b) => b.created - a.created);
}

export function joinPool(
  poolId: string,
  participant: { id: string; username: string; address: string }
): Pool {
  const pool = pools.get(poolId);
  if (!pool) throw new Error("POZO not found");
  if (pool.participants.length >= pool.capacity)
    throw new Error("POZO is full");
  if (pool.status !== "open") throw new Error("POZO is not open");

  pool.participants.push({ ...participant, staked: pool.stake });
  pool.totalPool += pool.stake;
  return pool;
}

export function lockPool(poolId: string): Pool {
  const pool = pools.get(poolId);
  if (!pool) throw new Error("POZO not found");
  if (pool.participants.length < 2) throw new Error("Need at least 2 participants");
  pool.status = "locked";
  return pool;
}

export function startPool(poolId: string): Pool {
  const pool = pools.get(poolId);
  if (!pool) throw new Error("POZO not found");
  pool.status = "active";
  return pool;
}

export function voteEvent(
  poolId: string,
  eventId: string,
  participantId: string
): PoolEvent {
  const pool = pools.get(poolId);
  if (!pool) throw new Error("POZO not found");

  const event = pool.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");
  if (event.resolved) throw new Error("Event already resolved");
  if (event.voted.includes(participantId))
    throw new Error("Already voted");

  event.voted.push(participantId);

  const majority = Math.floor(pool.participants.length / 2) + 1;
  if (event.voted.length >= majority) {
    event.confirmed = true;
  }

  return event;
}

export function resolveEvent(
  poolId: string,
  eventId: string,
  winnerParticipantId: string
): { event: PoolEvent; payout: number } {
  const pool = pools.get(poolId);
  if (!pool) throw new Error("POZO not found");

  const event = pool.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");
  if (!event.confirmed) throw new Error("Event not confirmed by group");
  if (event.resolved) throw new Error("Event already resolved");

  event.resolved = true;
  event.winner = winnerParticipantId;

  const payout = Math.floor((pool.totalPool * 0.9) / pool.events.filter((e) => e.resolved).length);

  return { event, payout };
}

export function settlePool(poolId: string): { pool: Pool; payouts: { participantId: string; amount: number }[] } {
  const pool = pools.get(poolId);
  if (!pool) throw new Error("POZO not found");

  pool.status = "settled";

  const resolvedEvents = pool.events.filter((e) => e.resolved);
  const payouts = pool.participants.map((p) => {
    const wins = resolvedEvents.filter((e) => e.winner === p.id).length;
    const amount = wins > 0 ? Math.floor((pool.totalPool * 0.9 * wins) / resolvedEvents.length) : 0;
    return { participantId: p.id, amount };
  });

  return { pool, payouts };
}
