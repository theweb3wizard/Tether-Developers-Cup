"use client";

import { useState } from "react";

export default function WalletPage() {
  const [step, setStep] = useState<"start" | "created" | "dashboard">("start");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState("");

  const createWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/create", { method: "POST" });
      const data = await res.json();
      setSeedPhrase(data.seedPhrase);
      setAddress(data.address);
      setBalance(data.balance);
      setUsdtBalance("0");
      setStep("created");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/balance");
      const data = await res.json();
      setAddress(data.address);
      setBalance(data.balance);
      setUsdtBalance(data.usdtBalance);
      setStep("dashboard");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const sendUsdt = async () => {
    if (!sendTo || !sendAmount) return;
    setSending(true);
    try {
      const res = await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: sendTo, amount: sendAmount }),
      });
      const data = await res.json();
      setTxHash(data.hash);
      setSendTo("");
      setSendAmount("");
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4 animate-pulse">👛</div>
        <p className="text-gray-500">Cargando wallet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">👛</div>
        <h1 className="text-3xl font-bold text-blue">Tu Wallet</h1>
        <p className="text-gray-500">Auto-custodia. Tus llaves, tus USDt.</p>
      </div>

      {step === "start" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-lg">Crear Wallet Nueva</h2>
            <p className="text-sm text-gray-500">
              Generamos una seed phrase. Guardala en un lugar seguro. Nadie más va a tener acceso a tus fondos.
            </p>
            <button onClick={createWallet} className="btn-primary w-full">
              Crear mi Wallet 🇦🇷
            </button>
          </div>
          <div className="card space-y-4">
            <h2 className="font-semibold text-lg">Ya tenés una wallet?</h2>
            <p className="text-sm text-gray-500">
              Si ya creaste una wallet antes, cargá tu wallet existente.
            </p>
            <button onClick={loadWallet} className="btn-gold w-full">
              Cargar Wallet Existente
            </button>
          </div>
        </div>
      )}

      {step === "created" && (
        <div className="card space-y-4 border-2 border-gold">
          <h2 className="font-semibold text-lg">✅ Wallet Creada</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Seed Phrase (guardala!)</label>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 relative">
              <p className="font-mono text-sm break-all pr-8">{seedPhrase}</p>
              <button onClick={() => copyToClipboard(seedPhrase, "seed")}
                className="absolute top-2 right-2 text-xs bg-yellow-200 px-2 py-1 rounded">
                {copied === "seed" ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <p className="text-xs text-red-500 font-medium">⚠️ No la compartas con nadie.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Dirección (Sepolia)</label>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <code className="text-sm font-mono">{address.slice(0, 14)}...{address.slice(-6)}</code>
              <button onClick={() => copyToClipboard(address, "addr")}
                className="text-xs bg-gray-200 px-2 py-1 rounded">
                {copied === "addr" ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-celeste/10 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">ETH</p>
              <p className="font-bold text-lg">{balance}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">USDT</p>
              <p className="font-bold text-lg">{usdtBalance}</p>
            </div>
          </div>

          <button onClick={loadWallet} className="btn-primary w-full">
            Ir al Dashboard
          </button>
        </div>
      )}

      {step === "dashboard" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Dashboard</h2>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Conectado</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <code className="text-sm font-mono">{address.slice(0, 10)}...{address.slice(-6)}</code>
              <button onClick={() => copyToClipboard(address, "addr")}
                className="text-xs bg-gray-200 px-2 py-1 rounded">
                {copied === "addr" ? "Copiado!" : "Copiar"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-celeste/10 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">ETH</p>
                <p className="font-bold text-2xl text-blue">{balance}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">USDT</p>
                <p className="font-bold text-2xl text-green-700">{usdtBalance}</p>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-lg">Enviar USDT</h2>
            {txHash ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                ✅ Transacción enviada! Hash: <code className="font-mono text-xs">{txHash.slice(0, 16)}...</code>
                <button onClick={() => setTxHash("")} className="block text-blue mt-1 text-xs">Enviar otro</button>
              </div>
            ) : (
              <>
                <input className="input-field" placeholder="Dirección destino (0x...)" value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)} />
                <input className="input-field" type="number" placeholder="Cantidad USDt" value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)} min={0} step={0.01} />
                <button onClick={sendUsdt} disabled={sending || !sendTo || !sendAmount} className="btn-primary w-full">
                  {sending ? "Enviando..." : `Enviar ${sendAmount || ''} USDT`}
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <a href="/pool" className="btn-gold flex-1 text-center text-sm">Crear POZO</a>
            <a href="/asado" className="btn-primary flex-1 text-center text-sm">El Asado Fund</a>
          </div>
        </div>
      )}
    </div>
  );
}
