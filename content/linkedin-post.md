I built a PWA for a hackathon. Missed the submission deadline by 8 hours. Shipped it anyway.

The app is POZO — a self-custodial watch party betting platform for Argentina fans during the 2026 World Cup. Friends create a pool, stake USDT, vote on live match events, and winners get paid out on-chain. No custodian, no bank, no gas tokens required.

Built with Tether's Wallet Development Kit, Next.js 16, Supabase, and Tailwind v4. In about 48 hours.

Three things I learned:

1. Architecture decisions compound faster than code decisions. I spent 2 hours on the data flow (pool lifecycle: create → join → lock → vote → settle) before writing a single line. That state machine handled every edge case without a rewrite.

2. WDK integration is the simplest part of a Web3 app. The SDK gives you seed generation, EVM wallet management, and token transfers in three imports. The hard part is the failure cascade around it — what happens when the RPC is down, the treasury is empty, or the user opens the app on a phone with no wallet.

3. "Shipping" is a decision, not a deadline. I missed the cutoff. The code still compiles, the app still deploys, the architecture still holds. I put it on Vercel anyway. If you're building for a portfolio or for clients, the deadline doesn't matter — what matters is having something real to point to.

The repo is MIT licensed. The app is live. The settlement wallet isn't funded (no gas fees), so the on-chain flow is wired but untested in production. That's the honest state.

I build full-stack Web3 and AI products using this workflow. You describe what you need. I ship it.

DM me if you have a project that needs building.

---

#Web3 #PWA #Hackathon #Tether #WorldCup #BuildInPublic #FullStack
