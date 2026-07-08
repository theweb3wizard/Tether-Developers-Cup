'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveIdentity, generateUserId } from '@/lib/identity';

const CABALAS = [
  { id: 'mate', label: 'Mate amargo', emoji: '🧉', desc: 'Antes del partido, obligatorio' },
  { id: 'camiseta', label: 'Misma camiseta', emoji: '👕', desc: 'Sin lavar. Sin excepciones.' },
  { id: 'puesto', label: 'Mismo asiento', emoji: '🪑', desc: 'El mismo lugar siempre' },
  { id: 'grito', label: 'Grito de gol', emoji: '📢', desc: 'Tu grito especial, único' },
  { id: 'billete', label: 'Billete doblado', emoji: '💵', desc: 'En la media, toda la vida' },
  { id: 'medialuna', label: 'Medialuna', emoji: '🥐', desc: 'Una antes del partido' },
  { id: 'silbido', label: 'Silbar el himno', emoji: '🎵', desc: 'La parte que no se canta' },
  { id: 'beso', label: 'Beso a la foto', emoji: '😘', desc: 'Beso a Maradona antes de salir' },
];

const STEPS = ['Bienvenida', 'Identidad', 'Cábala', 'Wallet'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [selectedCabala, setSelectedCabala] = useState('');
  const [creating, setCreating] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [walletError, setWalletError] = useState('');

  const complete = async () => {
    if (!username) return;
    setCreating(true);
    setWalletError('');

    let address = '0x...';
    let phrase = '';

    try {
      const res = await fetch('/api/wallet/create', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        address = data.address ?? '0x...';
        phrase = data.seedPhrase ?? '';
      } else {
        throw new Error('Wallet creation failed');
      }
    } catch {
      // Graceful fallback — still let user proceed
      setWalletError('No se pudo crear la wallet. Podés continuar igual y crearla después.');
    }

    setWalletAddress(address);
    setSeedPhrase(phrase);
    saveIdentity({ userId: generateUserId(), username, address, cábala: selectedCabala });
    setCreating(false);
    setStep(3);
  };

  const copySeed = () => {
    if (!seedPhrase) return;
    navigator.clipboard.writeText(seedPhrase).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,195,255,0.1) 0%, transparent 60%),' +
          'radial-gradient(ellipse 60% 40% at 80% 110%, rgba(155,127,255,0.07) 0%, transparent 60%)',
      }}
    >
      {/* Floating orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,195,255,0.3) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 -right-20 w-48 h-48 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(155,127,255,0.4) 0%, transparent 70%)' }} />

      <div className="max-w-sm w-full relative z-10">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '28px' : '8px',
                  height: '8px',
                  background: i <= step ? 'var(--celeste)' : 'var(--text-muted)',
                  boxShadow: i === step ? '0 0 12px rgba(99,195,255,0.5)' : 'none',
                  borderRadius: '99px',
                }}
              />
              {i < STEPS.length - 1 && (
                <div style={{ width: '20px', height: '1px', background: i < step ? 'var(--celeste)' : 'var(--text-muted)', opacity: 0.5 }} />
              )}
            </div>
          ))}
        </div>

        {/* Hero image */}
        {step < 3 && (
          <div className="flex justify-center mb-6">
            <div
              className="w-24 h-24 rounded-3xl overflow-hidden animate-float"
              style={{ boxShadow: '0 0 0 1px rgba(255,209,102,0.2), 0 0 40px rgba(255,209,102,0.15), 0 20px 40px rgba(0,0,0,0.5)' }}
            >
              <img src="/IMG/onboarding-goat.png" alt="GOAT" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* ── STEP 0: Welcome ── */}
        {step === 0 && (
          <div className="stagger space-y-4 animate-scale-in">
            <div
              className="rounded-3xl p-6 space-y-5"
              style={{
                background: 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
                border: '1px solid var(--border-accent)',
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <div>
                <h1 className="font-display text-3xl text-white mb-2">Bienvenido a POZO</h1>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Apostá con tus amigos en los partidos de Argentina. Sin registro, sin vueltas.
                </p>
              </div>

              <ul className="space-y-2.5">
                {[
                  { icon: '🧉', text: 'Elegí tu cábala personal' },
                  { icon: '💳', text: 'Creamos tu wallet auto-custodia' },
                  { icon: '🏆', text: 'Armá un POZO con amigos' },
                  { icon: '🥩', text: 'Dividí el asado fácil' },
                ].map((item) => (
                  <li
                    key={item.text}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.text}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => setStep(1)} className="btn btn-gold w-full text-base">
                Arrancar 🚀
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 1: Identity ── */}
        {step === 1 && (
          <div className="stagger space-y-4 animate-scale-in">
            <div
              className="rounded-3xl p-6 space-y-4"
              style={{
                background: 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
                border: '1px solid var(--border-accent)',
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <div>
                <h2 className="font-display text-2xl text-white mb-1">Tu identidad</h2>
                <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
                    <rect x="2" y="7" width="12" height="8" rx="1.5" />
                    <path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round" />
                  </svg>
                  Todo queda en tu navegador. No guardamos nada.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
                  Nombre de usuario
                </label>
                <input
                  className="input"
                  placeholder="El Bicho, Cebolla, Tano..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && username && setStep(2)}
                />
              </div>

              <div className="flex gap-2.5">
                <button onClick={() => setStep(0)} className="btn btn-ghost flex-none px-4">
                  ←
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!username}
                  className="btn btn-primary flex-1"
                >
                  Elegir mi cábala →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Cábala ── */}
        {step === 2 && (
          <div className="space-y-4 animate-scale-in">
            <div className="text-center mb-2">
              <h2 className="font-display text-2xl text-white">Elegí tu cábala</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>La tradición argentina no se negocia</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CABALAS.map((c) => {
                const active = selectedCabala === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCabala(c.id)}
                    className="rounded-2xl p-3.5 text-left transition-all duration-200"
                    style={{
                      background: active
                        ? 'linear-gradient(145deg, rgba(255,209,102,0.12) 0%, var(--bg-card) 100%)'
                        : 'var(--bg-card)',
                      border: active ? '1px solid rgba(255,209,102,0.35)' : '1px solid var(--border-white)',
                      boxShadow: active ? '0 0 20px rgba(255,209,102,0.12)' : 'var(--shadow-card)',
                      transform: active ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <span className="text-xl block mb-1.5">{c.emoji}</span>
                    <p className="font-semibold text-sm text-white leading-tight">{c.label}</p>
                    <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-tertiary)' }}>{c.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setStep(1)} className="btn btn-ghost flex-none px-4">←</button>
              <button onClick={complete} disabled={creating} className="btn btn-gold flex-1">
                {creating
                  ? 'Creando wallet...'
                  : selectedCabala
                  ? 'Listo! Crear wallet 🔑'
                  : 'Saltar y crear wallet'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Wallet ── */}
        {step === 3 && (
          <div className="space-y-4 animate-scale-in">
            {/* Success header */}
            <div className="text-center space-y-2">
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,229,160,0.15) 0%, var(--bg-elevated) 100%)',
                  border: '1px solid rgba(0,229,160,0.3)',
                }}
              >
                {walletAddress && walletAddress !== '0x...' ? '✅' : '⚠️'}
              </div>
              <h2 className="font-display text-2xl text-white">
                {walletAddress && walletAddress !== '0x...' ? 'Wallet creada!' : 'Cuenta lista'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {walletAddress && walletAddress !== '0x...'
                  ? 'Tu wallet auto-custodia está lista en la testnet de Sepolia'
                  : 'Podés crear la wallet después desde la sección Wallet'}
              </p>
            </div>

            {walletError && (
              <div
                className="rounded-2xl p-3 text-xs text-center"
                style={{
                  background: 'rgba(255,181,71,0.1)',
                  border: '1px solid rgba(255,181,71,0.3)',
                  color: 'var(--warning)',
                }}
              >
                {walletError}
              </div>
            )}

            {walletAddress && walletAddress !== '0x...' && (
              <div
                className="rounded-2xl p-3 space-y-1"
                style={{ background: 'rgba(99,195,255,0.05)', border: '1px solid var(--celeste-border)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                  Tu dirección
                </p>
                <p className="font-mono-nums text-xs break-all" style={{ color: 'var(--celeste)' }}>
                  {walletAddress}
                </p>
              </div>
            )}

            {seedPhrase && (
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,77,106,0.07)',
                  border: '1px solid rgba(255,77,106,0.3)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <p className="font-semibold text-sm" style={{ color: 'var(--danger)' }}>
                    Guardá tu seed phrase
                  </p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Sin ella perdés acceso a tus fondos para siempre. No la compartas con nadie.
                </p>
                <div
                  className="rounded-xl p-3 font-mono-nums text-xs leading-relaxed"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {seedPhrase}
                </div>
                <button
                  onClick={copySeed}
                  className="btn btn-ghost w-full text-sm"
                  style={{ minHeight: '38px' }}
                >
                  {copied ? '✅ Copiado!' : '📋 Copiar seed phrase'}
                </button>
              </div>
            )}

            <button
              onClick={() => router.push('/pool')}
              className="btn btn-gold w-full text-base"
            >
              Entendido, ir a POZOs 🏆
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
