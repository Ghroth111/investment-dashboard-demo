import type { UserProfile } from '../types/models';

const sessionStorageKey = 'investment-dashboard-session';

interface StoredSession {
  token: string;
  user: UserProfile;
}

function getLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

export function saveSession(session: StoredSession) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(sessionStorageKey, JSON.stringify(session));
}

export function readSession() {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(sessionStorageKey);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredSession;
  } catch {
    storage.removeItem(sessionStorageKey);
    return null;
  }
}

export function clearSession() {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(sessionStorageKey);
}
