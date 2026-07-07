import { NextRequest, NextResponse } from 'next/server';
import { listPools } from '@/lib/pools';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || undefined;
  return NextResponse.json(await listPools(status));
}
