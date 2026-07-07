import { NextResponse } from 'next/server';
import { getPool, joinPool, lockPool, startPool } from '@/lib/pools';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pool = await getPool(id);
  if (!pool) return NextResponse.json({ error: 'POZO not found' }, { status: 404 });
  return NextResponse.json(pool);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  try {
    if (body.action === 'join') {
      return NextResponse.json(await joinPool(id, {
        id: body.participantId || `user-${Date.now()}`,
        username: body.username || 'Anonymous',
        address: body.address || '0x...',
        cabala: body.cabala,
      }));
    }
    if (body.action === 'lock') return NextResponse.json(await lockPool(id));
    if (body.action === 'start') return NextResponse.json(await startPool(id));
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
