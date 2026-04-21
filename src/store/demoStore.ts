import { create } from 'zustand';

import { demoAuth } from '../config/demo';
import { syncTradeArtifacts, rebuildHoldingFromTrades, updateTradeTransaction } from '../features/trades/sync';
import {
  createManualAccount,
  fetchAccounts,
  importScreenshotAccount,
  removeAccount,
} from '../services/accounts';
import { fetchCurrentUser } from '../services/auth';
import { fetchPortfolioHistory } from '../services/portfolioHistory';
import { clearSession, readSession, saveSession } from '../services/sessionStorage';
import { exchangeRates, mockTransactions } from '../mock';
import type {
  Account,
  AddTransactionPayload,
  DemoPhase,
  ExchangeRates,
  HoldingTrade,
  ManualAccountPayload,
  ScreenshotImportPayload,
  ScreenshotImportResult,
  Transaction,
  TrendPoint,
  TrendRange,
  UserProfile,
} from '../types/models';

interface DemoState {
  phase: DemoPhase;
  user: UserProfile;
  authToken: string | null;
  accounts: Account[];
  transactions: Transaction[];
  holdingTrades: HoldingTrade[];
  portfolioHistory: Record<TrendRange, TrendPoint[]>;
  exchangeRates: ExchangeRates;
  finishSplash: () => void;
  authenticate: (payload: { user: UserProfile; token: string }) => Promise<void>;
  loadAccounts: () => Promise<void>;
  loadPortfolioHistory: () => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => void;
  setBaseCurrency: (currency: UserProfile['baseCurrency']) => void;
  addManualAccount: (payload: ManualAccountPayload) => Promise<string>;
  addScreenshotAccount: (payload: ScreenshotImportPayload) => Promise<ScreenshotImportResult>;
  addTransaction: (payload: AddTransactionPayload) => string;
  updateHoldingTrade: (
    tradeId: string,
    patch: Partial<
      Pick<
        HoldingTrade,
        'tradeType' | 'quantity' | 'price' | 'executedAt' | 'changeRate' | 'source'
      >
    >,
  ) => void;
  deleteAccount: (accountId: string) => Promise<void>;
}

const defaultUser: UserProfile = {
  id: 'guest-user',
  name: 'Guest',
  email: '',
  baseCurrency: 'USD',
  memberSince: new Date().toISOString().slice(0, 10),
};

