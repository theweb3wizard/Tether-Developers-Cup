import { NextResponse } from 'next/server';
import { createWallet } from '@/lib/wdk';

export async function POST() {
  try {
    const wallet = await createWallet();
    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Wallet creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet', details: String(error) },
      { status: 500 }
    );
  }
}
