import { NextResponse } from 'next/server';
import { sendUsdt } from '@/lib/wdk';

export async function POST(req: Request) {
  try {
    const { to, amount } = await req.json();
    if (!to || !amount) {
      return NextResponse.json({ error: 'Missing to or amount' }, { status: 400 });
    }
    const result = await sendUsdt(to, amount);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Send failed', details: String(error) }, { status: 500 });
  }
}
