import { marketApiBaseUrl } from '../config/api';
import type { AssetClass } from '../types/models';

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  micCode?: string;
  exchangeTimezone?: string;
  instrumentType: string;
  assetClass: AssetClass;
  country: string;
  currency: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string;
  instrumentType: string | null;
  price: number;
  percentChange: number | null;
  change: number | null;
  timestamp: string;
}

interface SearchResponse {
  query: string;
  results: StockSearchResult[];
}

interface PriceResponse extends StockQuote {}

async function requestJson<T>(path: string, params: Record<string, string | undefined>) {
  const url = new URL(`${marketApiBaseUrl}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString());
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export async function searchUsStocks(query: string) {
  const payload = await requestJson<SearchResponse>('/stocks/search', { q: query });
  return payload.results;
}

export async function fetchLatestPrice(params: {
  symbol: string;
  exchange?: string;
  micCode?: string;
  country?: string;
  type?: string;
}) {
  return requestJson<PriceResponse>('/stocks/price', {
    symbol: params.symbol,
    exchange: params.exchange,
    micCode: params.micCode,
    country: params.country,
    type: params.type,
  });
}
