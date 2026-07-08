import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMasterAddress } from '@/lib/wdk-server';

// POST /api/seed — creates realistic demo pools for the 2026 World Cup QF
// Gated to development mode or SEED_ENABLED=true in env
export async function POST() {
  const isDev = process.env.NODE_ENV === 'development';
  const seedEnabled = process.env.SEED_ENABLED === 'true';

  if (!isDev && !seedEnabled) {
    return NextResponse.json(
      { error: 'Seed only available in development or with SEED_ENABLED=true' },
      { status: 403 }
    );
  }

  // Attempt to get the master wallet address so at least one demo participant
  // has a real address — enabling an actual on-chain transfer demo.
  let masterAddress = '0x...';
  try {
    masterAddress = await getMasterAddress();
  } catch {
    // POOL_MASTER_SEED not set — demo pools will use placeholder addresses
  }

  try {
    const now = new Date().toISOString();

    const pools = [
      // ── Pool 1: Open QF pool (ready to join) ──────────────────────────────
      {
        id: `demo-${crypto.randomUUID().slice(0, 6)}`,
        name: 'Pozo del Cuarto 🏆',
        match_name: 'Argentina vs Switzerland — Cuartos de Final',
        stake_amount: 5,
        total_pool: 10,
        capacity: 6,
        status: 'open',
        host_id: 'demo-host-1',
        participants: [
          // First participant uses the master address so settlement can send real USDT
          {
            id: 'demo-host-1',
            username: 'Cebolla',
            address: masterAddress,
            staked: 5,
            cabala: 'mate',
          },
          {
            id: 'demo-user-2',
            username: 'El Tano',
            address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
            staked: 5,
            cabala: 'camiseta',
          },
        ],
        events: [
          { id: 'ev-q1', label: 'Messi gol', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
          { id: 'ev-q2', label: 'Gol de Lautaro', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
          { id: 'ev-q3', label: 'Dibu ataja penal', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
          { id: 'ev-q4', label: 'Tarjeta amarilla', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
          { id: 'ev-q5', label: 'Cambio de Messi', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
        ],
        created_at: now,
      },

      // ── Pool 2: Active pool — in progress, mid-vote ────────────────────────
      {
        id: `demo-${crypto.randomUUID().slice(0, 6)}`,
        name: 'Previa de los Pibes ⚡',
        match_name: 'Argentina vs Switzerland — Cuartos de Final',
        stake_amount: 10,
        total_pool: 30,
        capacity: 4,
        status: 'active',
        host_id: 'demo-host-2',
        participants: [
          {
            id: 'demo-host-2',
            username: 'Gonza',
            address: masterAddress,
            staked: 10,
            cabala: 'billete',
          },
          {
            id: 'demo-user-3',
            username: 'Maxi',
            address: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
            staked: 10,
            cabala: 'medialuna',
          },
          {
            id: 'demo-user-4',
            username: 'La Bicha',
            address: '0x742d35Cc6634C0532925a3b8D9C5c8b7b6e5f6e5',
            staked: 10,
            cabala: 'puesto',
          },
        ],
        events: [
          {
            id: 'ev-a1',
            label: 'Messi gol',
            voted: ['demo-host-2'],
            confirmed: false,
            resolved: false,
            bidAmount: 3,
          },
          {
            id: 'ev-a2',
            label: 'VAR review',
            voted: ['demo-host-2', 'demo-user-3', 'demo-user-4'],
            confirmed: true,
            resolved: true,
            winner: 'demo-host-2',
            bidAmount: 8,
          },
          {
            id: 'ev-a3',
            label: 'Córner para Argentina',
            voted: [],
            confirmed: false,
            resolved: false,
            bidAmount: 0,
          },
          {
            id: 'ev-a4',
            label: 'Dibu ataja penal',
            voted: ['demo-user-3'],
            confirmed: false,
            resolved: false,
            bidAmount: 5,
          },
        ],
        created_at: now,
      },

      // ── Pool 3: Final pool — looking ahead ────────────────────────────────
      {
        id: `demo-${crypto.randomUUID().slice(0, 6)}`,
        name: 'El Asado de la Final 🥩',
        match_name: 'Argentina vs TBD — Final · 19 Jul',
        stake_amount: 20,
        total_pool: 60,
        capacity: 8,
        status: 'open',
        host_id: 'demo-host-5',
        participants: [
          {
            id: 'demo-host-5',
            username: 'Fede',
            address: masterAddress,
            staked: 20,
            cabala: 'silbido',
          },
          {
            id: 'demo-user-6',
            username: 'Romi',
            address: '0x742d35Cc6634C0532925a3b8D9C5c8b7b6e5f6e5',
            staked: 20,
            cabala: 'beso',
          },
          {
            id: 'demo-user-7',
            username: 'Cacho',
            address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
            staked: 20,
            cabala: 'grito',
          },
        ],
        events: [
          { id: 'ev-f1', label: 'Messi gol', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
          { id: 'ev-f2', label: 'Gol de Lautaro', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
          { id: 'ev-f3', label: 'Dibu ataja penal', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
          { id: 'ev-f4', label: 'Penal para Argentina', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
          { id: 'ev-f5', label: 'Primer gol del mundo', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
          { id: 'ev-f6', label: 'Tarjeta roja', voted: [], confirmed: false, resolved: false, bidAmount: 0 },
        ],
        created_at: now,
      },
    ];

    const { error } = await supabase.from('pools').insert(pools);
    if (error) throw new Error(error.message);

    return NextResponse.json(
      {
        message: `${pools.length} POZOs de demo creados`,
        ids: pools.map((p) => p.id),
        masterAddress,
        note: masterAddress === '0x...'
          ? 'POOL_MASTER_SEED not set — demo addresses are placeholders. Set the env var to enable real transfers.'
          : 'Master wallet address used for demo host participants — settlement will send real USDT.',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
