import { convertAmount, getAccountMetrics } from '../features/dashboard/selectors';
import { getHoldingAssetKey } from '../features/assets/selectors';
import { exchangeRates } from '../mock';
import type {
  Account,
  ExchangeRates,
  HoldingTrade,
  HoldingSnapshotPoint,
  Transaction,
  TrendPoint,
  TrendRange,
} from '../types/models';

export interface LocalPortfolioData {
  accounts: Account[];
  transactions: Transaction[];
  holdingTrades: HoldingTrade[];
  portfolioHistory: Record<TrendRange, TrendPoint[]>;
  holdingSnapshots?: Record<string, HoldingSnapshotPoint[]>;
  lastPriceSyncAt?: string | null;
}

const storageKeyPrefix = 'investment-dashboard-local-portfolio';
const trendRanges: TrendRange[] = ['1D', '7D', '30D', '90D', '1Y', 'YTD', 'ALL'];
const dayMs = 24 * 60 * 60 * 1000;

function getLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

export function createEmptyPortfolioHistory(): Record<TrendRange, TrendPoint[]> {
  return {
    '1D': [],
    '7D': [],
    '30D': [],
    '90D': [],
    '1Y': [],
    YTD: [],
    ALL: [],
  };
}

function storageKey(userId: string) {
  return `${storageKeyPrefix}:${userId}`;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' });
}

function getDayLabel(date: Date) {
  return date.toLocaleString('en-US', { weekday: 'short' });
}

function calculateTotalUsd(accounts: Account[], rates: ExchangeRates) {
  return accounts.reduce((total, account) => {
    const metrics = getAccountMetrics(account);
    return total + convertAmount(metrics.totalValue, account.currency, 'USD', rates);
  }, 0);
}

function calculateTodayChangeUsd(accounts: Account[], rates: ExchangeRates) {
  return accounts.reduce((total, account) => {
    const metrics = getAccountMetrics(account);
    return total + convertAmount(metrics.todayChange, account.currency, 'USD', rates);
  }, 0);
}

function buildDailyPoint(date: Date, valueUsd: number): TrendPoint {
  return {
    label: getDayLabel(date),
    valueUsd,
    timestamp: date.toISOString(),
  };
}

