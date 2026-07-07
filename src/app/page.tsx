import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="text-8xl mb-4">🇦🇷</div>
          <h1 className="text-5xl font-bold text-blue">
            La Albiceleste<br />Fan Wallet
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            Pools auto-custodios para la Scaloneta. Crea un POZO, invita a tus amigos,
            y liquidá apuestas al instante con USDT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="card text-center space-y-2">
            <div className="text-3xl">👛</div>
            <h3 className="font-semibold text-blue">Wallet</h3>
            <p className="text-sm text-gray-500">Crea tu wallet auto-custodia al instante</p>
            <Link href="/wallet" className="btn-primary inline-block mt-2 text-sm">Abrir Wallet</Link>
          </div>
          <div className="card text-center space-y-2">
            <div className="text-3xl">💰</div>
            <h3 className="font-semibold text-blue">POZO</h3>
            <p className="text-sm text-gray-500">Pools de apuestas entre amigos</p>
            <Link href="/pool" className="btn-gold inline-block mt-2 text-sm">Crear POZO</Link>
          </div>
          <div className="card text-center space-y-2">
            <div className="text-3xl">🏆</div>
            <h3 className="font-semibold text-blue">Partido</h3>
            <p className="text-sm text-gray-500">Argentina vs Egypt — R16</p>
            <Link href="/pool" className="btn-primary inline-block mt-2 text-sm">Ver POZOs</Link>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-celeste/10 to-white border border-celeste/20 max-w-lg mx-auto">
          <h3 className="font-bold text-blue mb-2">⚡ Vamos Argentina — 7 de Julio</h3>
          <p className="text-sm text-gray-600">
            Messi vs Salah en Atlanta. Messi busca convertir en 5 partidos consecutivos.
            Creamos un POZO para este partido?
          </p>
          <Link href="/pool" className="btn-gold inline-block mt-3 text-sm">
            Crear POZO para Argentina vs Egypt
          </Link>
        </div>
      </div>
    </div>
  );
}
