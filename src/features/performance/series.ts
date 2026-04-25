import { convertAmount, getAccountMetrics } from '../dashboard/selectors';
import type {
  Account,
  CurrencyCode,
  ExchangeRates,
  Holding,
  HoldingSnapshotPoint,
  PerformancePoint,
  PerformanceRange,
  PerformanceSeries,
} from '../../types/models';

const dayMs = 24 * 60 * 60 * 1000;

const rangeConfigs: Record<
  PerformanceRange,
  {
    points: number;
    lookbackDays?: number;
    useYearStart?: boolean;
  }
> = {
  '7D': { points: 28, lookbackDays: 7 },
  '1M': { points: 30, lookbackDays: 30 },
  '6M': { points: 26, lookbackDays: 182 },
  YTD: { points: 32, useYearStart: true },
  '1Y': { points: 36, lookbackDays: 365 },
  ALL: { points: 42, lookbackDays: 900 },
};

export function createEmptyPerformanceSeries(): PerformanceSeries {
  return {
    '7D': [],
    '1M': [],
    '6M': [],
    YTD: [],
    '1Y': [],
    ALL: [],
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function createNoise(seed: number, offset: number) {
  const value = Math.sin(seed * 0.013 + offset) + Math.cos(seed * 0.007 + offset * 1.618);
  return value / 2;
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function resolveStartDate(endDate: Date, range: PerformanceRange) {
  const config = rangeConfigs[range];

  if (config.useYearStart) {
    return new Date(endDate.getFullYear(), 0, 1);
  }

  return new Date(endDate.getTime() - (config.lookbackDays ?? 30) * dayMs);
}

function buildSeries({
  seedKey,
  currentValue,
  costValue,
  dailyChangeRate,
  updatedAt,
}: {
  seedKey: string;
  currentValue: number;
  costValue: number;
  dailyChangeRate: number;
  updatedAt: string;
}): PerformanceSeries {
  const endDate = new Date(updatedAt);
  const gain = currentValue - costValue;
  const gainRate = costValue === 0 ? 0 : gain / costValue;
  const baseSeed = hashSeed(seedKey);

  return (Object.keys(rangeConfigs) as PerformanceRange[]).reduce<PerformanceSeries>(
    (series, range) => {
      const config = rangeConfigs[range];
      const startDate = resolveStartDate(endDate, range);
      const pointCount = config.points;
      const duration = Math.max(endDate.getTime() - startDate.getTime(), dayMs);
      const rangeSeed = hashSeed(`${seedKey}-${range}`);
      const volatility =
        0.03 +
        Math.abs(dailyChangeRate) * 2.6 +
        clamp(Math.abs(gainRate) * 0.09, 0.01, 0.12);

      const startValueBase =
        currentValue -
        gain * 0.82 -
        currentValue * dailyChangeRate * clamp(duration / (32 * dayMs), 0.3, 5);
      const startValue = Math.max(currentValue * 0.34, startValueBase || currentValue * 0.72);

      const rawValues = Array.from({ length: pointCount }, (_, index) => {
        const progress = pointCount === 1 ? 1 : index / (pointCount - 1);
        const trendValue = startValue + (currentValue - startValue) * easeOutCubic(progress);
        const waveA =
          Math.sin(progress * Math.PI * (2.2 + (rangeSeed % 5) * 0.18) + (rangeSeed % 17)) *
          currentValue *
          volatility *
          0.46;
        const waveB =
          Math.cos(progress * Math.PI * (5.1 + (baseSeed % 7) * 0.11) + (baseSeed % 29)) *
          currentValue *
          volatility *
          0.18;
        const drift = createNoise(rangeSeed, progress * 10.5) * currentValue * volatility * 0.09;

        return Math.max(currentValue * 0.26, trendValue + waveA + waveB + drift);
      });

      const correction = currentValue - rawValues[rawValues.length - 1];
      const adjustedValues = rawValues.map((value, index) => {
        const progress = pointCount === 1 ? 1 : index / (pointCount - 1);
        return Math.max(currentValue * 0.24, value + correction * progress);
      });

      adjustedValues[adjustedValues.length - 1] = currentValue;

      series[range] = adjustedValues.map<PerformancePoint>((value, index) => {
        const progress = pointCount === 1 ? 1 : index / (pointCount - 1);
        const timestamp = new Date(startDate.getTime() + duration * progress).toISOString();
        const pointGain = value - costValue;

        return {
          timestamp,
          value,
          gain: pointGain,
          gainRate: costValue === 0 ? 0 : pointGain / costValue,
        };
      });

      return series;
    },
    createEmptyPerformanceSeries(),
  );
}

export function buildAccountPerformanceSeries(
  account: Account,
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
) {
  const metrics = getAccountMetrics(account);
  const currentValue = convertAmount(metrics.totalValue, account.currency, baseCurrency, rates);
  const costValue = convertAmount(
    metrics.totalValue - metrics.cumulativeReturn,
    account.currency,
    baseCurrency,
    rates,
  );
  const dailyChangeRate = metrics.totalValue === 0 ? 0 : metrics.todayChange / metrics.totalValue;

  return buildSeries({
    seedKey: account.id,
    currentValue,
    costValue,
    dailyChangeRate,
    updatedAt: account.updatedAt,
  });
}

export function buildHoldingPerformanceSeries(
  account: Account,
  holding: Holding,
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
) {
  const marketValue = holding.currentPrice * holding.quantity;
  const costValue = holding.costBasis * holding.quantity;

  return buildSeries({
    seedKey: `${account.id}-${holding.id}`,
    currentValue: convertAmount(marketValue, holding.currency, baseCurrency, rates),
    costValue: convertAmount(costValue, holding.currency, baseCurrency, rates),
    dailyChangeRate: holding.dailyChangeRate,
    updatedAt: account.updatedAt,
  });
}

export function buildSyntheticPerformanceSeries(input: {
  seedKey: string;
  currentValue: number;
  costValue: number;
  dailyChangeRate: number;
  updatedAt: string;
}) {
  return buildSeries(input);
}

export function buildAccountsPerformanceSeries(
  accounts: Account[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
  seedKey = 'portfolio',
) {
  const aggregate = accounts.reduce(
    (accumulator, account) => {
      const metrics = getAccountMetrics(account);

      accumulator.currentValue += convertAmount(
        metrics.totalValue,
        account.currency,
        baseCurrency,
        rates,
      );
      accumulator.costValue += convertAmount(
        metrics.totalValue - metrics.cumulativeReturn,
        account.currency,
        baseCurrency,
        rates,
      );
      accumulator.todayChange += convertAmount(
        metrics.todayChange,
        account.currency,
        baseCurrency,
        rates,
      );
      accumulator.updatedAt =
        new Date(account.updatedAt) > new Date(accumulator.updatedAt)
          ? account.updatedAt
          : accumulator.updatedAt;

      return accumulator;
    },
    {
      currentValue: 0,
      costValue: 0,
      todayChange: 0,
      updatedAt: accounts[0]?.updatedAt ?? new Date().toISOString(),
    },
  );

  return buildSeries({
    seedKey,
    currentValue: aggregate.currentValue,
    costValue: aggregate.costValue,
    dailyChangeRate:
      aggregate.currentValue === 0 ? 0 : aggregate.todayChange / aggregate.currentValue,
    updatedAt: aggregate.updatedAt,
  });
}

function mapSnapshotRange(range: PerformanceRange, snapshots: HoldingSnapshotPoint[]) {
  const lastTimestamp = new Date(snapshots.at(-1)?.timestamp ?? Date.now()).getTime();
  const yearStart = new Date(new Date(lastTimestamp).getFullYear(), 0, 1).getTime();

  switch (range) {
    case '7D':
      return snapshots.filter((point) => new Date(point.timestamp).getTime() >= lastTimestamp - 7 * dayMs);
    case '1M':
      return snapshots.filter((point) => new Date(point.timestamp).getTime() >= lastTimestamp - 30 * dayMs);
    case '6M':
      return snapshots.filter((point) => new Date(point.timestamp).getTime() >= lastTimestamp - 182 * dayMs);
    case 'YTD':
      return snapshots.filter((point) => new Date(point.timestamp).getTime() >= yearStart);
    case '1Y':
      return snapshots.filter((point) => new Date(point.timestamp).getTime() >= lastTimestamp - 365 * dayMs);
    case 'ALL':
    default:
      return snapshots;
  }
}

export function buildHoldingSnapshotPerformanceSeries(
  snapshots: HoldingSnapshotPoint[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
) {
  if (snapshots.length < 2) {
    return createEmptyPerformanceSeries();
  }

  return (['7D', '1M', '6M', 'YTD', '1Y', 'ALL'] as PerformanceRange[]).reduce<PerformanceSeries>(
    (series, range) => {
      const rangePoints = mapSnapshotRange(range, snapshots);

      series[range] = rangePoints.map<PerformancePoint>((point) => {
        const value = convertAmount(point.valueUsd, 'USD', baseCurrency, rates);
        const costValue = convertAmount(point.costValueUsd, 'USD', baseCurrency, rates);
        const gain = value - costValue;

        return {
          timestamp: point.timestamp,
          value,
          gain,
          gainRate: costValue === 0 ? 0 : gain / costValue,
        };
      });

      return series;
    },
    createEmptyPerformanceSeries(),
  );
}
