'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadIdentity } from '@/lib/identity';
import { useToast } from '@/components/Toast';

type AsadoBill = {
  id: string; name: string;
  expenses: { id: string; label: string; amount: number; paidBy: string }[];
  participants: string[];
};

type SplitInfo = {
  participant: string; owes: number;
  expenses: { label: string; amount: number }[];
};

export default function AsadoPage() {
  const identity = loadIdentity();
  const [bills, setBills] = useState<AsadoBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [billName, setBillName] = useState('');
  const [participantInput, setParticipantInput] = useState(identity?.username || '');
  const [participants, setParticipants] = useState<string[]>([]);
  const [selectedBill, setSelectedBill] = useState<AsadoBill | null>(null);
  const [splits, setSplits] = useState<SplitInfo[]>([]);
  const [newExpenseLabel, setNewExpenseLabel] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpensePaidBy, setNewExpensePaidBy] = useState('');
  const { toast } = useToast();

  const fetchBills = async () => {
    const res = await fetch('/api/asado');
    setBills(await res.json());
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchBills(); }, []);

  const createBill = async () => {
    if (participants.length < 2) { toast('Necesitás al menos 2 participantes', 'error'); return; }
    const res = await fetch('/api/asado', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', name: billName || 'Asado', participants }),
    });
    const data = await res.json();
    setSelectedBill(data);
    setShowCreate(false);
    setBillName('');
    setParticipants([]);
    fetchBills();
    toast('Cuenta creada!', 'success');
  };

  const addExpense = async () => {
    if (!selectedBill || !newExpenseLabel || !newExpenseAmount || !newExpensePaidBy) return;
    if (Number(newExpenseAmount) <= 0) { toast('Monto inválido', 'error'); return; }
    const res = await fetch('/api/asado', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-expense', billId: selectedBill.id, label: newExpenseLabel, amount: Number(newExpenseAmount), paidBy: newExpensePaidBy }),
    });
    setSelectedBill(await res.json());
    setNewExpenseLabel(''); setNewExpenseAmount(''); setNewExpensePaidBy('');
    toast('Gasto agregado!', 'success');
  };

  const calcSplits = async () => {
    if (!selectedBill) return;
    const res = await fetch('/api/asado', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'split', billId: selectedBill.id }),
    });
    setSplits(await res.json());
    toast('División calculada!', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-8 w-40 mb-1" />
        <div className="skeleton h-3 w-52 mb-5" />
        {[1, 2].map((i) => (
          <div key={i} className="rounded-3xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)' }}>
            <div className="skeleton h-5 w-36" /><div className="skeleton h-3 w-48" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl text-white">El Asado Fund</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Dividí los gastos de la previa</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedBill && (
            <button
              onClick={() => { setSelectedBill(null); setSplits([]); }}
              className="text-xs font-semibold flex items-center gap-1 transition-colors"
              style={{ color: 'var(--celeste)' }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="btn btn-gold text-sm" style={{ padding: '0.5rem 1.1rem', minHeight: '38px' }}>
            + Nueva
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div
          className="rounded-3xl p-5 space-y-4 animate-scale-in"
          style={{
            background: 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
            border: '1px solid var(--border-accent)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          <h2 className="font-display text-lg text-white">Nueva Cuenta</h2>
          <input className="input" placeholder="Nombre (ej: Asado del 7/7)" value={billName}
            onChange={(e) => setBillName(e.target.value)} />
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Participantes</label>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Nombre" value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && participantInput && !participants.includes(participantInput)) { setParticipants([...participants, participantInput]); setParticipantInput(''); } }} />
              <button
                onClick={() => { if (participantInput && !participants.includes(participantInput)) { setParticipants([...participants, participantInput]); setParticipantInput(''); } }}
                className="btn btn-primary text-sm px-4"
                style={{ minHeight: '46px', padding: '0.5rem 1rem' }}
              >+</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--celeste-dim)', color: 'var(--celeste)', border: '1px solid var(--celeste-border)' }}>
                  {p}
                  <button onClick={() => setParticipants(participants.filter((x) => x !== p))}
                    className="font-bold leading-none" style={{ color: 'var(--danger)' }}>&times;</button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={createBill} disabled={participants.length < 2} className="btn btn-primary flex-1">Crear Cuenta</button>
            <button onClick={() => setShowCreate(false)} className="btn btn-ghost flex-1">Cancelar</button>
          </div>
        </div>
      )}

      {/* Selected bill detail */}
      {selectedBill ? (
        <div className="space-y-4 stagger">
          <div
            className="rounded-3xl p-5 space-y-5"
            style={{
              background: 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
              border: '1px solid var(--border-accent)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div>
              <h2 className="font-display text-xl text-white">{selectedBill.name}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedBill.participants.map((p) => (
                  <span key={p} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--celeste-dim)', color: 'var(--celeste)', border: '1px solid var(--celeste-border)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {selectedBill.expenses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Gastos</p>
                <div className="space-y-1.5">
                  {selectedBill.expenses.map((e) => (
                    <div key={e.id} className="flex justify-between items-center text-sm px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {e.label} <span style={{ color: 'var(--text-tertiary)' }}>({e.paidBy})</span>
                      </span>
                      <span className="font-mono-nums font-bold text-white">${e.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add expense */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Agregar gasto</p>
              <div className="grid grid-cols-3 gap-2">
                <input className="input text-sm" placeholder="Gasto" value={newExpenseLabel}
                  onChange={(e) => setNewExpenseLabel(e.target.value)} />
                <input className="input text-sm" type="number" placeholder="$" value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)} />
                <select className="select text-sm" value={newExpensePaidBy}
                  onChange={(e) => setNewExpensePaidBy(e.target.value)}>
                  <option value="">Pagó</option>
                  {selectedBill.participants.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button
                onClick={addExpense}
                disabled={!newExpenseLabel || !newExpenseAmount || !newExpensePaidBy || Number(newExpenseAmount) <= 0}
                className="btn btn-primary w-full text-sm"
              >
                Agregar Gasto
              </button>
            </div>

            {selectedBill.expenses.length > 0 && (
              <button onClick={calcSplits} className="btn btn-gold w-full text-sm">
                ÷ Calcular División
              </button>
            )}
          </div>

          {/* Split results */}
          {splits.length > 0 && (
            <div
              className="rounded-3xl p-5 space-y-3 animate-scale-in"
              style={{
                background: 'linear-gradient(145deg, rgba(0,229,160,0.06) 0%, var(--bg-card) 70%)',
                border: '1px solid rgba(0,229,160,0.2)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <h3 className="font-display text-lg" style={{ color: 'var(--success)' }}>División de Gastos</h3>
              {splits.map((s) => (
                <div key={s.participant} className="flex justify-between items-center text-sm px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-medium text-white">{s.participant}</span>
                  <span className="font-bold font-mono-nums" style={{ color: s.owes > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {s.owes > 0 ? `Debe $${s.owes.toFixed(2)}` : 'Al día ✓'}
                  </span>
                </div>
              ))}
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Liquidá con USDT directo desde tu Wallet.</p>
              <Link href="/wallet" className="btn btn-primary text-sm text-center block">
                💳 Ir a Wallet
              </Link>
            </div>
          )}
        </div>
      ) : bills.length === 0 ? (
        <div className="rounded-3xl text-center py-14 space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)' }}>
          <div className="w-36 h-36 mx-auto opacity-50">
            <img src="/IMG/empty-asado.png" alt="No hay cuentas" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-medium text-white">Todavía no hay cuentas</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Creá la primera y empezá a dividir gastos</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">Crear primera cuenta</button>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            const total = bill.expenses.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={bill.id}
                className="rounded-3xl p-5 space-y-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)', boxShadow: 'var(--shadow-card)' }}
                onClick={() => { setSelectedBill(bill); setSplits([]); }}>
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-lg text-white">{bill.name}</h3>
                  <span className="font-mono-nums font-bold text-lg" style={{ color: 'var(--gold)' }}>${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span>{bill.expenses.length} {bill.expenses.length === 1 ? 'gasto' : 'gastos'}</span>
                  <span>{bill.participants.length} {bill.participants.length === 1 ? 'persona' : 'personas'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
