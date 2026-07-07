# 🇦🇷 POZO — Self-Custodial Watch Party Pools

**Tether Developers Cup 2026 — WDK + Pears Track**

POZO lets Argentina fans create self-custodial USDT pools for World Cup watch parties. Create a pool, invite friends, predict in-game events (goals, cards, saves), and settle instantly — no intermediaries, no gas fees, full self-custody.

---

## Features

### ✅ Phase 0 — MVP (Live)
- **Self-custodial wallet** — Create/import wallets via Tether WDK (EVM, Sepolia testnet)
- **POZO creation** — Multi-party pools with configurable stake, capacity, and trigger events
- **PWA support** — Installable, works offline

### ✅ Phase 1 — Core (Complete)
- **Send/receive USDT** — Transfer tokens via WDK from your self-custodial wallet
- **Multi-party fund locking** — All participants deposit, funds locked until match events
- **Trigger event system** — Goals, cards, saves as configurable pool triggers
- **Group consensus voting** — Majority-tap verification (no oracle needed)
- **USDt distribution engine** — Winners auto-receive on consensus
- **El Asado Fund** — Watch party expense splitter (asado, fernet, streaming)
- **@username identities** — Human-readable names, no hex addresses

### 🔜 Phase 2 — Polish
- Illustrated cábala onboarding
- Dibu save alerts + micro-bids
- Pool history & stats
- Pears P2P (Hyperswarm) for decentralized room discovery

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, Tailwind CSS, TypeScript |
| PWA | `next-pwa`, Service Worker, Manifest |
| Wallets | `@tetherto/wdk`, `@tetherto/wdk-wallet-evm` |
| P2P | `hyperswarm` (Phase 2) |
| Styling | Argentina flag palette (#75AADB, #FCBF49, #003DA5) |
| Language | Español (Argentine dialect) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install
```

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

## Architecture

```
PWA (Next.js)
  ↕ REST API
Node.js Backend
  ├── @tetherto/wdk          → Wallet ops, USDt transfers
  ├── lib/pools.ts            → Pool logic, fund locking, consensus
  └── lib/asado.ts            → Expense splitting
```

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/wallet/create` | POST | Generate seed phrase + EVM wallet |
| `/api/wallet/balance` | GET | Get address, ETH & USDT balance |
| `/api/wallet/send` | POST | Send USDT via WDK |
| `/api/pools` | GET | List all POZOs |
| `/api/pools/create` | POST | Create new POZO |
| `/api/pools/[id]` | GET | Get POZO details |
| `/api/pools/[id]` | PATCH | Join, lock, or start POZO |
| `/api/pools/[id]/trigger` | POST | Vote or resolve event |
| `/api/pools/[id]/distribute` | POST | Settle POZO, distribute funds |
| `/api/asado` | GET/POST | Create & manage expense splits |

---

## POZO Flow

1. **Create** — Host sets name, stake (USDT), capacity, trigger events
2. **Invite** — Share POZO link/QR with friends
3. **Join** — Friends deposit stake from their wallets
4. **Lock** — Host locks pool at match start
5. **Watch** — Events fire (goal, card, save)
6. **Vote** — Group confirms events via majority tap
7. **Resolve** — Host declares winner per event
8. **Settle** — WDK distributes USDT to winners automatically

---

## Demo Video

[YouTube link — coming soon]

---

## Submission

- **Track**: WDK + Pears
- **Team**: Solo
- **Country**: Argentina 🇦🇷
- **License**: MIT

---

## Built With

- [Tether WDK](https://docs.wallet.tether.io) — Wallet Development Kit
- [Next.js](https://nextjs.org) — React framework
- [Tailwind CSS](https://tailwindcss.com) — Styling
