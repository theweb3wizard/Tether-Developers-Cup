# 🇦🇷 POZO — Albiceleste Fan Wallet

> Self-custodial watch party pools for La Albiceleste — powered by **Tether WDK**

**Tether Developers Cup · 2026 FIFA World Cup Hackathon**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-00D084)](https://tether-developers-cup.vercel.app/)

> ⚠️ **Live but incomplete:** The app is deployed and fully browsable at [tether-developers-cup.vercel.app](https://tether-developers-cup.vercel.app/). The on-chain settlement flow (USDT payouts) requires a funded Sepolia wallet I haven't set up — the architecture is wired, the code compiles, but live transactions won't execute. See [Known Gaps](#known-gaps-hackathon-scope).

---

## What is POZO?

POZO is a mobile-first PWA that turns every Argentina World Cup watch party into a live, self-custodial USDT betting experience. Friends create a **POZO** (pool), stake USDT, vote on in-match events in real time, and winners receive instant on-chain payouts — no custodian, no bank, no gas tokens required.

### The Problem It Solves

Argentine fans split asado costs over 7 different apps, make verbal bets that never get paid, and have no way to settle cross-border payments during a live match. POZO collapses expense splitting, P2P micro-wagering, and instant USDT settlement into a single WDK-powered product.

---

## Core Features

| Feature | Description |
|---|---|
| **POZO Pools** | Create multi-party event-triggered pools. Set stake, capacity and events. Share a link. |
| **Live Match Widget** | Real-time Argentina scores via ESPN public API, refreshed every 30s. |
| **Self-Custodial Wallets** | WDK-generated wallets with seed phrase backup. Users own their keys. |
| **Real USDT Settlement** | On pool resolution, the house wallet distributes USDT to winners on-chain (Sepolia testnet). Etherscan links shown in UI. |
| **Asado Fund** | Pre-match expense splitter — pay asado, beer and streaming costs in USDT before kickoff. |
| **Join via Link** | Share a pool URL. New users join inline without leaving the page. |
| **PWA** | Installable on iOS/Android, offline-capable via service worker. |
| **Cábalas** | Argentine match-day superstition system woven into onboarding and player identity. |

---

## WDK Integration

This project uses Tether's Wallet Development Kit across three distinct surfaces:

1. **User wallet creation** — `WDK.getRandomSeedPhrase()` + `WalletManagerEvm` to derive a self-custodial EVM address during onboarding. Users own their keys.

2. **Wallet restoration** — Users can restore any existing wallet from seed phrase via the `/wallet` page's restore flow.

3. **Pool settlement / USDT distribution** — A server-side "house" wallet (configured via `POOL_MASTER_SEED`) calls `account.transfer()` for each winner when a pool is settled. Transaction hashes are stored in Supabase and displayed as Sepolia Etherscan links in the settled pool card.

**Packages used:**
- `@tetherto/wdk` — core SDK, seed generation
- `@tetherto/wdk-wallet` — `IWalletAccount` interface
- `@tetherto/wdk-wallet-evm` — Ethereum/Sepolia wallet manager

---

## Architecture

```
Next.js 16 App Router (PWA)
├── /src/app/             Pages (home, pool, wallet, asado, history, onboarding)
├── /src/app/api/         API routes (pools, wallet, matches, seed)
├── /src/components/      UI components (PoolDetail, LiveMatchWidget, Toast, BottomNav)
├── /src/lib/
│   ├── wdk.ts            WDK wallet operations (create, restore, distribute payouts)
│   ├── wdk-server.ts     Server-only helper (master wallet address)
│   ├── pools.ts          Pool CRUD + voting/settlement logic (Supabase)
│   ├── fixtures.ts       Argentina fixture list + live score types
│   ├── identity.ts       LocalStorage-based user identity
│   └── supabase.ts       Supabase client
└── Supabase              PostgreSQL: pools table (JSONB for participants/events)
```

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Run Supabase migration
# Open https://supabase.com/dashboard → SQL Editor → paste supabase-migration.sql

# 4. Configure the pool distribution wallet
# a) Start dev server: npm run dev
# b) Go to /wallet → Create Wallet → copy the seed phrase
# c) Add it to .env.local as POOL_MASTER_SEED="word1 word2 ..."
# d) Copy the derived address
# e) Fund it with Sepolia USDT:
#    - ETH:  https://faucets.chain.link/sepolia
#    - USDT: https://faucet.circle.com (select Ethereum Sepolia)

# 5. Seed demo data (optional)
# POST http://localhost:3000/api/seed

# 6. Run dev server
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `POOL_MASTER_SEED` | ✅ for live transfers | 12-word seed phrase for the house distribution wallet |
| `SEED_ENABLED` | Optional | Set `true` to allow `POST /api/seed` in production |

---

## Tournament Context

Built during the **2026 FIFA World Cup** knockout rounds:
- 🇦🇷 Argentina 3–2 Egypt (R16, Jul 7 — Messi's 8th goal of the tournament)
- 🇦🇷 Argentina vs 🇨🇭 Switzerland — QF, **Jul 11, Kansas City**
- 🇦🇷 Semifinal — Jul 14, Arlington TX
- 🇦🇷 **Final — Jul 19, MetLife Stadium NJ**

---

## Tech Stack

- **Next.js 16** with Turbopack
- **Tether WDK** (`@tetherto/wdk`, `wdk-wallet-evm`)
- **Supabase** (PostgreSQL + Realtime)
- **Tailwind CSS v4**
- **lucide-react** icons
- ESPN public scoreboard API (no key required)

---

## Known Gaps (Hackathon Scope)

POZO was built for the Tether Developers Cup in ~48 hours. These areas are intentionally scoped out and documented here so the architecture is clear:

- **No server-side auth** — User identity is localStorage-based and self-asserted. A production version would add wallet-signature-based authentication via WDK or Supabase Auth.
- **Open RLS policies** — Supabase Row-Level Security allows public access. Production would lock this down with per-wallet policies.
- **Centralized house wallet** — Payouts flow from a single master wallet rather than peer-to-peer. Production would use direct transfers or a smart contract escrow.
- **No test suite** — Integration tests were deferred to the next round of the competition.
- **iOS PWA icon** — The app uses SVG icons; iOS requires PNG for `apple-touch-icon`. A PNG conversion is needed for full iOS PWA support.

These are all known, deliberate trade-offs for the hackathon timeline, not architectural oversights.

## License

[MIT](LICENSE) — see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for third-party disclosures.

---

*Built with mate amargo and De Paul's caramelos. Vamos Argentina. 🏆*
