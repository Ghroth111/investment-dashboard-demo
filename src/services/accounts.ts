import { backendApiBaseUrl } from '../config/api';
import type {
  Account,
  ManualAccountPayload,
  ScreenshotImportPayload,
  ScreenshotImportResult,
} from '../types/models';

async function requestJson<T>(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${backendApiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export async function fetchAccounts(token: string) {
  const payload = await requestJson<{ accounts: Account[] }>('/accounts', token);
  return payload.accounts;
}

export async function createManualAccount(token: string, payload: ManualAccountPayload) {
  const response = await requestJson<{ account: Account }>('/accounts', token, {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      sourceType: 'manual',
      subtitle: '通过手动录入创建',
    }),
  });

  return response.account;
}

export async function removeAccount(token: string, accountId: string) {
  await requestJson<{ ok: true }>(`/accounts/${accountId}`, token, {
    method: 'DELETE',
  });
}

export async function importScreenshotAccount(token: string, payload: ScreenshotImportPayload) {
  return requestJson<ScreenshotImportResult>('/accounts/screenshot-import', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
