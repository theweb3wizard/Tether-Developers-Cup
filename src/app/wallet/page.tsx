'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadIdentity, saveIdentity, generateUserId } from '@/lib/identity';
import { useToast } from '@/components/Toast';

type WalletStep = 'start' | 'created' | 'dashboard' | 'restore';

export default function WalletPage() {
  const [step, setStep] = useState<WalletStep>('start');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [restoreSeed, setRestoreSeed] = useState('');
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [username, setUsername] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const id = loadIdentity();
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(id.username);
      // If user already has a real address, jump straight to dashboard fetch
      if (id.address && id.address !== '0x...') {
      setAddress(id.address);
      }
    }
  }, []);

  // ── Create new wallet ────────────────────────────────────────────────────────
  const createWallet = async () => {
    if (!username.trim()) { toast('Ingresá tu nombre de usuario', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/create', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear wallet');
      setSeedPhrase(data.seedPhrase);
      setAddress(data.address);
      setBalance(data.balance ?? '0');
      setUsdtBalance('0');
      saveIdentity({
        userId: generateUserId(),
        username: username.trim(),
        address: data.address,
      });
      setStep('created');
      toast('Wallet creada! Guardá tu seed phrase', 'success');
    } catch (e: unknown) {
      toast((e as Error).message || 'Error al crear wallet', 'error');
    }
    setLoading(false);
  };

  // ── Restore from seed phrase ─────────────────────────────────────────────────
  const restoreWallet = async () => {
    const trimmed = restoreSeed.trim();
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount < 12) {
      toast('La seed phrase debe tener 12 palabras', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPhrase: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al restaurar wallet');
      setAddress(data.address);
      setBalance(data.balance ?? '0');
      setUsdtBalance(data.usdtBalance ?? '0');
      const existing = loadIdentity();
      saveIdentity({
        userId: existing?.userId ?? generateUserId(),
        username: (existing?.username ?? username.trim()) || 'Usuario',
        address: data.address,
      });
      setRestoreSeed(''); // clear sensitive input
      setStep('dashboard');
      toast('Wallet restaurada!', 'success');
    } catch (e: unknown) {
      toast((e as Error).message || 'Error al restaurar wallet', 'error');
    }
    setLoading(false);
  };

  // ── Load dashboard (existing session) ───────────────────────────────────────
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/balance');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar wallet');
      setAddress(data.address);
      setBalance(data.balance);
      setUsdtBalance(data.usdtBalance);
      setStep('dashboard');
      toast('Wallet cargada', 'success');
    } catch (e: unknown) {
      toast((e as Error).message || 'Error al cargar wallet', 'error');
    }
    setLoading(false);
  };

  // ── Send USDT ────────────────────────────────────────────────────────────────
  const sendUsdt = async () => {
    if (!sendTo || !sendAmount) return;
    if (!sendTo.startsWith('0x') || sendTo.length < 20) { toast('Dirección inválida', 'error'); return; }
    if (Number(sendAmount) <= 0) { toast('Monto inválido', 'error'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: sendTo, amount: sendAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details);
      setTxHash(data.hash);
      setSendTo('');
      setSendAmount('');
      toast('USDT enviado!', 'success');
    } catch (e: unknown) {
      toast((e as Error).message || 'Error al enviar', 'error');
    }
    setSending(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden animate-float"
          style={{ boxShadow: '0 0 0 1px rgba(99,195,255,0.2), 0 0 40px rgba(99,195,255,0.1)' }}>
          <img src="/IMG/onboarding-goat.png" alt="Cargando" className="w-full h-full object-cover" />
        </div>
        <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          Preparando tu wallet...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-2">
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex-none"
          style={{ boxShadow: '0 0 0 1px rgba(99,195,255,0.2), 0 0 24px rgba(99,195,255,0.1)' }}>
          <img src="/IMG/onboarding-goat.png" alt="Wallet" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-white">Wallet</h1>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Auto-custodia · Tus llaves, tus USDt</p>
        </div>
      </div>

      {/* ── START ─────────────────────────────────────────────────────────────── */}
      {step === 'start' && (
        <div className="space-y-3 stagger">

          {/* Create */}
          <div className="rounded-3xl p-5 space-y-4"
            style={{ background: 'linear-gradient(145deg, rgba(99,195,255,0.06) 0%, var(--bg-card) 70%)', border: '1px solid rgba(99,195,255,0.14)', boxShadow: 'var(--shadow-elevated)' }}>
            <div className="flex items-center gap-2">
              <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, var(--celeste), var(--celeste-glow))' }} />
              <h2 className="font-display text-lg text-white">Crear Wallet Nueva</h2>
            </div>
            <input className="input" placeholder="Tu nombre de usuario"
              value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createWallet()} />
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Generamos una seed phrase única. Guardala en un lugar seguro.
            </p>
            <button onClick={createWallet} disabled={!username.trim()} className="btn btn-primary w-full">
              Crear mi Wallet
            </button>
          </div>

          {/* Restore from seed */}
          <button
            onClick={() => setStep('restore')}
            className="btn btn-ghost w-full text-sm"
          >
            🔑 Restaurar desde seed phrase
          </button>

          {/* Load server session */}
          <div className="rounded-3xl p-5 space-y-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)', boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2">
              <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, var(--gold), var(--gold-dark))' }} />
              <h2 className="font-display text-lg text-white">Cargar Sesión</h2>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Si ya iniciaste una sesión en este servidor, cargá tu balance.
            </p>
            <button onClick={loadDashboard} className="btn btn-gold w-full">
              Cargar Wallet
            </button>
          </div>
        </div>
      )}

      {/* ── RESTORE SEED ──────────────────────────────────────────────────────── */}
      {step === 'restore' && (
        <div className="rounded-3xl p-5 space-y-4 animate-scale-in"
          style={{ background: 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)', border: '1px solid var(--border-accent)', boxShadow: 'var(--shadow-elevated)' }}>
          <div>
            <h2 className="font-display text-xl text-white mb-1">Restaurar Wallet</h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Ingresá tus 12 palabras de recuperación, separadas por espacios.
            </p>
          </div>

          {/* Warn before entering seed */}
          <div className="rounded-xl p-3 flex items-start gap-2"
            style={{ background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.25)' }}>
            <span className="text-sm mt-0.5">⚠️</span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--warning)' }}>
              Solo ingresá tu seed phrase en dispositivos de confianza. Nunca la compartas.
            </p>
          </div>

          <textarea
            className="input font-mono-nums text-xs"
            style={{ minHeight: '90px', resize: 'none', lineHeight: 1.7 }}
            placeholder="palabra1 palabra2 palabra3 ... palabra12"
            value={restoreSeed}
            onChange={(e) => setRestoreSeed(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {username === '' && (
            <input className="input text-sm" placeholder="Tu nombre de usuario (opcional)"
              value={username} onChange={(e) => setUsername(e.target.value)} />
          )}

          <div className="flex gap-2.5">
            <button onClick={() => setStep('start')} className="btn btn-ghost flex-none px-4">←</button>
            <button
              onClick={restoreWallet}
              disabled={restoreSeed.trim().split(/\s+/).length < 12}
              className="btn btn-gold flex-1"
            >
              Restaurar
            </button>
          </div>
        </div>
      )}

      {/* ── CREATED ───────────────────────────────────────────────────────────── */}
      {step === 'created' && (
        <div className="rounded-3xl p-5 space-y-5 animate-scale-in"
          style={{ background: 'linear-gradient(145deg, rgba(255,209,102,0.07) 0%, var(--bg-elevated) 60%)', border: '1px solid rgba(255,209,102,0.2)', boxShadow: 'var(--shadow-elevated)' }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <h2 className="font-display text-xl" style={{ color: 'var(--gold)' }}>Wallet Creada</h2>
          </div>

          {/* Seed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Seed Phrase</p>
              <button onClick={() => copyToClipboard(seedPhrase, 'seed')}
                className="text-xs font-semibold px-3 py-1 rounded-lg transition-all"
                style={{ background: copied === 'seed' ? 'rgba(0,229,160,0.15)' : 'rgba(255,209,102,0.15)', color: copied === 'seed' ? 'var(--success)' : 'var(--gold)', border: `1px solid ${copied === 'seed' ? 'rgba(0,229,160,0.3)' : 'rgba(255,209,102,0.3)'}` }}>
                {copied === 'seed' ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(4,6,13,0.7)', border: '1px solid rgba(255,209,102,0.15)' }}>
              <p className="font-mono-nums text-sm break-all leading-relaxed" style={{ color: 'var(--text-primary)' }}>{seedPhrase}</p>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl p-3"
              style={{ background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)' }}>
              <span className="text-base mt-0.5">⚠️</span>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,77,106,0.9)' }}>
                No la compartas con nadie. Esta frase es la única forma de recuperar tus fondos.
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Dirección (Sepolia)</p>
            <div className="flex items-center justify-between rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-white)' }}>
              <code className="text-xs font-mono-nums" style={{ color: 'var(--text-secondary)' }}>{address.slice(0, 14)}...{address.slice(-6)}</code>
              <button onClick={() => copyToClipboard(address, 'addr')}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                style={{ background: copied === 'addr' ? 'rgba(0,229,160,0.15)' : 'rgba(99,195,255,0.15)', color: copied === 'addr' ? 'var(--success)' : 'var(--celeste)', border: `1px solid ${copied === 'addr' ? 'rgba(0,229,160,0.3)' : 'var(--celeste-border)'}` }}>
                {copied === 'addr' ? '✓' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'ETH', value: balance, color: 'var(--celeste)', dim: 'rgba(99,195,255,0.06)' },
              { label: 'USDT', value: usdtBalance, color: 'var(--gold)', dim: 'rgba(255,209,102,0.06)' },
            ].map((b) => (
              <div key={b.label} className="rounded-2xl p-4 text-center"
                style={{ background: b.dim, border: `1px solid ${b.color}22` }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>{b.label}</p>
                <p className="font-mono-nums font-bold text-2xl" style={{ color: b.color }}>{b.value}</p>
              </div>
            ))}
          </div>

          <button onClick={loadDashboard} className="btn btn-primary w-full">Ir al Dashboard →</button>
        </div>
      )}

      {/* ── DASHBOARD ─────────────────────────────────────────────────────────── */}
      {step === 'dashboard' && (
        <div className="space-y-4 stagger">
          {/* Balance card */}
          <div className="rounded-3xl p-5 space-y-4 animate-glow"
            style={{ background: 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)', border: '1px solid var(--border-accent)', boxShadow: 'var(--shadow-elevated)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-white">Dashboard</h2>
              <span className="badge badge-open">● Conectado</span>
            </div>
            <div className="flex items-center justify-between rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-white)' }}>
              <code className="text-xs font-mono-nums" style={{ color: 'var(--text-secondary)' }}>
                {address ? `${address.slice(0, 10)}...${address.slice(-6)}` : '—'}
              </code>
              {address && (
                <button onClick={() => copyToClipboard(address, 'addr')}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                  style={{ background: copied === 'addr' ? 'rgba(0,229,160,0.15)' : 'rgba(99,195,255,0.15)', color: copied === 'addr' ? 'var(--success)' : 'var(--celeste)', border: `1px solid ${copied === 'addr' ? 'rgba(0,229,160,0.3)' : 'var(--celeste-border)'}` }}>
                  {copied === 'addr' ? '✓ Copiado' : 'Copiar'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(99,195,255,0.06)', border: '1px solid rgba(99,195,255,0.12)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>ETH</p>
                <p className="font-mono-nums font-bold text-3xl" style={{ color: 'var(--celeste)' }}>{balance}</p>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.12)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>USDT</p>
                <p className="font-mono-nums font-bold text-3xl" style={{ color: 'var(--gold)' }}>{usdtBalance}</p>
              </div>
            </div>
          </div>

          {/* Send USDT */}
          <div className="rounded-3xl p-5 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-white)', boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2">
              <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, var(--celeste), var(--celeste-glow))' }} />
              <h2 className="font-display text-lg text-white">Enviar USDT</h2>
            </div>

            {txHash ? (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(0,229,160,0.07)', border: '1px solid rgba(0,229,160,0.25)' }}>
                <p className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--success)' }}>✓ Transacción enviada</p>
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono-nums text-xs break-all block" style={{ color: 'var(--celeste)' }}>
                  {txHash}
                </a>
                <button onClick={() => setTxHash('')} className="text-xs font-semibold transition-colors" style={{ color: 'var(--celeste)' }}>
                  Enviar otro →
                </button>
              </div>
            ) : (
              <>
                <input className="input" placeholder="Dirección destino (0x...)"
                  value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
                <input className="input" type="number" placeholder="Cantidad USDT"
                  value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} min={0} step={0.01} />
                <button onClick={sendUsdt}
                  disabled={sending || !sendTo || !sendAmount || Number(sendAmount) <= 0}
                  className="btn btn-primary w-full">
                  {sending ? 'Enviando...' : `Enviar ${sendAmount || ''} USDT`}
                </button>
              </>
            )}
          </div>

          {/* Faucet help text */}
          <div className="rounded-2xl p-3 text-center space-y-1"
            style={{ background: 'rgba(99,195,255,0.04)', border: '1px solid var(--border-white)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              ¿Necesitás USDT de prueba en Sepolia?
            </p>
            <div className="flex items-center justify-center gap-3">
              <a href="https://faucets.chain.link/sepolia" target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold" style={{ color: 'var(--celeste)' }}>ETH Faucet →</a>
              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>USDT Faucet →</a>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/pool" className="btn btn-gold text-sm text-center">🏆 Crear POZO</Link>
            <Link href="/asado" className="btn btn-ghost text-sm text-center">🥩 Asado Fund</Link>
          </div>
        </div>
      )}
    </div>
  );
}
