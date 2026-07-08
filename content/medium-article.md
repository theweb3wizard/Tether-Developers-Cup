# I Built a PWA for the Tether Hackathon. Missed the Deadline. Shipped It Anyway.

**By Khalid | The Web3 Wizard**

---

On July 8, at 11:59 PM Pacific Time, submissions closed for the Tether Developers Cup — a hackathon for developers building on Tether's Wallet Development Kit. My project was sitting in a local Git repo, fully built, never submitted.

I saw the email 19 hours late.

So I did the only thing that made sense: I finished the polish, pushed to GitHub, deployed to Vercel, and wrote this article. The deadline is arbitrary. The work is real.

This is the architecture breakdown of POZO — a self-custodial, mobile-first PWA that turns Argentina World Cup watch parties into live USDT betting pools. Everything from the WDK integration to the Supabase schema to the PWA service worker. And the honest truth about what "shipped" means when you missed the cutoff.

---

## The Product

Argentine football fans gathering to watch the 2026 World Cup have a specific problem: they split asado costs across 7 different apps, make verbal bets that never get paid, and have no way to settle cross-border payments during a live match.

POZO collapses this into a single product:

1. Someone creates a **POZO** (pool) — picks a match, sets a stake amount and capacity, defines live events to bet on
2. Friends **join** by sharing a link, staking USDT into the pool
3. During the match, participants **vote** on events (Messi goal, Dibu penalty save, etc.)
4. When enough people agree an event happened, it's confirmed
5. At the end, the pool **settles** — winners receive USDT directly from the house wallet on Sepolia testnet

There's also an **Asado Fund** for splitting pre-match expenses, and a **Live Match Widget** that polls the ESPN API every 30 seconds for real-time Argentina scores.

## The Architecture

```
Client (PWA) → Next.js API Routes → WDK (server-only) + Supabase
LiveMatchWidget ← ESPN Public API (30s poll)
Supabase: pools (JSONB participants/events), users, asado_bills
```

### WDK Integration

Tether's Wallet Development Kit is used across three surfaces:

1. **User wallet creation** — `WDK.getRandomSeedPhrase()` generates a BIP39 seed phrase during onboarding. A `WalletManagerEvm` instance derives the self-custodial EVM address. Users own their keys. No custodial backend.

2. **Wallet restoration** — The `/wallet` page accepts any existing seed phrase and restores the corresponding address and balances through the same derivation path.

3. **Pool settlement** — A server-side "house" wallet (configured via `POOL_MASTER_SEED`) calls `account.transfer()` for each winner when a pool resolves. Transaction hashes are stored in Supabase and displayed as Sepolia Etherscan links.

The WDK packages (`@tetherto/wdk`, `@tetherto/wdk-wallet-evm`) are configured as `serverExternalPackages` in `next.config.ts` — they never touch the client bundle. The `wdk.ts` module handles full wallet operations; `wdk-server.ts` is a lightweight helper that only derives the master address, avoiding the full WDK import in server-only contexts.

### Pool Lifecycle as a State Machine

The pool moves through exactly 5 states:

```
create → join → lock → start → vote → resolve → settle
```

**open**: Anyone can join until capacity is reached. Host sets stake amount, match, and event tags.

**locked**: Host locks the pool before kickoff. No new participants.

**active**: Events become interactive. Participants vote on whether an event happened. When votes reach a majority (floor(n/2)+1), the event auto-confirms.

**settled**: All events resolved. The host clicks "Liquidar POZO." The server computes each winner's share (90% of pool, distributed proportionally to events won, 10% house cut). WDK transfers USDT from the house wallet to each winner. TX hashes stored in Supabase.

### The Database

Three tables in Supabase PostgreSQL, all with JSONB for hackathon-speed iteration:

- **`pools`** — status, match_name, stake_amount, total_pool, capacity, participants (JSONB), events (JSONB), tx_hashes (TEXT[])
- **`users`** — username, wallet_address, cábala (Argentine superstition)
- **`asado_bills`** — name, participants (TEXT[]), expenses (JSONB)

Row-Level Security is enabled but fully permissive — documented as a known gap. A production version would lock this down with wallet-signature-based auth.

