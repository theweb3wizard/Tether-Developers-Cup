"use client";

import { useState, useEffect, useCallback } from "react";

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
  const [bills, setBills] = useState<AsadoBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [billName, setBillName] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [selectedBill, setSelectedBill] = useState<AsadoBill | null>(null);
  const [splits, setSplits] = useState<SplitInfo[]>([]);
  const [newExpenseLabel, setNewExpenseLabel] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpensePaidBy, setNewExpensePaidBy] = useState("");

  const fetchBills = useCallback(async () => {
    const res = await fetch("/api/asado");
    setBills(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const createBill = async () => {
    if (participants.length < 2) return;
    const res = await fetch("/api/asado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: billName || "Asado", participants }),
    });
    const data = await res.json();
    setSelectedBill(data);
    setShowCreate(false);
    setBillName("");
    setParticipants([]);
    fetchBills();
  };

  const addParticipant = () => {
    if (participantInput && !participants.includes(participantInput)) {
      setParticipants([...participants, participantInput]);
      setParticipantInput("");
    }
  };

  const addExpense = async () => {
    if (!selectedBill || !newExpenseLabel || !newExpenseAmount || !newExpensePaidBy) return;
    const res = await fetch("/api/asado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add-expense",
        billId: selectedBill.id,
        label: newExpenseLabel,
        amount: Number(newExpenseAmount),
        paidBy: newExpensePaidBy,
      }),
    });
    const data = await res.json();
    setSelectedBill(data);
    setNewExpenseLabel("");
    setNewExpenseAmount("");
    setNewExpensePaidBy("");
  };

  const calcSplits = async () => {
    if (!selectedBill) return;
    const res = await fetch("/api/asado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "split", billId: selectedBill.id }),
    });
    setSplits(await res.json());
  };

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4 animate-pulse">🥩</div>
      <p className="text-gray-500">Cargando...</p>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue">El Asado Fund</h1>
          <p className="text-gray-500 text-sm">Dividí los gastos de la previa</p>
        </div>
        <div className="flex gap-2">
          {selectedBill && (
            <button onClick={() => { setSelectedBill(null); setSplits([]); }}
              className="btn-primary text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1.5 rounded-lg">
              ← Volver
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="btn-gold text-sm">+ Nueva Cuenta</button>
        </div>
      </div>

      {showCreate && (
        <div className="card space-y-4 border-2 border-gold">
          <h2 className="font-semibold text-lg">Nueva Cuenta</h2>
          <input className="input-field" placeholder="Nombre (ej: Asado del 7/7)"
            value={billName} onChange={(e) => setBillName(e.target.value)} />
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Participantes</label>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Nombre" value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addParticipant()} />
              <button onClick={addParticipant} className="btn-primary text-sm px-4">+</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {participants.map((p) => (
                <span key={p} className="bg-celeste/20 text-blue text-xs px-2 py-1 rounded-full">
                  {p}
                  <button onClick={() => setParticipants(participants.filter((x) => x !== p))}
                    className="ml-1 text-red-400">&times;</button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createBill} disabled={participants.length < 2} className="btn-primary flex-1">
              Crear Cuenta
            </button>
            <button onClick={() => setShowCreate(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 flex-1 rounded-lg font-semibold">Cancelar</button>
          </div>
        </div>
      )}

      {selectedBill ? (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-bold text-lg">{selectedBill.name}</h2>
            <div className="flex flex-wrap gap-1">
              {selectedBill.participants.map((p) => (
                <span key={p} className="bg-celeste/10 text-blue text-xs px-2 py-1 rounded-full">{p}</span>
              ))}
            </div>

            {selectedBill.expenses.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Gastos:</p>
                {selectedBill.expenses.map((e) => (
                  <div key={e.id} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span>{e.label} <span className="text-gray-500">({e.paidBy})</span></span>
                    <span className="font-medium">${e.amount}</span>
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
            <button onClick={addExpense} className="btn-primary w-full text-sm">Agregar Gasto</button>

            {selectedBill.expenses.length > 0 && (
              <button onClick={calcSplits} className="btn-gold w-full text-sm">Calcular División</button>
            )}
          </div>

          {splits.length > 0 && (
            <div className="card space-y-3 border-2 border-green-200 bg-green-50">
              <h3 className="font-bold text-green-800">División de Gastos</h3>
              {splits.map((s) => (
                <div key={s.participant} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{s.participant}</span>
                  <span className={s.owes > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                    {s.owes > 0 ? `Debe $${s.owes.toFixed(2)}` : "Al día ✅"}
                  </span>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">
                Liquidá con USDT directo desde tu Wallet.
              </p>
              <a href="/wallet" className="btn-primary text-sm text-center block">Ir a Wallet</a>
            </div>
          )}
        </div>
      ) : bills.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <div className="text-5xl">🥩</div>
          <p className="text-gray-500">Todavía no hay cuentas</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            Crear primera cuenta
          </button>
        </div>
      ) : (
        bills.map((bill) => (
          <div key={bill.id} className="card space-y-2 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => { setSelectedBill(bill); setSplits([]); }}>
            <h3 className="font-bold text-blue">{bill.name}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{bill.expenses.length} gastos</span>
              <span>{bill.participants.length} personas</span>
              <span className="font-bold text-gold-dark">
                ${bill.expenses.reduce((s, e) => s + e.amount, 0)} total
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
