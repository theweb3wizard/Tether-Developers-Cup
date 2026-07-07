import { NextResponse } from 'next/server';
import { getWalletInfo } from '@/lib/wdk';

export async function GET() {
  try {
    const info = await getWalletInfo();
    return NextResponse.json(info);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get wallet info', details: String(error) }, { status: 500 });
  }
}
