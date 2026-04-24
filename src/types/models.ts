export type CurrencyCode = 'USD' | 'CNY' | 'EUR' | 'HKD' | 'USDT';
export type AccountType = 'Brokerage' | 'Fund' | 'Crypto' | 'Cash' | 'Manual';
export type SourceType = 'api' | 'manual' | 'screenshot' | 'mock';
export type AssetClass = 'Stock' | 'ETF' | 'Fund' | 'Crypto' | 'Cash';
export type TrendRange = '1D' | '7D' | '30D' | '90D' | '1Y' | 'YTD' | 'ALL';
export type PerformanceRange = '7D' | '1M' | '6M' | 'YTD' | '1Y' | 'ALL';
export type HoldingTradeType = 'buy' | 'sell';
export type DemoPhase = 'splash' | 'login' | 'app';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionFilter = 'all' | 'income' | 'expense' | 'investment';
export type BaseExpenseCategory =
  | 'Housing'
  | 'Rent'
  | 'Mortgage'
  | 'Groceries'
  | 'Dining'
  | 'Coffee'
  | 'Transportation'
  | 'Fuel'
  | 'Parking'
  | 'Shopping'
  | 'Healthcare'
  | 'Fitness'
  | 'Education'
  | 'Entertainment'
  | 'Travel'
  | 'Utilities'
  | 'Insurance'
  | 'Subscriptions'
  | 'Family'
  | 'Gifts'
  | 'Taxes'
  | 'Other';
export type BaseIncomeCategory =
  | 'Salary'
  | 'Bonus'
  | 'Freelance'
  | 'Business'
  | 'Stocks'
  | 'Crypto'
  | 'Interest'
  | 'Dividends'
  | 'Funds'
  | 'Refund'
  | 'Rental'
  | 'Gift'
  | 'Other';
export type BaseTransferCategory = 'Transfer';
export type TransactionCategory =
  | BaseExpenseCategory
  | BaseIncomeCategory
  | BaseTransferCategory
  | 'Custom'
  | string;

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

export interface Transaction {
  id: string;
  title: string;
  type: TransactionType;
  category: TransactionCategory;
  subCategory: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  note: string;
  account: string;
  accountId?: string;
  holdingId?: string;
  assetKey?: string;
  tradeId?: string;
  tradeType?: HoldingTradeType;
  isAuto: boolean;
}

export interface TrendPoint {
  label: string;
  valueUsd: number;
  timestamp?: string;
}

export interface PerformancePoint {
  timestamp: string;
  value: number;
  gain: number;
  gainRate: number;
}

export type PerformanceSeries = Record<PerformanceRange, PerformancePoint[]>;

export interface HoldingTrade {
  id: string;
  assetKey: string;
  accountId: string;
  holdingId: string;
  assetName: string;
  symbol: string;
  assetClass: AssetClass;
  tradeType: HoldingTradeType;
  quantity: number;
  price: number;
  currency: CurrencyCode;
  executedAt: string;
  changeRate: number;
  referenceCostBasis?: number;
  source: 'manual' | 'sync';
  transactionId?: string;
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

export interface SaveManualAccountPayload extends ManualAccountPayload {
  targetAccountId?: string;
}

export interface ManualEntryHoldingDraft {
  name: string | null;
  symbol: string | null;
  assetClass: AssetClass | null;
  quantity: number | null;
  currentPrice: number | null;
  costBasis: number | null;
}

export interface ManualEntryPrefill {
  name: string | null;
  platform: string | null;
  type: AccountType | null;
  currency: CurrencyCode | null;
  cashBalance: number | null;
  holdings: ManualEntryHoldingDraft[];
}

export interface ScreenshotImportPayload {
  imageBase64?: string;
  mimeType?: string;
  fileName?: string;
  screenshots?: Array<{
    imageBase64: string;
    mimeType: string;
    fileName?: string;
  }>;
}

export interface ExtractedScreenshotPosition {
  symbol: string | null;
  name: string | null;
  quantity: number | null;
  cost_price: number | null;
  daily_pnl: number | null;
  total_pnl: number | null;
}

export interface ExtractedScreenshotPortfolio {
  platform_name: string | null;
  account_type: string | null;
  currency: string | null;
  cash_amount: number | null;
  total_assets: number | null;
  account_pnl: number | null;
  daily_pnl: number | null;
  positions: ExtractedScreenshotPosition[];
}

export interface ScreenshotImportResult {
  draft: ManualEntryPrefill;
  extracted: ExtractedScreenshotPortfolio;
  normalized: {
    account_type: AccountType;
    currency: CurrencyCode;
    accepted_positions: number;
    rejected_positions: number;
  };
  warnings: string[];
}

export interface AddTransactionPayload {
  title: string;
  type: TransactionType;
  category: TransactionCategory;
  subCategory: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  note: string;
  account: string;
  accountId?: string;
}
