import { backendApiBaseUrl } from '../config/api';
import type { UserProfile } from '../types/models';

interface AuthResponse {
  token: string;
  user: UserProfile;
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${backendApiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export async function registerWithEmail(payload: {
  name: string;
  email: string;
  password: string;
}) {
  return requestJson<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginWithEmail(payload: {
  email: string;
  password: string;
}) {
  return requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser(token: string) {
  const payload = await requestJson<{ user: UserProfile }>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return payload.user;
}
