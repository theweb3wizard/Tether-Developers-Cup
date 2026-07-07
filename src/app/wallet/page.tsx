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
        <div className="relative w-32 h-32 mx-auto mb-6 animate-float">
          <img src="/IMG/onboarding-goat.png" alt="Cargando" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
        <p className="text-gray-500 animate-pulse">Preparando tu wallet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-3">
        <div className="relative w-20 h-20 mx-auto">
          <img src="/IMG/onboarding-goat.png" alt="GOAT" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
        <h1 className="text-3xl font-black text-blue">Tu Wallet</h1>
        <p className="text-gray-500">Auto-custodia. Tus llaves, tus USDt.</p>
      </div>

      {step === "start" && (
        <div className="space-y-4">
          <div className="card space-y-4 group hover:shadow-lg transition-all duration-300">
            <h2 className="font-bold text-lg text-blue">Crear Wallet Nueva</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Generamos una seed phrase única. Guardala en un lugar seguro — nadie más va a tener acceso a tus fondos.
            </p>
            <button onClick={createWallet} className="btn-primary w-full">
              Crear mi Wallet 🇦🇷
            </button>
          </div>
          <div className="card space-y-4 group hover:shadow-lg transition-all duration-300">
            <h2 className="font-bold text-lg text-blue">Ya tenés una wallet?</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Si ya creaste una wallet antes, cargá tu wallet existente retomando la sesión anterior.
            </p>
            <button onClick={loadWallet} className="btn-gold w-full">
              Cargar Wallet Existente
            </button>
          </div>
        </div>
      )}

      {step === "created" && (
        <div className="card space-y-5 border-2 border-gold/60 shadow-lg">
          <h2 className="font-bold text-lg text-green-700">✅ Wallet Creada con Éxito</h2>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600">Seed Phrase</label>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 relative">
              <p className="font-mono text-sm break-all pr-8 leading-relaxed">{seedPhrase}</p>
              <button onClick={() => copyToClipboard(seedPhrase, "seed")}
                className="absolute top-3 right-3 text-xs bg-yellow-200 hover:bg-yellow-300 font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                {copied === "seed" ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-red-500 font-bold text-sm mt-0.5">⚠️</span>
              <p className="text-xs text-red-600 font-medium leading-relaxed">
                No la compartas con nadie. Esta frase es la única forma de recuperar tus fondos.
                Si la perdés, no hay banco que te ayude.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600">Dirección (Sepolia)</label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
              <code className="text-sm font-mono text-gray-700">{address.slice(0, 14)}...{address.slice(-6)}</code>
              <button onClick={() => copyToClipboard(address, "addr")}
                className="text-xs bg-gray-200 hover:bg-gray-300 font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                {copied === "addr" ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-celeste/10 to-celeste/20 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">ETH</p>
              <p className="font-black text-2xl text-blue mt-1">{balance}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">USDT</p>
              <p className="font-black text-2xl text-green-700 mt-1">{usdtBalance}</p>
            </div>
          </div>

          <button onClick={loadWallet} className="btn-primary w-full">
            Ir al Dashboard
          </button>
        </div>
      )}

      {step === "dashboard" && (
        <div className="space-y-4">
          <div className="card space-y-4 group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-blue">Dashboard</h2>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
                Conectado
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
              <code className="text-sm font-mono text-gray-700">{address.slice(0, 10)}...{address.slice(-6)}</code>
              <button onClick={() => copyToClipboard(address, "addr")}
                className="text-xs bg-gray-200 hover:bg-gray-300 font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                {copied === "addr" ? "Copiado!" : "Copiar"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-celeste/10 to-celeste/20 rounded-xl p-5 text-center">
                <p className="text-xs text-gray-500 font-medium">ETH</p>
                <p className="font-black text-3xl text-blue mt-1">{balance}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 text-center">
                <p className="text-xs text-gray-500 font-medium">USDT</p>
                <p className="font-black text-3xl text-green-700 mt-1">{usdtBalance}</p>
              </div>
            </div>
          </div>

          <div className="card space-y-4 group hover:shadow-lg transition-all duration-300">
            <h2 className="font-bold text-lg text-blue">Enviar USDT</h2>
            {txHash ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-sm space-y-2">
                <p className="font-semibold text-green-700">✅ Transacción enviada!</p>
                <code className="font-mono text-xs text-gray-600 break-all">{txHash}</code>
                <button onClick={() => setTxHash("")} className="block text-celeste-dark font-semibold text-xs mt-1 hover:underline">
                  Enviar otro
                </button>
              </div>
            ) : (
              <>
                <input className="input-field" placeholder="Dirección destino (0x...)" value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)} />
                <input className="input-field" type="number" placeholder="Cantidad USDt" value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)} min={0} step={0.01} />
                <button onClick={sendUsdt} disabled={sending || !sendTo || !sendAmount}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  {sending ? "Enviando..." : `Enviar ${sendAmount || ''} USDT`}
                </button>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <a href="/pool" className="btn-gold flex-1 text-center text-sm">Crear POZO</a>
            <a href="/asado" className="btn-primary flex-1 text-center text-sm">El Asado Fund</a>
          </div>
        </div>
      )}
    </div>
  );
}
