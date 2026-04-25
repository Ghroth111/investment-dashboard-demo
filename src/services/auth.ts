import { demoAuth } from '../config/demo';
import type { UserProfile } from '../types/models';

interface LocalAuthRecord {
  user: UserProfile;
  password: string;
}

interface AuthResponse {
  token: string;
  user: UserProfile;
}

const authStorageKey = 'investment-dashboard-local-auth-users';

function getLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createLocalToken(userId: string) {
  return `local:${userId}`;
}

function readUsers() {
  const storage = getLocalStorage();
  if (!storage) {
    return {};
  }

  const rawValue = storage.getItem(authStorageKey);
  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as Record<string, LocalAuthRecord>;
  } catch {
    storage.removeItem(authStorageKey);
    return {};
  }
}

function saveUsers(users: Record<string, LocalAuthRecord>) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(authStorageKey, JSON.stringify(users));
}

function createUserProfile(payload: { name: string; email: string }): UserProfile {
  const email = normalizeEmail(payload.email);

  return {
    id: `local-${email || Date.now()}`,
    name: payload.name.trim() || email.split('@')[0] || 'Local User',
    email,
    baseCurrency: 'USD',
    memberSince: new Date().toISOString().slice(0, 10),
  };
}

export async function registerWithEmail(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const email = normalizeEmail(payload.email);
  const users = readUsers();

  if (!email) {
    throw new Error('请输入邮箱。');
  }

  if (payload.password.length < 8) {
    throw new Error('密码至少需要 8 位。');
  }

  if (users[email]) {
    throw new Error('这个本地账户已经存在，请直接登录。');
  }

  const user = createUserProfile({ name: payload.name, email });
  users[email] = {
    user,
    password: payload.password,
  };
  saveUsers(users);

  return {
    token: createLocalToken(user.id),
    user,
  };
}

export async function loginWithEmail(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const email = normalizeEmail(payload.email);
  const users = readUsers();
  const existingUser = users[email];

  if (email === normalizeEmail(demoAuth.email) && payload.password === demoAuth.password) {
    const demoUser =
      existingUser?.user ??
      createUserProfile({
        name: 'Demo User',
        email,
      });

    if (!existingUser) {
      users[email] = {
        user: demoUser,
        password: payload.password,
      };
      saveUsers(users);
    }

    return {
      token: createLocalToken(demoUser.id),
      user: demoUser,
    };
  }

  if (!existingUser || existingUser.password !== payload.password) {
    throw new Error('本地账户不存在或密码不正确。');
  }

  return {
    token: createLocalToken(existingUser.user.id),
    user: existingUser.user,
  };
}

export async function fetchCurrentUser(token: string) {
  const userId = token.startsWith('local:') ? token.slice('local:'.length) : token;
  const users = readUsers();
  const record = Object.values(users).find((item) => item.user.id === userId);

  if (!record) {
    throw new Error('本地登录已失效，请重新登录。');
  }

  return record.user;
}
