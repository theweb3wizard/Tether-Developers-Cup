import { NextResponse } from 'next/server';
import { getPool, settlePool } from '@/lib/pools';
import { distributePoolPayouts } from '@/lib/wdk';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const pool = await getPool(id);
    if (!pool) return NextResponse.json({ error: 'POZO not found' }, { status: 404 });

    // ── Idempotency guard ──────────────────────────────────────────────────────
    // If already settled, return the existing state instead of running again.
    // This prevents double-payment if "Liquidar POZO" is tapped twice.
    if (pool.status === 'settled') {
      return NextResponse.json(
        { pool, payouts: [], txResults: [], alreadySettled: true },
        { status: 200 }
      );
    }

    // ── Compute payouts ────────────────────────────────────────────────────────
    const resolvedEvents = pool.events.filter((e) => e.resolved);

    // If no events are resolved, we can still settle (all participants split evenly)
    // but flag it so the caller knows.
    const payouts = pool.participants.map((p) => {
      const wins = resolvedEvents.length > 0
        ? resolvedEvents.filter((e) => e.winner === p.id).length
        : 0;
      const amount =
        wins > 0
          ? Math.floor((pool.totalPool * 0.9 * wins) / resolvedEvents.length)
          : 0;
      return { participantId: p.id, address: p.address, amount };
    });

    // ── On-chain USDT transfers ────────────────────────────────────────────────
    const transferPayouts = payouts
      .filter((p) => p.amount > 0)
      .map((p) => ({ address: p.address, amount: p.amount }));

    let txResults: { address: string; hash: string; amount: number }[] = [];
    try {
      txResults = await distributePoolPayouts(transferPayouts);
    } catch (wdkErr) {
      // WDK error (e.g. POOL_MASTER_SEED not set) — log and continue with DB settlement
      console.error('[distribute] WDK error:', wdkErr);
    }

    const txHashes = txResults.map((r) => r.hash);

    // ── Settle in DB ───────────────────────────────────────────────────────────
    const result = await settlePool(id, txHashes);

    return NextResponse.json({ ...result, txResults });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
