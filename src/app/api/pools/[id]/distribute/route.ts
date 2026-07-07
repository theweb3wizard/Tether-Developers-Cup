import { NextResponse } from 'next/server';
import { settlePool } from '@/lib/pools';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = settlePool(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
