import { convertAmount, getAccountMetrics } from '../dashboard/selectors';
import { colors } from '../../theme';
import type {
  Account,
  AssetClass,
  CurrencyCode,
  ExchangeRates,
  Holding,
} from '../../types/models';

export type AnalysisMode = 'assetClass' | 'platform';

export interface AssetPosition {
  accountId: string;
  accountName: string;
  platform: string;
  holdingId: string;
  updatedAt: string;
  currency: CurrencyCode;
  quantity: number;
  currentPrice: number;
  costBasis: number;
  value: number;
  costValue: number;
  pnl: number;
  pnlRate: number;
  todayChange: number;
}

export interface AggregatedAssetItem {
  assetKey: string;
  name: string;
  symbol: string;
  assetClass: AssetClass;
  currency: CurrencyCode;
  quantity: number;
  currentPrice: number;
  costBasis: number;
  marketValue: number;
  costValue: number;
  pnl: number;
  pnlRate: number;
  todayChange: number;
  accountCount: number;
  lastUpdated: string;
  platforms: string[];
  positions: AssetPosition[];
}

export interface AssetGroupSection {
  assetClass: AssetClass;
  title: string;
  totalValue: number;
  items: AggregatedAssetItem[];
}

export interface AnalysisDistributionItem {
  key: string;
  label: string;
  value: number;
  percentage: number;
  tone: string;
}

const assetClassOrder: AssetClass[] = ['Stock', 'ETF', 'Fund', 'Crypto', 'Cash'];

const assetClassLabels: Record<AssetClass, string> = {
  Stock: 'Stocks',
  ETF: 'ETFs',
  Fund: 'Funds',
  Crypto: 'Crypto',
  Cash: 'Cash',
};

const distributionTones = ['#0E2948', '#215EA0', '#0D7A6B', '#3B82F6', '#BA842B', '#BF5353'];

function toBaseValue(amount: number, currency: CurrencyCode, baseCurrency: CurrencyCode, rates: ExchangeRates) {
  return convertAmount(amount, currency, baseCurrency, rates);
}

export function getHoldingAssetKey(holding: Holding) {
  const symbol = holding.symbol.trim().toUpperCase();
  const name = holding.name.trim().toUpperCase().replace(/\s+/g, '-');
  const baseKey = symbol || name;

  return `${baseKey}__${holding.assetClass}__${holding.currency}`;
}

