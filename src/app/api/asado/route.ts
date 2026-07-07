import { NextResponse } from 'next/server';
import { createBill, addExpense, listBills, getBill, calculateSplits } from '@/lib/asado';

export async function GET() {
  return NextResponse.json(await listBills());
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    if (body.action === 'create') {
      const bill = await createBill(body.name || 'Asado', body.participants || []);
      return NextResponse.json(bill, { status: 201 });
    }
    if (body.action === 'add-expense') {
      const bill = await addExpense(body.billId, body.label, Number(body.amount), body.paidBy);
      return NextResponse.json(bill);
    }
    if (body.action === 'split') {
      const splits = await calculateSplits(body.billId);
      return NextResponse.json(splits);
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
