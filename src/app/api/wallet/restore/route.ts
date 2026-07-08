import { NextResponse } from 'next/server';
import { restoreWallet } from '@/lib/wdk';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { seedPhrase } = body as { seedPhrase?: string };

    if (!seedPhrase || typeof seedPhrase !== 'string') {
      return NextResponse.json({ error: 'seedPhrase is required' }, { status: 400 });
    }

    const trimmed = seedPhrase.trim();
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount < 12) {
      return NextResponse.json(
        { error: `La seed phrase debe tener 12 palabras (recibidas: ${wordCount})` },
        { status: 400 }
      );
    }

    const info = await restoreWallet(trimmed);
    return NextResponse.json(info);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
