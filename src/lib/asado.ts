import { supabase } from './supabase'

export type AsadoExpense = {
  id: string
  label: string
  amount: number
  paidBy: string
}

export type AsadoBill = {
  id: string
  name: string
  expenses: AsadoExpense[]
  participants: string[]
  created: number
}

type BillRow = {
  id: string
  name: string
  participants: string[]
  expenses: AsadoExpense[]
  created_at: string
}

function rowToBill(row: BillRow): AsadoBill {
  return {
    id: row.id,
    name: row.name,
    participants: row.participants || [],
    expenses: row.expenses || [],
    created: new Date(row.created_at).getTime(),
  }
}

export async function createBill(
  name: string,
  participantNames: string[]
): Promise<AsadoBill> {
  const id = crypto.randomUUID().slice(0, 8)

  const { data, error } = await supabase
    .from('asado_bills')
    .insert({
      id,
      name,
      participants: participantNames,
      expenses: [],
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToBill(data as unknown as BillRow)
}

export async function addExpense(
  billId: string,
  label: string,
  amount: number,
  paidBy: string
): Promise<AsadoBill> {
  const { data: current, error: fetchError } = await supabase
    .from('asado_bills')
    .select('expenses')
    .eq('id', billId)
    .single()

  if (fetchError) throw new Error('Bill not found')

  const expenses = (current.expenses || []) as AsadoExpense[]
  expenses.push({
    id: crypto.randomUUID().slice(0, 6),
    label,
    amount,
    paidBy,
  })

  const { data: updated, error: updateError } = await supabase
    .from('asado_bills')
    .update({ expenses })
    .eq('id', billId)
    .select()
    .single()

  if (updateError) throw new Error(updateError.message)
  return rowToBill(updated as unknown as BillRow)
}

export async function getBill(id: string): Promise<AsadoBill | null> {
  const { data, error } = await supabase
    .from('asado_bills')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return rowToBill(data as unknown as BillRow)
}

export async function listBills(): Promise<AsadoBill[]> {
  const { data, error } = await supabase
    .from('asado_bills')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as unknown as BillRow[]).map(rowToBill)
}

export async function calculateSplits(
  billId: string
): Promise<
  { participant: string; owes: number; expenses: { label: string; amount: number }[] }[]
> {
  const bill = await getBill(billId)
  if (!bill) throw new Error('Bill not found')

  const total = bill.expenses.reduce((s, e) => s + e.amount, 0)
  const perPerson = total / bill.participants.length

  return bill.participants.map((p) => {
    const paid = bill.expenses
      .filter((e) => e.paidBy === p)
      .reduce((s, e) => s + e.amount, 0)
    return {
      participant: p,
      owes: Math.max(0, perPerson - paid),
      expenses: bill.expenses.filter((e) => e.paidBy === p),
    }
  })
}