function upsertHoldingSnapshotPoint(
  points: HoldingSnapshotPoint[],
  date: Date,
  nextPoint: HoldingSnapshotPoint,
) {
  const dateKey = toDateKey(date);
  const withoutToday = points.filter(
    (point) => toDateKey(new Date(point.timestamp)) !== dateKey,
  );

  return [...withoutToday, nextPoint].sort(
    (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

function upsertDailyPoint(points: TrendPoint[], date: Date, valueUsd: number) {
  const dateKey = toDateKey(date);
  const nextPoint = buildDailyPoint(date, valueUsd);
  const withoutToday = points.filter((point) => {
    if (!point.timestamp) {
      return true;
    }

    return toDateKey(new Date(point.timestamp)) !== dateKey;
  });

  return [...withoutToday, nextPoint].sort(
    (left, right) =>
      new Date(left.timestamp ?? 0).getTime() - new Date(right.timestamp ?? 0).getTime(),
  );
}

function samplePoints(points: TrendPoint[], maxPoints: number) {
  if (points.length <= maxPoints) {
    return points;
  }

  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => points[Math.round(index * step)]);
}

function deriveRange(points: TrendPoint[], now: Date, lookbackDays: number, maxPoints: number) {
  const cutoff = now.getTime() - lookbackDays * dayMs;
  return samplePoints(
    points.filter((point) => new Date(point.timestamp ?? 0).getTime() >= cutoff),
    maxPoints,
  );
}

export function refreshPortfolioHistory(
  history: Record<TrendRange, TrendPoint[]>,
  accounts: Account[],
  rates: ExchangeRates = exchangeRates,
) {
  const now = new Date();
  const totalUsd = calculateTotalUsd(accounts, rates);
  const todayChangeUsd = calculateTodayChangeUsd(accounts, rates);
  const allPoints = upsertDailyPoint(history.ALL ?? [], now, totalUsd);
  const previousIntradayValue = Math.max(0, totalUsd - todayChangeUsd);

  const oneDayPoints: TrendPoint[] = [
    {
      label: 'Open',
      valueUsd: previousIntradayValue,
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      label: 'Now',
      valueUsd: totalUsd,
      timestamp: now.toISOString(),
    },
  ];

  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  return {
    '1D': oneDayPoints,
    '7D': deriveRange(allPoints, now, 7, 7),
    '30D': deriveRange(allPoints, now, 30, 8),
    '90D': deriveRange(allPoints, now, 90, 8).map((point) => ({
      ...point,
      label: getMonthLabel(new Date(point.timestamp ?? now)),
    })),
    '1Y': deriveRange(allPoints, now, 365, 12).map((point) => ({
      ...point,
      label: getMonthLabel(new Date(point.timestamp ?? now)),
    })),
    YTD: samplePoints(
      allPoints.filter((point) => new Date(point.timestamp ?? 0).getTime() >= yearStart),
      8,
    ).map((point) => ({
      ...point,
      label: getMonthLabel(new Date(point.timestamp ?? now)),
    })),
    ALL: samplePoints(allPoints, 14).map((point) => ({
      ...point,
      label: point.timestamp ? new Date(point.timestamp).getFullYear().toString() : point.label,
    })),
  };
}

export function refreshHoldingSnapshots(
  history: Record<string, HoldingSnapshotPoint[]> | undefined,
  accounts: Account[],
  rates: ExchangeRates = exchangeRates,
) {
  const now = new Date();
  const nextHistory = { ...(history ?? {}) };
  const aggregated = new Map<
    string,
    { priceUsd: number; valueUsd: number; costValueUsd: number; quantity: number }
  >();

  accounts.forEach((account) => {
    account.holdings.forEach((holding) => {
      if (holding.quantity <= 0 || !holding.symbol.trim()) {
        return;
      }

      const assetKey = getHoldingAssetKey(holding);
      const existing = aggregated.get(assetKey) ?? {
        priceUsd: 0,
        valueUsd: 0,
        costValueUsd: 0,
        quantity: 0,
      };
      const priceUsd = convertAmount(holding.currentPrice, holding.currency, 'USD', rates);
      const valueUsd = convertAmount(
        holding.currentPrice * holding.quantity,
        holding.currency,
        'USD',
        rates,
      );
      const costValueUsd = convertAmount(
        holding.costBasis * holding.quantity,
        holding.currency,
        'USD',
        rates,
      );

      existing.priceUsd += priceUsd * holding.quantity;
      existing.valueUsd += valueUsd;
      existing.costValueUsd += costValueUsd;
      existing.quantity += holding.quantity;

      aggregated.set(assetKey, existing);
    });
  });

  aggregated.forEach((snapshot, assetKey) => {
    const nextPoint: HoldingSnapshotPoint = {
      timestamp: now.toISOString(),
      priceUsd: snapshot.quantity === 0 ? 0 : snapshot.priceUsd / snapshot.quantity,
      valueUsd: snapshot.valueUsd,
      costValueUsd: snapshot.costValueUsd,
      quantity: snapshot.quantity,
    };

    nextHistory[assetKey] = upsertHoldingSnapshotPoint(nextHistory[assetKey] ?? [], now, nextPoint);
  });

  return nextHistory;
}

export function readLocalPortfolioData(userId: string) {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(storageKey(userId));
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as LocalPortfolioData;
  } catch {
    storage.removeItem(storageKey(userId));
    return null;
  }
}

export function saveLocalPortfolioData(userId: string, data: LocalPortfolioData) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(storageKey(userId), JSON.stringify(data));
}
