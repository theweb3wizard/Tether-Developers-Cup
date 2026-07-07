import { NextResponse } from 'next/server';
import { listPools } from '@/lib/pools';

export async function GET() {
  return NextResponse.json(listPools());
}