### The PWA

- Service worker with 3-tier caching: network-only for API routes, cache-first for static assets, network-first for pages with offline fallback to the cached homepage
- Standalone manifest (`display: standalone`, portrait orientation, dark theme `#070C18`)
- Pre-caches 17 static assets on install
- Apple touch icon (SVG, needs PNG for full iOS support — documented)

### The Design System

789 lines of custom CSS with design tokens for the Argentina-themed palette (celeste, gold, violet), glassmorphism card treatments, skeleton loaders, toast animations, and responsive breakpoints. Tailwind v4 utility classes for layout, custom component classes for recurring patterns.

## What's Working. What's Not.

**Working:**
- Full pool lifecycle — create, join, lock, vote, resolve
- WDK self-custodial wallet creation and restoration
- Supabase persistence with real-time subscriptions
- ESPN live match widget with 30s polling
- Asado Fund expense splitting
- PWA with offline support
- 4-step onboarding with cábala selection (culturally specific, memorable)
- Bottom navigation with 5 tabs
- Demo data seeding endpoint

**Not working (unfunded):**
- On-chain USDT settlement — the WDK code compiles, the architecture is wired, but the house wallet needs Sepolia ETH for gas and Sepolia USDT for payouts. I haven't funded it. The UI shows the flow, but no real transactions happen.
- iOS PWA icon — SVG icons work on Android but iOS needs PNG. Documented, not fixed.
- Server-side auth — user identity is localStorage-based and self-asserted. Fine for a hackathon, not for production.

**The honest assessment:** This is a hackathon project that I built in about 48 hours, mostly using AI-augmented development. The architecture decisions are sound. The code compiles. The UI is polished. The WDK integration is clean. But it's not a production product — it's a prototype that proves the concept and shows I know how to build this kind of thing.

## Why Open Source It

The repo is MIT licensed. I open-sourced it because:

1. Portfolio projects should be verifiable. Anyone can read the code, check the architecture, and decide for themselves.
2. The WDK is new — having real reference implementations helps the developer ecosystem.
3. The async pool lifecycle pattern (state machine → JSONB persistence → real-time subscriptions → on-chain settlement) generalizes beyond watch parties.

## The Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router (Turbopack) |
| Database | Supabase PostgreSQL |
| Wallet SDK | Tether WDK (`@tetherto/wdk`, `wdk-wallet-evm`) |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Live Scores | ESPN public API (no key required) |
| Hosting | Vercel |

## What I'd Do Differently

1. **Start with the known gaps documented.** I added the "Known Gaps" section to the README after the fact. If I'd started with it, I would have made cleaner decisions about what to scope out rather than building things halfway.

2. **Fund the wallet before deploying.** The difference between "the settlement code compiles" and "the settlement works end-to-end" is $2 of testnet USDC and one environment variable. I should have done it before deploying.

3. **Write the Asado → USDT bridge.** The Asado Fund calculates who owes what but doesn't trigger on-chain payments. It's a 20-line integration gap that makes the feature feel incomplete.

## The Point

I missed the deadline. That's on me. But the project is real — the code is on GitHub, the app is on Vercel, the architecture is documented. A deadline is a container, not a verdict.

If you're building a portfolio, ship it anyway. The people who will hire you care about what you built, not when you submitted it.

---

## Want Something Built?

I build full-stack Web3 and AI products using this exact workflow. You describe the product. I handle the architecture, implementation, and deployment.

- **Full-stack Web3:** dApps, wallet integration, token systems, treasury management
- **AI integration:** LLM pipelines, structured output, evaluation systems
- **PWA and mobile-first:** Offline-capable, installable, responsive
- **Rapid prototyping:** From concept to deployed in 1–3 weeks

**DM me on LinkedIn if you have a project that needs building.**

---

*Built with AI-augmented development. Architected by a human.*

*POZO on GitHub: [github.com/theweb3wizard/Tether-Developers-Cup](https://github.com/theweb3wizard/Tether-Developers-Cup)*
*Live demo: [tether-developers-cup.vercel.app](https://tether-developers-cup.vercel.app/)*
