"use client";

import { useState } from "react";

export default function WalletPage() {
  const [step, setStep] = useState<"start" | "created" | "import">("start");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/create", { method: "POST" });
      const data = await res.json();
      setSeedPhrase(data.seedPhrase);
      setAddress(data.address);
      setBalance(data.balance);
      setStep("created");
    } catch (e) {
      console.error("Failed to create wallet:", e);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              Generamos una seed phrase para vos. Escribila y guardala en un lugar seguro.
              Nadie más va a tener acceso a tus fondos.
            </p>
            <button onClick={createWallet} disabled={loading} className="btn-primary w-full">
              {loading ? "Generando..." : "Crear mi Wallet 🇦🇷"}
            </button>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-lg">Importar Wallet Existente</h2>
            <p className="text-sm text-gray-500">
              Ya tenés una seed phrase? Importala para ver tu balance y crear POZOs.
            </p>
            <button onClick={() => setStep("import")} className="btn-gold w-full">
              Importar Wallet
            </button>
          </div>
        </div>
      )}

      {step === "import" && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Importar Seed Phrase</h2>
          <textarea
            className="input-field h-24 font-mono text-sm"
            placeholder="Ingresá tu seed phrase de 12 palabras..."
          />
          <button className="btn-primary w-full">Importar</button>
          <button onClick={() => setStep("start")} className="text-sm text-gray-500 hover:text-blue w-full text-center">
            Volver
          </button>
        </div>
      )}

      {step === "created" && (
        <div className="space-y-4">
          <div className="card space-y-4 border-2 border-gold">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">✅ Wallet Creada</h2>
              <span className="text-gold text-2xl">⭐</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Seed Phrase (guardala!)</label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 relative">
                <p className="font-mono text-sm break-all pr-8">{seedPhrase}</p>
                <button
                  onClick={() => copyToClipboard(seedPhrase)}
                  className="absolute top-2 right-2 text-xs bg-yellow-200 px-2 py-1 rounded"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <p className="text-xs text-red-500 font-medium">
                ⚠️ Esta es la única vez que ves esta frase. No la compartas con nadie.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Dirección (EVM)</label>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <code className="text-sm font-mono">{address.slice(0, 10)}...{address.slice(-6)}</code>
                <button
                  onClick={() => copyToClipboard(address)}
                  className="text-xs bg-gray-200 px-2 py-1 rounded"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-celeste/10 rounded-lg">
              <span className="text-sm font-medium">Balance</span>
              <span className="font-bold text-lg">{balance} USDt</span>
            </div>

            <div className="flex gap-2">
              <a href="/pool" className="btn-gold flex-1 text-center text-sm">Crear POZO</a>
              <button onClick={() => setStep("start")} className="btn-primary flex-1 text-sm">
                Otra Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
