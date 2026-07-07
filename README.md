# POZO — Self-Custodial Watch Party Pools

**Tether Developers Cup 2026 — WDK Track**

POZO lets Argentina fans create **self-custodial USDT pools** for World Cup watch parties. Create a pool, invite friends, predict in-game events (goals, cards, saves), and settle instantly — no intermediaries, no gas fees, full self-custody.

---

## Features

### Phase 0 — MVP
- Self-custodial wallet via Tether WDK (EVM, Sepolia testnet)
- POZO creation with configurable stake, capacity, and trigger events
- PWA manifest (installable, theme-color, icons)

### Phase 1 — Core
- Send/receive USDT via WDK
- Multi-party POZO fund locking
- Trigger event system (goals, cards, saves as configurable pool events)
- Group consensus voting — majority-tap verification (no oracle)
- USDt distribution engine — winners determined on consensus
- El Asado Fund — watch party expense splitter
- @username identities — human-readable names, no hex addresses
- Supabase persistence (Postgres, JSONB columns, RLS)

### Phase 2 — Polish
- Illustrated cábala onboarding flow (`/onboarding`)
- Identity persistence via localStorage
- Toast notification system
- Skeleton loaders on all data pages
- Supabase Realtime subscriptions for live voting
- Pool history & stats with ranking (`/history`)
- Micro-bid system on event voting
- Share POZO link (clipboard copy)
- Browser notifications for event updates
- Direct pool detail page (`/pool/[id]`)
- PWA service worker (offline cache + install prompt)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, Tailwind CSS v4, TypeScript |
| Database | Supabase (Postgres, JSONB, RLS) |
| Wallets | `@tetherto/wdk`, `@tetherto/wdk-wallet-evm` |
| PWA | Service worker, Web Manifest |
| Styling | Argentina flag palette (#75AADB, #FCBF49, #003DA5) |
| Language | Español (Argentine dialect) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase project with the schema from `supabase-migration.sql`

### Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key from your Supabase dashboard (Settings → API).

### Install

```bash
npm install
```

> **Windows note:** npm install can be flaky (ECONNRESET, EPERM). If it fails:
> ```powershell
> npm config set registry https://registry.npmmirror.com
> npm install
> npm config set registry https://registry.npmjs.org
> ```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

---

## Database

The app uses Supabase. Run `supabase-migration.sql` in your Supabase SQL Editor to create:

- **users** — username, wallet_address, cábala, timestamps
- **pools** — JSONB `participants` and `events` columns, status enum
- **asado_bills** — TEXT[] participants, JSONB expenses

**After migration**, enable Realtime on the `pools` table: Supabase Dashboard → Database → Replication → toggle `pools`.

---

## Architecture

```
PWA (Next.js 16)
  ↕ REST API
Node.js Backend
  └── lib/
       ├── wdk.ts          → Wallet ops, USDt transfers
       ├── pools.ts        → Pool logic, fund locking, consensus
       ├── asado.ts        → Expense splitting
       ├── supabase.ts     → DB client
       ├── identity.ts     → localStorage identity
       └── notifications.ts → Browser Notification API
```

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/wallet/create` | POST | Generate seed phrase + EVM wallet |
| `/api/wallet/balance` | GET | Get address, ETH & USDT balance |
| `/api/wallet/send` | POST | Send USDT via WDK |
| `/api/pools` | GET | List all POZOs (`?status=settled` to filter) |
| `/api/pools/create` | POST | Create new POZO |
| `/api/pools/[id]` | GET | Get POZO details |
| `/api/pools/[id]` | PATCH | Join, lock, or start POZO |
| `/api/pools/[id]/trigger` | POST | Vote or resolve event |
| `/api/pools/[id]/distribute` | POST | Settle POZO, distribute funds |
| `/api/asado` | GET/POST | Create & manage expense splits |

### Pages

| Route | Page |
|---|---|
| `/` | Landing with hero, 3-card nav, match callout |
| `/onboarding` | 3-step: welcome → identity → cábala picker |
| `/wallet` | Create/load wallet, dashboard, send USDT |
| `/pool` | Pool list, create, detail with voting flow |
| `/pool/[id]` | Direct pool detail (shared links) |
| `/history` | Settled pools + ranking |
| `/asado` | Expense splitter |

---

## POZO Flow

1. **Create** — Host sets name, stake (USDT), capacity, trigger events
2. **Invite** — Share POZO link with friends
3. **Join** — Friends deposit stake from their wallets
4. **Lock** — Host locks pool at match start
5. **Watch** — Events fire (goal, card, save)
6. **Vote** — Group confirms events via majority tap
7. **Resolve** — Host declares winner per event
8. **Settle** — Funds distributed to winners

---

## Demo Video

[YouTube link — coming soon]

---

## Submission

- **Track**: WDK
- **Team**: Solo
- **Country**: Argentina
- **License**: MIT

---

## Built With

- [Tether WDK](https://docs.wallet.tether.io) — Wallet Development Kit
- [Next.js](https://nextjs.org) — React framework
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Supabase](https://supabase.com) — Database & Realtime
