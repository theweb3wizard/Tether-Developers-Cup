import type { IWalletAccount } from '@tetherto/wdk-wallet';

const WDK_MODULE = () => import('@tetherto/wdk');
const WALLET_EVM_MODULE = () => import('@tetherto/wdk-wallet-evm');

export type WalletData = {
  seedPhrase: string;
  address: string;
  balance: string;
};

export async function createWallet(): Promise<WalletData> {
  const [{ default: WDK }, { default: WalletManagerEvm }] = await Promise.all([
    WDK_MODULE(),
    WALLET_EVM_MODULE(),
  ]);

  const seedPhrase = WDK.getRandomSeedPhrase();

  const wdk = new WDK(seedPhrase).registerWallet(
    'ethereum',
    WalletManagerEvm,
    { provider: 'https://eth.drpc.org' }
  );

  const account = (await wdk.getAccount('ethereum', 0)) as unknown as IWalletAccount;
  const address = await account.getAddress();
  const balance = await account.getBalance();

  wdk.dispose();

  return {
    seedPhrase,
    address,
    balance: balance.toString(),
  };
}

export async function getBalance(address: string): Promise<string> {
  const [{ default: WDK }, { default: WalletManagerEvm }] = await Promise.all([
    WDK_MODULE(),
    WALLET_EVM_MODULE(),
  ]);

  const seedPhrase = WDK.getRandomSeedPhrase();
  const wdk = new WDK(seedPhrase).registerWallet(
    'ethereum',
    WalletManagerEvm,
    { provider: 'https://eth.drpc.org' }
  );

  const account = (await wdk.getAccount('ethereum', 0)) as unknown as IWalletAccount;

  try {
    const balance = await account.getBalance();
    wdk.dispose();
    return balance.toString();
  } catch {
    wdk.dispose();
    return '0';
  }
}
