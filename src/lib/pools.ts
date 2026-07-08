import { supabase } from './supabase'

export type PoolEvent = {
  id: string
  label: string
  voted: string[]
  confirmed: boolean
  resolved: boolean
  winner?: string
  bidAmount?: number
}

export type Participant = {
  id: string
  username: string
  address: string
  staked: number
  cabala?: string
}

export type Pool = {
  id: string
  name: string
  match: string
  stake: number
  totalPool: number
  capacity: number
  status: 'open' | 'locked' | 'active' | 'settled'
  participants: Participant[]
  events: PoolEvent[]
  created: number
  hostId: string
  settledAt?: string
  txHashes?: string[]
}

type PoolRow = {
  id: string
  name: string
  match_name: string
  stake_amount: number
  total_pool: number
  capacity: number
  status: 'open' | 'locked' | 'active' | 'settled'
  participants: Participant[]
  events: PoolEvent[]
  host_id: string
  created_at: string
  settled_at?: string | null
  tx_hashes?: string[] | null
}

function rowToPool(row: PoolRow): Pool {
  return {
    id: row.id,
    name: row.name,
    match: row.match_name,
    stake: Number(row.stake_amount),
    totalPool: Number(row.total_pool),
    capacity: row.capacity,
    status: row.status,
    participants: row.participants || [],
    events: (row.events || []).map((e) => ({ ...e, bidAmount: e.bidAmount || 0 })),
    created: new Date(row.created_at).getTime(),
    hostId: row.host_id,
    settledAt: row.settled_at ?? undefined,
    txHashes: row.tx_hashes ?? undefined,
  }
}

