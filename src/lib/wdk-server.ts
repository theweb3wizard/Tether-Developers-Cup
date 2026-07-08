/**
 * wdk-server.ts
 * Thin server-only helpers that expose derived info about the master wallet
 * without importing the full WDK bundle unnecessarily.
 * Only import this from API routes / server components — never from client code.
 */

import type { IWalletAccount } from '@tetherto/wdk-wallet';

const WDK_MODULE = () => import('@tetherto/wdk');
const WALLET_EVM_MODULE = () => import('@tetherto/wdk-wallet-evm');

const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

async function buildAccount(seed: string): Promise<IWalletAccount> {
  const [{ default: WDK }, { default: WalletManagerEvm }] = await Promise.all([
    WDK_MODULE(),
    WALLET_EVM_MODULE(),
  ]);
  const wdk = new WDK(seed.trim()).registerWallet('ethereum', WalletManagerEvm, {
    provider: SEPOLIA_RPC,
  });
  return (await wdk.getAccount('ethereum', 0)) as unknown as IWalletAccount;
}

/**
 * Derives and returns the Ethereum address for the POOL_MASTER_SEED wallet.
 * Throws if the env var is missing or empty.
 */
export async function getMasterAddress(): Promise<string> {
  const seed = process.env.POOL_MASTER_SEED;
  if (!seed || seed.trim() === '') {
    throw new Error('POOL_MASTER_SEED env var is not set');
  }
  const account = await buildAccount(seed);
  return account.getAddress();
}
