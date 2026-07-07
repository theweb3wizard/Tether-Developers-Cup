import { NextResponse } from 'next/server';
import { createPool } from '@/lib/pools';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pool = createPool({
      name: body.name || `Pozo ${new Date().toLocaleDateString('es-AR')}`,
      match: body.match || 'Argentina vs Egypt — R16',
      stake: Number(body.stake) || 5,
      capacity: Number(body.capacity) || 6,
      events: body.events || ['Messi gol'],
      hostId: body.hostId || 'host-1',
      hostUsername: body.hostUsername || 'Cebolla',
      hostAddress: body.hostAddress || '0x...',
    });
    return NextResponse.json(pool, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
