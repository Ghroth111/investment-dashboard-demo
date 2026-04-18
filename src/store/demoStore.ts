import { create } from 'zustand';

import {
  exchangeRates,
  mockAccounts,
  mockPortfolioHistory,
  mockTransactions,
  mockUser,
} from '../mock';
import type {
  Account,
  AddTransactionPayload,
  DemoPhase,
  ExchangeRates,
  ManualAccountPayload,
  ManualHoldingInput,
  Transaction,
  TrendPoint,
  TrendRange,
  UserProfile,
} from '../types/models';

interface DemoState {
  phase: DemoPhase;
  user: UserProfile;
  accounts: Account[];
  transactions: Transaction[];
  portfolioHistory: Record<TrendRange, TrendPoint[]>;
  exchangeRates: ExchangeRates;
  finishSplash: () => void;
  enterDemo: () => void;
  logout: () => void;
  setBaseCurrency: (currency: UserProfile['baseCurrency']) => void;
  addManualAccount: (payload: ManualAccountPayload) => string;
  addTransaction: (payload: AddTransactionPayload) => string;
  deleteAccount: (accountId: string) => void;
}

function createManualHolding(
  holding: ManualHoldingInput,
  index: number,
  currency: Account['currency'],
) {
  return {
    id: `manual-holding-${Date.now()}-${index}`,
    name: holding.name,
    symbol: holding.symbol,
    assetClass: holding.assetClass,
    quantity: holding.quantity,
    currentPrice: holding.currentPrice,
    costBasis: holding.costBasis,
    currency,
    dailyChangeRate: index % 2 === 0 ? 0.0032 : -0.0015,
  };
}

export const useDemoStore = create<DemoState>((set) => ({
  phase: 'splash',
  user: mockUser,
  accounts: mockAccounts,
  transactions: mockTransactions,
  portfolioHistory: mockPortfolioHistory,
  exchangeRates,
  finishSplash: () => set({ phase: 'login' }),
  enterDemo: () => set({ phase: 'app' }),
  logout: () => set({ phase: 'login' }),
  setBaseCurrency: (currency) =>
    set((state) => ({
      user: {
        ...state.user,
        baseCurrency: currency,
      },
    })),
  addManualAccount: (payload) => {
    const accountId = `manual-account-${Date.now()}`;

    set((state) => ({
      accounts: [
        {
          id: accountId,
          name: payload.name,
          platform: payload.platform,
          type: payload.type,
          sourceType: 'manual',
          currency: payload.currency,
          cashBalance: payload.cashBalance,
          updatedAt: new Date().toISOString(),
          subtitle: '通过手动录入创建',
          holdings: payload.holdings.map((holding, index) =>
            createManualHolding(holding, index, payload.currency),
          ),
        },
        ...state.accounts,
      ],
    }));

    return accountId;
  },
  addTransaction: (payload) => {
    const transactionId = `txn-${Date.now()}`;

    set((state) => ({
      transactions: [
        {
          id: transactionId,
          ...payload,
          isAuto: false,
        },
        ...state.transactions,
      ],
    }));

    return transactionId;
  },
  deleteAccount: (accountId) =>
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== accountId),
      transactions: state.transactions.filter((transaction) => transaction.accountId !== accountId),
    })),
}));
