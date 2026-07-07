import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-120px)]">
      <div className="w-full argentina-gradient overflow-hidden relative">
        <div className="max-w-2xl mx-auto px-4 py-16 md:py-24 text-center relative z-10">
          <img
            src="/IMG/hero-icon.png"
            alt="POZO App Icon"
            className="w-28 h-28 md:w-36 md:h-36 mx-auto mb-8 drop-shadow-2xl animate-float"
          />
          <h1 className="text-5xl md:text-7xl font-black text-blue leading-tight mb-4">
            POZO
          </h1>
          <p className="text-lg md:text-xl text-blue/70 max-w-md mx-auto font-medium">
            Pools auto-custodios para la Scaloneta. Creá tu POZO, invitá amigos, liquidá apuestas al instante con USDT.
          </p>
          <Link href="/onboarding" className="btn-gold inline-block mt-6 text-lg px-8 py-3">
            Empezar
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <div className="max-w-2xl w-full px-4 -mt-6 space-y-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/wallet" className="card text-center space-y-3 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-celeste/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-celeste-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-blue">Wallet</h3>
            <p className="text-sm text-gray-500 leading-snug">Crea tu wallet auto-custodia al instante</p>
            <span className="btn-primary inline-block mt-1 text-sm">Abrir Wallet</span>
          </Link>

          <Link href="/pool" className="card text-center space-y-3 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-gold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-blue">POZO</h3>
            <p className="text-sm text-gray-500 leading-snug">Pools de apuestas entre amigos</p>
            <span className="btn-gold inline-block mt-1 text-sm">Crear POZO</span>
          </Link>

          <Link href="/asado" className="card text-center space-y-3 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-blue">Asado Fund</h3>
            <p className="text-sm text-gray-500 leading-snug">Dividí los gastos de la previa</p>
            <span className="btn-primary inline-block mt-1 text-sm">Abrir Asado</span>
          </Link>
        </div>

        <div className="card bg-gradient-to-br from-celeste/10 via-white to-gold/10 border border-celeste/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-celeste/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm bg-blue text-white px-3 py-1 rounded-full font-semibold">EN VIVO</span>
              <span className="text-sm text-gray-500">7 de Julio</span>
            </div>
            <h3 className="font-bold text-xl text-blue mb-2">Argentina vs Egypt — R16</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Messi vs Salah en Atlanta. La Pulga busca convertir en 5 partidos consecutivos con la Selección.
              Juntamos la bandera, armamos el asado y creamos un POZO para este partidazo?
            </p>
            <Link href="/onboarding" className="btn-gold inline-block text-sm">
              Armar la previa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
