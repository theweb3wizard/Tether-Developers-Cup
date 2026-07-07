import { supabase } from './supabase';

export type UserIdentity = {
  userId: string;
  username: string;
  address: string;
  cábala?: string;
};

const STORAGE_KEY = 'pozo-identity';

export function saveIdentity(id: UserIdentity) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(id));
}

export function loadIdentity(): UserIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearIdentity() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function generateUserId(): string {
  return `user-${crypto.randomUUID().slice(0, 8)}`;
}

export async function upsertUser(identity: UserIdentity) {
  const { error } = await supabase.from('users').upsert(
    {
      username: identity.username,
      wallet_address: identity.address,
      cábala: identity.cábala || null,
      last_active: new Date().toISOString(),
    },
    { onConflict: 'wallet_address' }
  );
  if (error) throw new Error(error.message);
}
