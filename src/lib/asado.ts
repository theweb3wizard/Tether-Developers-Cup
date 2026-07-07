export type AsadoExpense = {
  id: string;
  label: string;
  amount: number;
  paidBy: string;
};

export type AsadoBill = {
  id: string;
  name: string;
  expenses: AsadoExpense[];
  participants: string[];
  created: number;
};

const bills = new Map<string, AsadoBill>();

export function createBill(name: string, participantNames: string[]): AsadoBill {
  const bill: AsadoBill = {
    id: crypto.randomUUID().slice(0, 8),
    name,
    expenses: [],
    participants: participantNames,
    created: Date.now(),
  };
  bills.set(bill.id, bill);
  return bill;
}

export function addExpense(billId: string, label: string, amount: number, paidBy: string): AsadoBill {
  const bill = bills.get(billId);
  if (!bill) throw new Error('Bill not found');
  bill.expenses.push({
    id: crypto.randomUUID().slice(0, 6),
    label,
    amount,
    paidBy,
  });
  return bill;
}

export function getBill(id: string): AsadoBill | undefined {
  return bills.get(id);
}

export function listBills(): AsadoBill[] {
  return Array.from(bills.values()).sort((a, b) => b.created - a.created);
}

export function calculateSplits(billId: string): { participant: string; owes: number; expenses: { label: string; amount: number }[] }[] {
  const bill = bills.get(billId);
  if (!bill) throw new Error('Bill not found');

  const total = bill.expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = total / bill.participants.length;

  return bill.participants.map((p) => {
    const paid = bill.expenses.filter((e) => e.paidBy === p).reduce((s, e) => s + e.amount, 0);
    return {
      participant: p,
      owes: Math.max(0, perPerson - paid),
      expenses: bill.expenses.filter((e) => e.paidBy === p),
    };
  });
}
