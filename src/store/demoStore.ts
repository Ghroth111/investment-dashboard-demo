import { create } from 'zustand';

import {
  exchangeRates,
  mockAccounts,
  mockPortfolioHistory,
  mockRecords,
  mockUser,
} from '../mock';
import type {
  Account,
  CashflowRecord,
  DemoPhase,
  ExchangeRates,
  ManualAccountPayload,
  ManualHoldingInput,
  TrendPoint,
  TrendRange,
  UserProfile,
} from '../types/models';

interface DemoState {
  phase: DemoPhase;
  user: UserProfile;
  accounts: Account[];
  records: CashflowRecord[];
  portfolioHistory: Record<TrendRange, TrendPoint[]>;
  exchangeRates: ExchangeRates;
  finishSplash: () => void;
  enterDemo: () => void;
  logout: () => void;
  setBaseCurrency: (currency: UserProfile['baseCurrency']) => void;
  addManualAccount: (payload: ManualAccountPayload) => string;
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
  records: mockRecords,
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
  deleteAccount: (accountId) =>
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== accountId),
      records: state.records.filter((record) => record.accountId !== accountId),
    })),
}));