export function buildAggregatedAssets(
  accounts: Account[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
) {
  const assets = new Map<string, AggregatedAssetItem>();

  accounts.forEach((account) => {
    account.holdings.forEach((holding) => {
      if (holding.quantity <= 0) {
        return;
      }

      const assetKey = getHoldingAssetKey(holding);
      const marketValueRaw = holding.currentPrice * holding.quantity;
      const costValueRaw = holding.costBasis * holding.quantity;
      const marketValue = toBaseValue(marketValueRaw, holding.currency, baseCurrency, rates);
      const costValue = toBaseValue(costValueRaw, holding.currency, baseCurrency, rates);
      const pnl = marketValue - costValue;
      const todayChange = toBaseValue(
        marketValueRaw * holding.dailyChangeRate,
        holding.currency,
        baseCurrency,
        rates,
      );

      const position: AssetPosition = {
        accountId: account.id,
        accountName: account.name,
        platform: account.platform,
        holdingId: holding.id,
        updatedAt: account.updatedAt,
        currency: holding.currency,
        quantity: holding.quantity,
        currentPrice: toBaseValue(holding.currentPrice, holding.currency, baseCurrency, rates),
        costBasis: toBaseValue(holding.costBasis, holding.currency, baseCurrency, rates),
        value: marketValue,
        costValue,
        pnl,
        pnlRate: costValue === 0 ? 0 : pnl / costValue,
        todayChange,
      };

      const existing = assets.get(assetKey);

      if (!existing) {
        assets.set(assetKey, {
          assetKey,
          name: holding.name,
          symbol: holding.symbol,
          assetClass: holding.assetClass,
          currency: holding.currency,
          quantity: holding.quantity,
          currentPrice: 0,
          costBasis: 0,
          marketValue,
          costValue,
          pnl,
          pnlRate: costValue === 0 ? 0 : pnl / costValue,
          todayChange,
          accountCount: 1,
          lastUpdated: account.updatedAt,
          platforms: [account.platform],
          positions: [position],
        });
        return;
      }

      existing.quantity += holding.quantity;
      existing.marketValue += marketValue;
      existing.costValue += costValue;
      existing.pnl += pnl;
      existing.todayChange += todayChange;
      existing.lastUpdated =
        new Date(account.updatedAt) > new Date(existing.lastUpdated)
          ? account.updatedAt
          : existing.lastUpdated;
      existing.positions.push(position);

      if (!existing.platforms.includes(account.platform)) {
        existing.platforms.push(account.platform);
      }
    });
  });

  return Array.from(assets.values())
    .map((item) => ({
      ...item,
      currentPrice: item.quantity === 0 ? 0 : item.marketValue / item.quantity,
      costBasis: item.quantity === 0 ? 0 : item.costValue / item.quantity,
      pnlRate: item.costValue === 0 ? 0 : item.pnl / item.costValue,
      accountCount: new Set(item.positions.map((position) => position.accountId)).size,
      platforms: [...new Set(item.platforms)].sort(),
      positions: [...item.positions].sort((left, right) => right.value - left.value),
    }))
    .sort((left, right) => right.marketValue - left.marketValue);
}

export function groupAssetsByClass(items: AggregatedAssetItem[]): AssetGroupSection[] {
  return assetClassOrder
    .map((assetClass) => {
      const groupedItems = items.filter((item) => item.assetClass === assetClass);

      if (groupedItems.length === 0) {
        return null;
      }

      return {
        assetClass,
        title: assetClassLabels[assetClass],
        totalValue: groupedItems.reduce((sum, item) => sum + item.marketValue, 0),
        items: groupedItems,
      };
    })
    .filter((section): section is AssetGroupSection => section !== null);
}

export function getAssetsForAnalysisSlice(
  accounts: Account[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
  mode: AnalysisMode,
  selectedKey: string,
) {
  if (mode === 'platform') {
    const filteredAccounts = accounts.filter((account) => account.platform === selectedKey);
    return buildAggregatedAssets(filteredAccounts, baseCurrency, rates);
  }

  return buildAggregatedAssets(accounts, baseCurrency, rates).filter(
    (item) => item.assetClass === selectedKey,
  );
}

export function getAnalysisDistribution(
  accounts: Account[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
  mode: AnalysisMode,
): AnalysisDistributionItem[] {
  if (mode === 'platform') {
    const totals = new Map<string, number>();

    accounts.forEach((account) => {
      const metrics = getAccountMetrics(account);
      const value = convertAmount(metrics.totalValue, account.currency, baseCurrency, rates);
      totals.set(account.platform, (totals.get(account.platform) ?? 0) + value);
    });

    const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(totals.entries())
      .map(([platform, value], index) => ({
        key: platform,
        label: platform,
        value,
        percentage: total === 0 ? 0 : value / total,
        tone: distributionTones[index % distributionTones.length],
      }))
      .sort((left, right) => right.value - left.value);
  }

  const assets = buildAggregatedAssets(accounts, baseCurrency, rates);
  const total = assets.reduce((sum, item) => sum + item.marketValue, 0);

  return assetClassOrder
    .map((assetClass, index) => {
      const items = assets.filter((item) => item.assetClass === assetClass);
      const value = items.reduce((sum, item) => sum + item.marketValue, 0);

      if (value === 0) {
        return null;
      }

      return {
        key: assetClass,
        label: assetClassLabels[assetClass],
        value,
        percentage: total === 0 ? 0 : value / total,
        tone: distributionTones[index % distributionTones.length],
      };
    })
    .filter(
      (
        item,
      ): item is {
        key: AssetClass;
        label: string;
        value: number;
        percentage: number;
        tone: string;
      } => item !== null,
    )
    .map((item) => ({
      ...item,
      key: item.key,
    }));
}

export function getAnalysisSliceDefaultKey(items: AnalysisDistributionItem[]) {
  return items[0]?.key ?? '';
}

export function getAssetSnapshot(
  accounts: Account[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
  assetKey: string,
) {
  return buildAggregatedAssets(accounts, baseCurrency, rates).find((item) => item.assetKey === assetKey);
}

export function getAssetClassLabel(assetClass: AssetClass) {
  return assetClassLabels[assetClass];
}

export function getAssetClassTone(assetClass: AssetClass) {
  const toneIndex = assetClassOrder.indexOf(assetClass);
  return distributionTones[(toneIndex + distributionTones.length) % distributionTones.length];
}

export const analyticsActionTone = colors.info;