function createEmptyPortfolioHistory(): Record<TrendRange, TrendPoint[]> {
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

function isDemoUser(user: UserProfile) {
  return user.email.toLowerCase() === demoAuth.email.toLowerCase();
}

function getSeededTransactions(user: UserProfile) {
  return isDemoUser(user) ? mockTransactions : [];
}

function applyAccountSnapshot(
  state: Pick<DemoState, 'accounts' | 'holdingTrades' | 'transactions'>,
  nextAccounts: Account[],
) {
  const { trades, transactions } = syncTradeArtifacts({
    previousAccounts: state.accounts,
    nextAccounts,
    existingTrades: state.holdingTrades,
    existingTransactions: state.transactions,
  });

  return {
    accounts: nextAccounts,
    holdingTrades: trades,
    transactions,
  };
}

export const useDemoStore = create<DemoState>((set, get) => ({
  phase: 'splash',
  user: defaultUser,
  authToken: null,
  accounts: [],
  transactions: [],
  holdingTrades: [],
  portfolioHistory: createEmptyPortfolioHistory(),
  exchangeRates,
  finishSplash: () => set({ phase: 'login' }),
  authenticate: async ({ user, token }) => {
    saveSession({ user, token });

    set({
      phase: 'app',
      user,
      authToken: token,
      accounts: [],
      transactions: getSeededTransactions(user),
      holdingTrades: [],
      portfolioHistory: createEmptyPortfolioHistory(),
    });

    await Promise.all([get().loadAccounts(), get().loadPortfolioHistory()]);
  },
  loadAccounts: async () => {
    const token = get().authToken;
    if (!token) {
      set({ accounts: [], holdingTrades: [] });
      return;
    }

    const accounts = await fetchAccounts(token);
    set((state) => applyAccountSnapshot(state, accounts));
  },
  loadPortfolioHistory: async () => {
    const token = get().authToken;
    if (!token) {
      set({ portfolioHistory: createEmptyPortfolioHistory() });
      return;
    }

    const portfolioHistory = await fetchPortfolioHistory(token);
    set({ portfolioHistory });
  },
  restoreSession: async () => {
    const session = readSession();
    if (!session?.token) {
      set({ phase: 'login' });
      return;
    }

    try {
      const user = await fetchCurrentUser(session.token);

      saveSession({
        token: session.token,
        user,
      });

      set({
        phase: 'app',
        user,
        authToken: session.token,
        accounts: [],
        transactions: getSeededTransactions(user),
        holdingTrades: [],
        portfolioHistory: createEmptyPortfolioHistory(),
      });

      await Promise.all([get().loadAccounts(), get().loadPortfolioHistory()]);
    } catch {
      clearSession();
      set({
        phase: 'login',
        user: defaultUser,
        authToken: null,
        accounts: [],
        transactions: [],
        holdingTrades: [],
        portfolioHistory: createEmptyPortfolioHistory(),
      });
    }
  },
  logout: () =>
    (clearSession(),
    set({
      phase: 'login',
      user: defaultUser,
      authToken: null,
      accounts: [],
      transactions: [],
      holdingTrades: [],
      portfolioHistory: createEmptyPortfolioHistory(),
    })),
  setBaseCurrency: (currency) =>
    set((state) => ({
      user: {
        ...state.user,
        baseCurrency: currency,
      },
    })),
  addManualAccount: async (payload) => {
    const token = get().authToken;
    if (!token) {
      throw new Error('You must be logged in to add an account.');
    }

    const createdAccount = await createManualAccount(token, payload);

    set((state) => applyAccountSnapshot(state, [createdAccount, ...state.accounts]));

    await get().loadPortfolioHistory();

    return createdAccount.id;
  },
  addScreenshotAccount: async (payload) => {
    const token = get().authToken;
    if (!token) {
      throw new Error('You must be logged in to import a screenshot.');
    }

    return importScreenshotAccount(token, payload);
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
  updateHoldingTrade: (tradeId, patch) =>
    set((state) => {
      const trades = state.holdingTrades.map((trade) =>
        trade.id === tradeId ? { ...trade, ...patch } : trade,
      );
      const updatedTrade = trades.find((trade) => trade.id === tradeId);

      if (!updatedTrade) {
        return state;
      }

      const tradeHoldingTrades = trades.filter(
        (trade) =>
          trade.accountId === updatedTrade.accountId && trade.holdingId === updatedTrade.holdingId,
      );

      const accounts = state.accounts.map((account) => {
        if (account.id !== updatedTrade.accountId) {
          return account;
        }

        return {
          ...account,
          holdings: account.holdings.map((holding) => {
            if (holding.id !== updatedTrade.holdingId) {
              return holding;
            }

            const rebuilt = rebuildHoldingFromTrades(holding, tradeHoldingTrades);

            return {
              ...holding,
              quantity: rebuilt.quantity,
              costBasis: rebuilt.costBasis,
            };
          }),
          updatedAt: updatedTrade.executedAt,
        };
      });

      const accountName =
        accounts.find((account) => account.id === updatedTrade.accountId)?.name ?? updatedTrade.symbol;
      const existingTransaction = state.transactions.find(
        (transaction) => transaction.tradeId === updatedTrade.id,
      );
      const nextTransactions = existingTransaction
        ? state.transactions.map((transaction) =>
            transaction.tradeId === updatedTrade.id
              ? updateTradeTransaction(transaction, updatedTrade, accountName)
              : transaction,
          )
        : [
            updateTradeTransaction(
              {
                id: `txn-${updatedTrade.id}`,
                title: '',
                type: 'expense',
                category: 'Stocks',
                subCategory: updatedTrade.assetClass,
                amount: 0,
                currency: updatedTrade.currency,
                date: updatedTrade.executedAt,
                note: '',
                account: accountName,
                isAuto: updatedTrade.source === 'sync',
              },
              updatedTrade,
              accountName,
            ),
            ...state.transactions,
          ];

      return {
        accounts,
        holdingTrades: trades,
        transactions: nextTransactions,
      };
    }),
  deleteAccount: async (accountId) => {
    const token = get().authToken;
    if (!token) {
      throw new Error('You must be logged in to delete an account.');
    }

    await removeAccount(token, accountId);

    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== accountId),
      holdingTrades: state.holdingTrades.filter((trade) => trade.accountId !== accountId),
      transactions: state.transactions.filter((transaction) => transaction.accountId !== accountId),
    }));

    await get().loadPortfolioHistory();
  },
}));
