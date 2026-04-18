export type CurrencyCode = 'USD' | 'CNY' | 'EUR' | 'HKD' | 'USDT';
export type AccountType = 'Brokerage' | 'Fund' | 'Crypto' | 'Cash' | 'Manual';
export type SourceType = 'api' | 'manual' | 'screenshot' | 'mock';
export type AssetClass = 'Stock' | 'ETF' | 'Fund' | 'Crypto' | 'Cash';
export type TrendRange = '1D' | '7D' | '30D' | '90D' | '1Y' | 'YTD' | 'ALL';
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
  isAuto: boolean;
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
