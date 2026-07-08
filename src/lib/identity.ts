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


