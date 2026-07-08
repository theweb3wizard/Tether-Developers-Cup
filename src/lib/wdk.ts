import type { IWalletAccount } from '@tetherto/wdk-wallet';

const WDK_MODULE = () => import('@tetherto/wdk');
const WALLET_EVM_MODULE = () => import('@tetherto/wdk-wallet-evm');

// Sepolia testnet USDT contract address
const USDT_SEPOLIA = '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0';

// Sepolia RPC — public endpoint, no key needed
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

export type WalletData = {
  seedPhrase: string;
  address: string;
  balance: string;
};

// ─── Per-request WDK helpers ─────────────────────────────────────────────────
// Next.js API routes are stateless — module-level vars survive only within the
// same serverless worker lifetime (unpredictable).  We therefore:
//  1. Use POOL_MASTER_SEED env var for the "house" pool-distribution wallet.
//  2. Accept an explicit seed in every function that needs a user wallet.
//  3. Never rely on module-level mutable state for anything production-critical.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildWdkInstance(seed: string): Promise<any> {
  const [{ default: WDK }, { default: WalletManagerEvm }] = await Promise.all([
    WDK_MODULE(),
    WALLET_EVM_MODULE(),
  ]);
  return new WDK(seed).registerWallet('ethereum', WalletManagerEvm, {
    provider: SEPOLIA_RPC,
  });
}

async function getAccountFromSeed(seed: string): Promise<IWalletAccount> {
  const wdk = await buildWdkInstance(seed);
  return (await wdk.getAccount('ethereum', 0)) as unknown as IWalletAccount;
}

// ─── House wallet (pool distribution) ───────────────────────────────────────
/**
 * Returns the master pool-distribution account.
 * Requires POOL_MASTER_SEED to be set in the environment.
 * Throws a descriptive error if not configured — never silently uses a random seed.
 */
async function getMasterAccount(): Promise<IWalletAccount> {
  const masterSeed = process.env.POOL_MASTER_SEED;
  if (!masterSeed || masterSeed.trim() === '') {
    throw new Error(
      'POOL_MASTER_SEED env var is not set. ' +
      'Add it to .env.local and fund the derived address with Sepolia USDT.'
    );
  }
  return getAccountFromSeed(masterSeed.trim());
}

// ─── User-facing wallet operations ──────────────────────────────────────────

/** Create a fresh self-custodial wallet. Returns seed, address and ETH balance. */
export async function createWallet(): Promise<WalletData> {
  const { default: WDK } = await WDK_MODULE();
  const seedPhrase = WDK.getRandomSeedPhrase();
  const account = await getAccountFromSeed(seedPhrase);
  const address = await account.getAddress();
  const balance = await account.getBalance();

  return {
    seedPhrase,
    address,
    balance: balance.toString(),
  };
}

/**
 * Restore a wallet from an existing seed phrase and return its balances.
 * Used by the wallet page "restore" flow.
 */
export async function restoreWallet(seedPhrase: string): Promise<{
  address: string;
  balance: string;
  usdtBalance: string;
}> {
  const trimmed = seedPhrase.trim();
  if (!trimmed) throw new Error('Seed phrase vacía');
  const account = await getAccountFromSeed(trimmed);
  const address = await account.getAddress();
  const balance = await account.getBalance();

  let usdtBalance = '0';
  try {
    const tb = await account.getTokenBalance(USDT_SEPOLIA);
    usdtBalance = tb.toString();
  } catch {
    // Sepolia token balance may fail if node is slow — safe to ignore
  }

  return { address, balance: balance.toString(), usdtBalance };
}

/**
 * Get balances for the current master/house wallet.
 * Used by the server-side wallet balance endpoint.
 */
export async function getWalletInfo(): Promise<{
  address: string;
  balance: string;
  usdtBalance: string;
}> {
  const account = await getMasterAccount();
  const address = await account.getAddress();
  const balance = await account.getBalance();

  let usdtBalance = '0';
  try {
    const tb = await account.getTokenBalance(USDT_SEPOLIA);
    usdtBalance = tb.toString();
  } catch {}

  return { address, balance: balance.toString(), usdtBalance };
}

/**
 * Send USDT from the house wallet to a recipient.
 * `amount` is a decimal string, e.g. "5.00" meaning 5 USDT.
 * Converts to 6-decimal base units internally.
 */
export async function sendUsdt(
  to: string,
  amount: string
): Promise<{ hash: string; fee: string }> {
  if (!to || !to.startsWith('0x') || to.length < 20) throw new Error('Dirección inválida');
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) throw new Error('Monto inválido');

  const account = await getMasterAccount();
  const rawAmount = BigInt(Math.round(parsed * 1_000_000)); // 6 decimals
  const result = await account.transfer({
    token: USDT_SEPOLIA,
    recipient: to,
    amount: rawAmount,
  });
  return { hash: result.hash, fee: result.fee.toString() };
}

/**
 * Distribute pool payouts to all winners using the house wallet.
 *
 * - `payouts` entries with placeholder address '0x...' or amount <= 0 are skipped.
 * - Each transfer is attempted independently; failures are logged but don't abort others.
 * - Returns the array of successful transfer results.
 */
export async function distributePoolPayouts(
  payouts: { address: string; amount: number }[]
): Promise<{ address: string; hash: string; amount: number }[]> {
  const results: { address: string; hash: string; amount: number }[] = [];

  // Validate master seed upfront — fail fast with a clear message
  const masterSeed = process.env.POOL_MASTER_SEED;
  if (!masterSeed || masterSeed.trim() === '') {
    console.warn(
      '[WDK] POOL_MASTER_SEED not set — skipping on-chain distribution. ' +
      'Settlement will complete in DB only.'
    );
    return results;
  }

  for (const payout of payouts) {
    // Skip invalid entries
    if (
      !payout.address ||
      payout.address === '0x...' ||
      payout.address.length < 20 ||
      payout.amount <= 0
    ) {
      continue;
    }

    try {
      const account = await getMasterAccount();
      // USDT Sepolia: 6 decimal places
      const rawAmount = BigInt(Math.round(payout.amount * 1_000_000));
      const result = await account.transfer({
        token: USDT_SEPOLIA,
        recipient: payout.address,
        amount: rawAmount,
      });
      results.push({ address: payout.address, hash: result.hash, amount: payout.amount });
      console.info(`[WDK] Transferred ${payout.amount} USDT → ${payout.address} (${result.hash})`);
    } catch (err) {
      // Log the failure but continue with remaining payouts
      console.error(`[WDK] Transfer failed for ${payout.address}:`, err);
    }
  }

  return results;
}
