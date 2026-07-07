import { NextRequest, NextResponse } from 'next/server';
import { voteEvent, resolveEvent } from '@/lib/pools';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  try {
    if (body.action === 'vote') {
      const event = voteEvent(id, body.eventId, body.participantId);
      return NextResponse.json(event);
    }
    if (body.action === 'resolve') {
      const result = resolveEvent(id, body.eventId, body.winnerId);
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
