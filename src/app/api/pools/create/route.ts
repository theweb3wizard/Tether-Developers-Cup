import { NextResponse } from 'next/server';
import { createPool } from '@/lib/pools';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pool = await createPool({
      name: body.name || `Pozo ${new Date().toLocaleDateString('es-AR')}`,
      match: body.match || 'Argentina vs Switzerland/Colombia — QF',
      stake: Number(body.stake) || 5,
      capacity: Number(body.capacity) || 6,
      events: body.events || ['Messi gol'],
      hostId: body.hostId || 'host-1',
      hostUsername: body.hostUsername || 'Cebolla',
      hostAddress: body.hostAddress || '0x...',
      hostCabala: body.hostCabala,
    });
    return NextResponse.json(pool, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
