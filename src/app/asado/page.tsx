'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadIdentity, saveIdentity } from '@/lib/identity';
import { useToast } from '@/components/Toast';

type AsadoBill = {
  id: string;
  name: string;
  expenses: { id: string; label: string; amount: number; paidBy: string }[];
  participants: string[];
};

type SplitInfo = {
  participant: string;
  owes: number;
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

  const fetchBills = useCallback(async () => {
    const res = await fetch('/api/asado');
    setBills(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const createBill = async () => {
    if (participants.length < 2) { toast('Necesitás al menos 2 participantes', 'error'); return; }
    const res = await fetch('/api/asado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  const addParticipant = () => {
    if (participantInput && !participants.includes(participantInput)) {
      setParticipants([...participants, participantInput]);
      setParticipantInput('');
    }
  };

  const addExpense = async () => {
    if (!selectedBill || !newExpenseLabel || !newExpenseAmount || !newExpensePaidBy) return;
    if (Number(newExpenseAmount) <= 0) { toast('Monto inválido', 'error'); return; }
    const res = await fetch('/api/asado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add-expense',
        billId: selectedBill.id,
        label: newExpenseLabel,
        amount: Number(newExpenseAmount),
        paidBy: newExpensePaidBy,
      }),
    });
    const data = await res.json();
    setSelectedBill(data);
    setNewExpenseLabel('');
    setNewExpenseAmount('');
    setNewExpensePaidBy('');
    toast('Gasto agregado!', 'success');
  };

  const calcSplits = async () => {
    if (!selectedBill) return;
    const res = await fetch('/api/asado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'split', billId: selectedBill.id }),
    });
    setSplits(await res.json());
    toast('División calculada!', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-8 w-40 rounded-lg mb-2" />
        <div className="skeleton h-4 w-52 rounded-lg mb-6" />
        {[1, 2].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-5 w-36 rounded-lg" />
            <div className="skeleton h-3 w-48 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-blue">El Asado Fund</h1>
          <p className="text-gray-500 text-sm">Dividí los gastos de la previa</p>
        </div>
        <div className="flex gap-2">
          {selectedBill && (
            <button onClick={() => { setSelectedBill(null); setSplits([]); }}
              className="btn-primary text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition-all">
              ← Volver
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="btn-gold text-sm">+ Nueva Cuenta</button>
        </div>
      </div>

      {showCreate && (
        <div className="card space-y-4 border-2 border-gold/60 shadow-lg">
          <h2 className="font-bold text-lg text-blue">Nueva Cuenta</h2>
          <input className="input-field" placeholder="Nombre (ej: Asado del 7/7)"
            value={billName} onChange={(e) => setBillName(e.target.value)} />
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Participantes</label>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Nombre" value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()} />
              <button onClick={addParticipant} className="btn-primary text-sm px-4">+</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p) => (
                <span key={p} className="bg-celeste/20 text-blue text-xs font-medium px-2.5 py-1 rounded-full border border-celeste/20">
                  {p}
                  <button onClick={() => setParticipants(participants.filter((x) => x !== p))}
                    className="ml-1.5 text-red-400 hover:text-red-600 font-bold">&times;</button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createBill} disabled={participants.length < 2}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
              Crear Cuenta
            </button>
            <button onClick={() => setShowCreate(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 flex-1 rounded-xl font-semibold transition-all">Cancelar</button>
          </div>
        </div>
      )}

      {selectedBill ? (
        <div className="space-y-4">
          <div className="card space-y-4 hover:shadow-xl transition-all duration-300">
            <h2 className="font-bold text-xl text-blue">{selectedBill.name}</h2>
            <div className="flex flex-wrap gap-1.5">
              {selectedBill.participants.map((p) => (
                <span key={p} className="bg-celeste/10 text-blue text-xs font-medium px-2.5 py-1 rounded-full border border-celeste/10">{p}</span>
              ))}
            </div>

            {selectedBill.expenses.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gastos:</p>
                {selectedBill.expenses.map((e) => (
                  <div key={e.id} className="flex justify-between text-sm bg-gray-50 rounded-xl px-3 py-2.5">
                    <span>{e.label} <span className="text-gray-500">({e.paidBy})</span></span>
                    <span className="font-bold">${e.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <input className="input-field text-sm" placeholder="Gasto" value={newExpenseLabel}
                onChange={(e) => setNewExpenseLabel(e.target.value)} />
              <input className="input-field text-sm" type="number" placeholder="$" value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)} />
              <select className="input-field text-sm" value={newExpensePaidBy}
                onChange={(e) => setNewExpensePaidBy(e.target.value)}>
                <option value="">Pagó</option>
                {selectedBill.participants.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <button onClick={addExpense} disabled={!newExpenseLabel || !newExpenseAmount || !newExpensePaidBy || Number(newExpenseAmount) <= 0}
              className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed">Agregar Gasto</button>

            {selectedBill.expenses.length > 0 && (
              <button onClick={calcSplits} className="btn-gold w-full text-sm">Calcular División</button>
            )}
          </div>

          {splits.length > 0 && (
            <div className="card space-y-3 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <h3 className="font-bold text-green-800">División de Gastos</h3>
              {splits.map((s) => (
                <div key={s.participant} className="flex justify-between items-center text-sm bg-white/80 rounded-xl px-3 py-2.5">
                  <span className="font-medium">{s.participant}</span>
                  <span className={s.owes > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-semibold'}>
                    {s.owes > 0 ? `Debe $${s.owes.toFixed(2)}` : 'Al día ✅'}
                  </span>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">Liquidá con USDT directo desde tu Wallet.</p>
              <a href="/wallet" className="btn-primary text-sm text-center block">Ir a Wallet</a>
            </div>
          )}
        </div>
      ) : bills.length === 0 ? (
        <div className="card text-center py-12 space-y-4">
          <div className="relative w-48 h-48 mx-auto">
            <img src="/IMG/empty-asado.png" alt="No hay cuentas" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-gray-500 font-medium">Todavía no hay cuentas</p>
            <p className="text-xs text-gray-400 mt-1">Creá la primera y empezá a dividir gastos</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">Crear primera cuenta</button>
        </div>
      ) : (
        bills.map((bill) => (
          <div key={bill.id} className="card space-y-2 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => { setSelectedBill(bill); setSplits([]); }}>
            <h3 className="font-bold text-blue">{bill.name}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{bill.expenses.length} {bill.expenses.length === 1 ? 'gasto' : 'gastos'}</span>
              <span>{bill.participants.length} {bill.participants.length === 1 ? 'persona' : 'personas'}</span>
              <span className="font-bold text-gold-dark ml-auto">
                ${bill.expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)} total
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
