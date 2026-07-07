'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveIdentity, generateUserId } from '@/lib/identity';

const CABALAS = [
  { id: 'mate', label: '🇦🇷 Mate amargo', desc: 'Tomar mate amargo antes del partido' },
  { id: 'camiseta', label: '👕 Misma camiseta', desc: 'Usar la misma camiseta sin lavar' },
  { id: 'puesto', label: '🪑 Mismo asiento', desc: 'Sentarse en el mismo lugar siempre' },
  { id: 'grito', label: '📢 Grito de gol', desc: 'Gritar el gol de una forma especial' },
  { id: 'billete', label: '💵 Billete doblado', desc: 'Llevar un billete doblado en la media' },
  { id: 'medialuna', label: '🌙 Medialuna', desc: 'Comer una medialuna antes del partido' },
  { id: 'silbido', label: '🎵 Silbar el himno', desc: 'Silbar la parte del himno que no se canta' },
  { id: 'beso', label: '😘 Beso a la foto', desc: 'Besar la foto de Maradona antes de salir' },
  { id: 'escarpines', label: '🧦 Escarpín izquierdo', desc: 'Ponerse primero el escarpín izquierdo' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCabala, setSelectedCabala] = useState('');

  const complete = () => {
    if (!username) return;
    saveIdentity({
      userId: generateUserId(),
      username,
      address: address || '0x...',
      cábala: selectedCabala,
    });
    router.push('/pool');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-celeste/10 via-white to-white">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="relative w-32 h-32 mx-auto float-animation">
            <img src="/IMG/onboarding-goat.png" alt="GOAT" className="w-full h-full object-contain" />
          </div>
          {step === 0 && (
            <>
              <h1 className="text-3xl font-black text-blue">Bienvenido a POZO</h1>
              <p className="text-gray-500 text-sm">
                Apostá con tus amigos en los partidos de Argentina. Sin registro, sin vueltas.
              </p>
              <button onClick={() => setStep(1)} className="btn-gold w-full mt-4">
                Arrancar
              </button>
            </>
          )}
        </div>

        {step === 1 && (
          <div className="card space-y-4">
            <h2 className="font-bold text-lg text-blue">Tu identidad</h2>
            <p className="text-xs text-gray-400">Todo queda en tu navegador. No guardamos nada.</p>
            <input className="input-field" placeholder="Tu nombre de usuario"
              value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="input-field" placeholder="Dirección wallet (0x...) — opcional"
              value={address} onChange={(e) => setAddress(e.target.value)} />
            <button onClick={() => setStep(2)}
              disabled={!username}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              Elegir mi cábala
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-blue text-center">Elegí tu cábala</h2>
            <p className="text-xs text-gray-500 text-center">La tradición argentina no se negocia</p>
            <div className="grid grid-cols-2 gap-2">
              {CABALAS.map((c) => (
                <button key={c.id} onClick={() => setSelectedCabala(c.id)}
                  className={`text-left p-3 rounded-xl border-2 text-sm transition-all ${
                    selectedCabala === c.id
                      ? 'border-gold bg-gold/10'
                      : 'border-gray-200 bg-white hover:border-celeste/30'
                  }`}>
                  <p className="font-semibold">{c.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
                </button>
              ))}
            </div>
            <button onClick={complete} className="btn-gold w-full">
              {selectedCabala ? `Listo! Ir a los POZOs` : 'Saltar este paso'}
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Al continuar aceptás compartir tu identidad con los POZOs que te unás.
        </p>
      </div>
    </div>
  );
}
