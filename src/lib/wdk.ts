import type { IWalletAccount } from '@tetherto/wdk-wallet';

const WDK_MODULE = () => import('@tetherto/wdk');
const WALLET_EVM_MODULE = () => import('@tetherto/wdk-wallet-evm');

const USDT_SEPOLIA = '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0';

export type WalletData = {
  seedPhrase: string;
  address: string;
  balance: string;
};

let _wdkInstance: any = null;
let _seedPhrase: string | null = null;

async function getWdk(seed?: string) {
  const [{ default: WDK }, { default: WalletManagerEvm }] = await Promise.all([
    WDK_MODULE(),
    WALLET_EVM_MODULE(),
  ]);

  const phrase = seed || _seedPhrase || WDK.getRandomSeedPhrase();
  if (!_seedPhrase) _seedPhrase = phrase;

  if (_wdkInstance) {
    _wdkInstance.dispose();
  }

  _wdkInstance = new WDK(phrase).registerWallet('ethereum', WalletManagerEvm, {
    provider: 'https://eth.drpc.org',
  });

  return _wdkInstance;
}

export async function createWallet(): Promise<WalletData> {
  const [{ default: WDK }, { default: WalletManagerEvm }] = await Promise.all([
    WDK_MODULE(),
    WALLET_EVM_MODULE(),
  ]);

  if (_wdkInstance) _wdkInstance.dispose();

  const seedPhrase = WDK.getRandomSeedPhrase();
  _seedPhrase = seedPhrase;

  _wdkInstance = new WDK(seedPhrase).registerWallet('ethereum', WalletManagerEvm, {
    provider: 'https://eth.drpc.org',
  });

  const account = (await _wdkInstance.getAccount('ethereum', 0)) as unknown as IWalletAccount;
  const address = await account.getAddress();
  const balance = await account.getBalance();

  return {
    seedPhrase,
    address,
    balance: balance.toString(),
  };
}

export async function getAccount(): Promise<IWalletAccount> {
  const wdk = await getWdk();
  return (await wdk.getAccount('ethereum', 0)) as unknown as IWalletAccount;
}

export async function getWalletInfo(address?: string): Promise<{ address: string; balance: string; usdtBalance: string }> {
  const account = await getAccount();
  const addr = address || (await account.getAddress());
  const balance = await account.getBalance();

  let usdtBalance = '0';
  try {
    const tb = await account.getTokenBalance(USDT_SEPOLIA);
    usdtBalance = tb.toString();
  } catch {}

  return {
    address: addr,
    balance: balance.toString(),
    usdtBalance,
  };
}

export async function sendUsdt(to: string, amount: string): Promise<{ hash: string; fee: string }> {
  const account = await getAccount();
  const result = await account.transfer({
    token: USDT_SEPOLIA,
    recipient: to,
    amount: BigInt(amount),
  });
  return {
    hash: result.hash,
    fee: result.fee.toString(),
  };
}
