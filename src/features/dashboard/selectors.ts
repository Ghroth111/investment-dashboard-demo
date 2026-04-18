import type {
  Account,
  CurrencyCode,
  DashboardSummary,
  DistributionItem,
  ExchangeRates,
} from '../../types/models';

export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates,
) {
  if (from === to) {
    return amount;
  }

  const usdValue = amount * rates[from];
  return usdValue / rates[to];
}

function holdingMarketValue(quantity: number, currentPrice: number) {
  return quantity * currentPrice;
}

function holdingCostValue(quantity: number, costBasis: number) {
  return quantity * costBasis;
}

export function getAccountMetrics(account: Account) {
  const positionsValue = account.holdings.reduce(
    (sum, holding) => sum + holdingMarketValue(holding.quantity, holding.currentPrice),
    0,
  );
  const positionsCost = account.holdings.reduce(
    (sum, holding) => sum + holdingCostValue(holding.quantity, holding.costBasis),
    0,
  );
  const todayChange = account.holdings.reduce(
    (sum, holding) =>
      sum + holdingMarketValue(holding.quantity, holding.currentPrice) * holding.dailyChangeRate,
    0,
  );

  const totalValue = positionsValue + account.cashBalance;
  const cumulativeReturn = positionsValue - positionsCost;
  const investedCapital = positionsCost + account.cashBalance;

  return {
    totalValue,
    positionsValue,
    positionsCost,
    todayChange,
    cumulativeReturn,
    cumulativeReturnRate: investedCapital === 0 ? 0 : cumulativeReturn / investedCapital,
  };
}

export function getDashboardSummary(
  accounts: Account[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
): DashboardSummary {
  const totals = accounts.reduce(
    (accumulator, account) => {
      const metrics = getAccountMetrics(account);

      accumulator.totalAssets += convertAmount(
        metrics.totalValue,
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
      accumulator.cumulativeReturn += convertAmount(
        metrics.cumulativeReturn,
        account.currency,
        baseCurrency,
        rates,
      );
      accumulator.costBase += convertAmount(
        metrics.totalValue - metrics.cumulativeReturn,
        account.currency,
        baseCurrency,
        rates,
      );
      accumulator.lastUpdated =
        new Date(account.updatedAt) > new Date(accumulator.lastUpdated)
          ? account.updatedAt
          : accumulator.lastUpdated;

      return accumulator;
    },
    {
      totalAssets: 0,
      todayChange: 0,
      cumulativeReturn: 0,
      costBase: 0,
      lastUpdated: accounts[0]?.updatedAt ?? new Date().toISOString(),
    },
  );

  return {
    totalAssets: totals.totalAssets,
    todayChange: totals.todayChange,
    cumulativeReturn: totals.cumulativeReturn,
    cumulativeReturnRate: totals.costBase === 0 ? 0 : totals.cumulativeReturn / totals.costBase,
    accountCount: accounts.length,
    lastUpdated: totals.lastUpdated,
  };
}

export function getCategoryDistribution(
  accounts: Account[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
): DistributionItem[] {
  const totals = new Map<string, number>();

  accounts.forEach((account) => {
    account.holdings.forEach((holding) => {
      const value = convertAmount(
        holdingMarketValue(holding.quantity, holding.currentPrice),
        holding.currency,
        baseCurrency,
        rates,
      );

      totals.set(holding.assetClass, (totals.get(holding.assetClass) ?? 0) + value);
    });

    if (account.cashBalance > 0) {
      const cashValue = convertAmount(account.cashBalance, account.currency, baseCurrency, rates);
      totals.set('Cash', (totals.get('Cash') ?? 0) + cashValue);
    }
  });

  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  const tones = ['#0E2948', '#215EA0', '#0D7A6B', '#3B82F6', '#BA842B'];

  return Array.from(totals.entries())
    .map(([label, value], index) => ({
      label,
      value,
      percentage: total === 0 ? 0 : value / total,
      tone: tones[index % tones.length],
    }))
    .sort((left, right) => right.value - left.value);
}

export function getPlatformDistribution(
  accounts: Account[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
): DistributionItem[] {
  const total = accounts.reduce((sum, account) => {
    const metrics = getAccountMetrics(account);
    return sum + convertAmount(metrics.totalValue, account.currency, baseCurrency, rates);
  }, 0);

  const tones = ['#0E2948', '#0D7A6B', '#215EA0', '#BA842B', '#BF5353'];

  return accounts
    .map((account, index) => {
      const metrics = getAccountMetrics(account);
      const value = convertAmount(metrics.totalValue, account.currency, baseCurrency, rates);

      return {
        label: account.platform,
        value,
        percentage: total === 0 ? 0 : value / total,
        tone: tones[index % tones.length],
      };
    })
    .sort((left, right) => right.value - left.value);
}

export function getTopAccounts(accounts: Account[], count = 4) {
  return [...accounts]
    .sort((left, right) => getAccountMetrics(right).totalValue - getAccountMetrics(left).totalValue)
    .slice(0, count);
}