export async function createPool(data: {
  name: string
  match: string
  stake: number
  capacity: number
  events: string[]
  hostId: string
  hostUsername: string
  hostAddress: string
  hostCabala?: string
}): Promise<Pool> {
  const id = crypto.randomUUID().slice(0, 8)
  const poolEvents: PoolEvent[] = data.events.map((e) => ({
    id: crypto.randomUUID().slice(0, 6),
    label: e,
    voted: [],
    confirmed: false,
    resolved: false,
    bidAmount: 0,
  }))

  const { data: row, error } = await supabase
    .from('pools')
    .insert({
      id,
      name: data.name,
      match_name: data.match,
      stake_amount: data.stake,
      total_pool: data.stake,
      capacity: data.capacity,
      status: 'open',
      host_id: data.hostId,
      participants: [
        { id: data.hostId, username: data.hostUsername, address: data.hostAddress, staked: data.stake, cabala: data.hostCabala },
      ],
      events: poolEvents,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToPool(row as unknown as PoolRow)
}

export async function getPool(id: string): Promise<Pool | null> {
  const { data, error } = await supabase
    .from('pools')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return rowToPool(data as unknown as PoolRow)
}

export async function listPools(status?: string): Promise<Pool[]> {
  let query = supabase.from('pools').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as unknown as PoolRow[]).map(rowToPool)
}

export async function joinPool(
  poolId: string,
    participant: { id: string; username: string; address: string; cabala?: string }
): Promise<Pool> {
  const { data: current, error: fetchError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', poolId)
    .single()

  if (fetchError) throw new Error('POZO not found')

  const pool = rowToPool(current as unknown as PoolRow)
  if (pool.participants.length >= pool.capacity) throw new Error('POZO is full')
  if (pool.status !== 'open') throw new Error('POZO is not open')

  const updatedParticipants = [
    ...pool.participants,
    { ...participant, staked: pool.stake, cabala: participant.cabala },
  ]
  const updatedTotal = pool.totalPool + pool.stake

  const { data: updated, error: updateError } = await supabase
    .from('pools')
    .update({ participants: updatedParticipants, total_pool: updatedTotal })
    .eq('id', poolId)
    .select()
    .single()

  if (updateError) throw new Error(updateError.message)
  return rowToPool(updated as unknown as PoolRow)
}

export async function lockPool(poolId: string): Promise<Pool> {
  const pool = await getPool(poolId)
  if (!pool) throw new Error('POZO not found')
  if (pool.participants.length < 2) throw new Error('Need at least 2 participants')

  const { data, error } = await supabase
    .from('pools')
    .update({ status: 'locked', locked_at: new Date().toISOString() })
    .eq('id', poolId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToPool(data as unknown as PoolRow)
}

export async function startPool(poolId: string): Promise<Pool> {
  const { data, error } = await supabase
    .from('pools')
    .update({ status: 'active' })
    .eq('id', poolId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToPool(data as unknown as PoolRow)
}

export async function voteEvent(
  poolId: string,
  eventId: string,
  participantId: string,
  bidAmount?: number
): Promise<PoolEvent> {
  const { data: current, error: fetchError } = await supabase
    .from('pools')
    .select('events, participants')
    .eq('id', poolId)
    .single()

  if (fetchError) throw new Error('POZO not found')

  const events = (current.events || []) as PoolEvent[]
  const event = events.find((e) => e.id === eventId)
  if (!event) throw new Error('Event not found')
  if (event.resolved) throw new Error('Event already resolved')
  if (event.voted.includes(participantId)) throw new Error('Already voted')

  event.voted.push(participantId)
  if (bidAmount && bidAmount > 0) {
    event.bidAmount = (event.bidAmount || 0) + bidAmount
  }

  const participantCount = (current.participants || []).length
  const majority = Math.floor(participantCount / 2) + 1
  if (event.voted.length >= majority) {
    event.confirmed = true
  }

  const { data: updated, error: updateError } = await supabase
    .from('pools')
    .update({ events })
    .eq('id', poolId)
    .select('events')
    .single()

  if (updateError) throw new Error(updateError.message)
  const updatedEvents = (updated.events || []) as PoolEvent[]
  const updatedEvent = updatedEvents.find((e) => e.id === eventId)
  if (!updatedEvent) throw new Error('Event not found after update')
  return updatedEvent
}

export async function resolveEvent(
  poolId: string,
  eventId: string,
  winnerParticipantId: string
): Promise<{ event: PoolEvent; payout: number }> {
  const { data: current, error: fetchError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', poolId)
    .single()

  if (fetchError) throw new Error('POZO not found')

  const pool = rowToPool(current as unknown as PoolRow)
  const event = pool.events.find((e) => e.id === eventId)
  if (!event) throw new Error('Event not found')
  if (!event.confirmed) throw new Error('Event not confirmed by group')
  if (event.resolved) throw new Error('Event already resolved')

  event.resolved = true
  event.winner = winnerParticipantId

  const resolvedCount = pool.events.filter((e) => e.resolved).length
  const payout = Math.floor((pool.totalPool * 0.9) / resolvedCount)

  const { error: updateError } = await supabase
    .from('pools')
    .update({ events: pool.events })
    .eq('id', poolId)

  if (updateError) throw new Error(updateError.message)
  return { event, payout }
}

export async function settlePool(
  poolId: string,
  txHashes?: string[]
): Promise<{
  pool: Pool
  payouts: { participantId: string; amount: number }[]
}> {
  const pool = await getPool(poolId)
  if (!pool) throw new Error('POZO not found')

  const resolvedEvents = pool.events.filter((e) => e.resolved)
  const payouts = pool.participants.map((p) => {
    const wins = resolvedEvents.filter((e) => e.winner === p.id).length
    const amount = wins > 0
      ? Math.floor((pool.totalPool * 0.9 * wins) / resolvedEvents.length)
      : 0
    return { participantId: p.id, amount }
  })

  const updateData: Record<string, unknown> = {
    status: 'settled',
    settled_at: new Date().toISOString(),
  }
  if (txHashes && txHashes.length > 0) {
    updateData.tx_hashes = txHashes
  }

  const { data, error } = await supabase
    .from('pools')
    .update(updateData)
    .eq('id', poolId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return { pool: rowToPool(data as unknown as PoolRow), payouts }
}
