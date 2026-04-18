export type CurrencyCode = 'USD' | 'CNY' | 'EUR' | 'HKD' | 'USDT';
export type AccountType = 'Brokerage' | 'Fund' | 'Crypto' | 'Cash' | 'Manual';
export type SourceType = 'api' | 'manual' | 'screenshot' | 'mock';
export type AssetClass = 'Stock' | 'ETF' | 'Fund' | 'Crypto' | 'Cash';
export type TrendRange = '1D' | '7D' | '30D' | 'ALL';
export type DemoPhase = 'splash' | 'login' | 'app';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  baseCurrency: CurrencyCode;
  memberSince: string;
}

export interface Holding {
  id: string;
  name: string;
  symbol: string;
  assetClass: AssetClass;
  quantity: number;
  currentPrice: number;
  costBasis: number;
  currency: CurrencyCode;
  dailyChangeRate: number;
}

export interface Account {
  id: string;
  name: string;
  platform: string;
  type: AccountType;
  sourceType: SourceType;
  currency: CurrencyCode;
  cashBalance: number;
  updatedAt: string;
  subtitle: string;
  holdings: Holding[];
}

export interface CashflowRecord {
  id: string;
  title: string;
  kind: 'Deposit' | 'Withdrawal' | 'Dividend' | 'Fee' | 'Transfer';
  amount: number;
  currency: CurrencyCode;
  accountId: string;
  accountName: string;
  note: string;
  createdAt: string;
}

export interface TrendPoint {
  label: string;
  valueUsd: number;
}

export interface DistributionItem {
  label: string;
  value: number;
  percentage: number;
  tone: string;
}

export interface DashboardSummary {
  totalAssets: number;
  todayChange: number;
  cumulativeReturn: number;
  cumulativeReturnRate: number;
  accountCount: number;
  lastUpdated: string;
}

export interface ExchangeRates {
  [key: string]: number;
}

export interface ManualHoldingInput {
  name: string;
  symbol: string;
  assetClass: AssetClass;
  quantity: number;
  currentPrice: number;
  costBasis: number;
}

export interface ManualAccountPayload {
  name: string;
  platform: string;
  type: AccountType;
  currency: CurrencyCode;
  cashBalance: number;
  holdings: ManualHoldingInput[];
}
