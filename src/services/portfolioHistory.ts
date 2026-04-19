import { backendApiBaseUrl } from '../config/api';
import type { TrendPoint, TrendRange } from '../types/models';

export type PortfolioHistory = Record<TrendRange, TrendPoint[]>;

export async function fetchPortfolioHistory(token: string) {
  const response = await fetch(`${backendApiBaseUrl}/portfolio-history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as {
    history?: PortfolioHistory;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to fetch portfolio history');
  }

  return payload.history as PortfolioHistory;
}
