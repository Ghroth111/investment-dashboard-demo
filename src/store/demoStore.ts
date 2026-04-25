import { create } from 'zustand';

import { demoAuth } from '../config/demo';
import { syncTradeArtifacts, rebuildHoldingFromTrades, updateTradeTransaction } from '../features/trades/sync';
import { fetchCurrentUser } from '../services/auth';
import { fetchLatestPrice } from '../services/marketData';
import {
  createEmptyPortfolioHistory,
  refreshHoldingSnapshots,
  readLocalPortfolioData,
  refreshPortfolioHistory,
  saveLocalPortfolioData,
} from '../services/localPortfolioStorage';
import { clearSession, readSession, saveSession } from '../services/sessionStorage';
import { exchangeRates, mockAccounts, mockPortfolioHistory, mockTransactions } from '../mock';
import type {
  Account,
  AddTransactionPayload,
  DemoPhase,
  ExchangeRates,
  HoldingTrade,
  HoldingSnapshotPoint,
  SaveManualAccountPayload,
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
  holdingSnapshots: Record<string, HoldingSnapshotPoint[]>;
  lastPriceSyncAt: string | null;
  priceSyncInProgress: boolean;
  exchangeRates: ExchangeRates;
  finishSplash: () => void;
  authenticate: (payload: { user: UserProfile; token: string }) => Promise<void>;
  loadAccounts: () => Promise<void>;
  loadPortfolioHistory: () => Promise<void>;
  refreshPrices: (options?: { force?: boolean }) => Promise<{
    refreshedCount: number;
    failedCount: number;
    skippedCount: number;
    syncedAt: string | null;
  }>;
  refreshPricesIfNeeded: () => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => void;
  setBaseCurrency: (currency: UserProfile['baseCurrency']) => void;
  addManualAccount: (payload: SaveManualAccountPayload) => Promise<string>;
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
  id: 'local-device-user',
  name: '本机资产空间',
  email: '仅保存在当前设备',
  baseCurrency: 'USD',
  memberSince: new Date().toISOString().slice(0, 10),
};

function isDemoUser(user: UserProfile) {
  return user.email.toLowerCase() === demoAuth.email.toLowerCase();
}

function getSeededTransactions(user: UserProfile) {
  return isDemoUser(user) ? mockTransactions : [];
}

function getSeededAccounts(user: UserProfile) {
  return isDemoUser(user) ? mockAccounts : [];
}

function getSeededPortfolioHistory(user: UserProfile) {
  return isDemoUser(user) ? mockPortfolioHistory : createEmptyPortfolioHistory();
}

function getInitialLocalData(user: UserProfile) {
  const storedData = readLocalPortfolioData(user.id);
  if (storedData) {
    const holdingSnapshots =
      storedData.holdingSnapshots && Object.keys(storedData.holdingSnapshots).length > 0
        ? storedData.holdingSnapshots
        : refreshHoldingSnapshots({}, storedData.accounts, exchangeRates);

    return {
      ...storedData,
      holdingSnapshots,
      lastPriceSyncAt: storedData.lastPriceSyncAt ?? null,
    };
  }

  return {
    accounts: getSeededAccounts(user),
    transactions: getSeededTransactions(user),
    holdingTrades: [],
    portfolioHistory: getSeededPortfolioHistory(user),
    holdingSnapshots: {},
    lastPriceSyncAt: null,
  };
}

function buildManualAccount(payload: SaveManualAccountPayload): Account {
  const now = new Date().toISOString();
  const accountId = `acct-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  return {
    id: accountId,
    name: payload.name,
    platform: payload.platform,
    type: payload.type,
    sourceType: 'manual',
    currency: payload.currency,
    cashBalance: payload.cashBalance,
    updatedAt: now,
    subtitle: '通过本地手动录入创建',
    holdings: payload.holdings.map((holding, index) => ({
      id: `holding-${Date.now()}-${index}-${Math.random().toString(16).slice(2, 8)}`,
      name: holding.name,
      symbol: holding.symbol,
      assetClass: holding.assetClass,
      quantity: holding.quantity,
      currentPrice: holding.currentPrice,
      costBasis: holding.costBasis,
      currency: payload.currency,
      dailyChangeRate: 0.004 + (index % 3) * 0.0025,
    })),
  };
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

function persistPortfolioState(
  state: Pick<
    DemoState,
    | 'user'
    | 'accounts'
    | 'transactions'
    | 'holdingTrades'
    | 'portfolioHistory'
    | 'holdingSnapshots'
    | 'lastPriceSyncAt'
  >,
) {
  if (!state.user.id) {
    return;
  }

  saveLocalPortfolioData(state.user.id, {
    accounts: state.accounts,
    transactions: state.transactions,
    holdingTrades: state.holdingTrades,
    portfolioHistory: state.portfolioHistory,
    holdingSnapshots: state.holdingSnapshots,
    lastPriceSyncAt: state.lastPriceSyncAt,
  });
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isEligibleForPriceSync(account: Account, holding: Account['holdings'][number]) {
  return (
    holding.assetClass !== 'Cash' &&
    holding.quantity > 0 &&
    Boolean(holding.symbol.trim()) &&
    account.sourceType !== 'mock'
  );
}

function getHoldingMatchKey(symbol: string) {
  return symbol.trim().toUpperCase();
}

function mergeHoldingsIntoAccount(account: Account, payload: SaveManualAccountPayload) {
  const existingHoldingIndexByKey = new Map(
    account.holdings.map((holding, index) => [getHoldingMatchKey(holding.symbol), index]),
  );
  const nextHoldings = account.holdings.map((holding) => ({ ...holding }));

  payload.holdings.forEach((holding, index) => {
    const existingIndex = existingHoldingIndexByKey.get(getHoldingMatchKey(holding.symbol));

    if (existingIndex !== undefined) {
      const existingHolding = nextHoldings[existingIndex];
      nextHoldings[existingIndex] = {
        ...existingHolding,
        name: holding.name,
        symbol: holding.symbol,
        assetClass: holding.assetClass,
        quantity: holding.quantity,
        currentPrice: holding.currentPrice,
        costBasis: holding.costBasis,
        currency: account.currency,
      };
      return;
    }

    nextHoldings.push({
      id: `holding-${Date.now()}-${index}-${Math.random().toString(16).slice(2, 6)}`,
      name: holding.name,
      symbol: holding.symbol,
      assetClass: holding.assetClass,
      quantity: holding.quantity,
      currentPrice: holding.currentPrice,
      costBasis: holding.costBasis,
      currency: account.currency,
      dailyChangeRate: 0.004 + (index % 3) * 0.0025,
    });
  });

  return nextHoldings;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  phase: 'splash',
  user: defaultUser,
  authToken: null,
  accounts: [],
  transactions: [],
  holdingTrades: [],
  portfolioHistory: createEmptyPortfolioHistory(),
  holdingSnapshots: {},
  lastPriceSyncAt: null,
  priceSyncInProgress: false,
  exchangeRates,
  finishSplash: () => set({ phase: 'app' }),
  authenticate: async ({ user, token }) => {
    const localData = getInitialLocalData(user);

    saveSession({ user, token });

    set({
      phase: 'app',
      user,
      authToken: token,
      accounts: localData.accounts,
      transactions: localData.transactions,
      holdingTrades: localData.holdingTrades,
      portfolioHistory: localData.portfolioHistory,
      holdingSnapshots: localData.holdingSnapshots,
      lastPriceSyncAt: localData.lastPriceSyncAt,
    });
    persistPortfolioState(get());
  },
  loadAccounts: async () => {
    const user = get().user;
    if (!get().authToken) {
      set({ accounts: [], holdingTrades: [] });
      return;
    }

    const localData = getInitialLocalData(user);
    set({
      accounts: localData.accounts,
      holdingTrades: localData.holdingTrades,
      transactions: localData.transactions,
      portfolioHistory: localData.portfolioHistory,
      holdingSnapshots: localData.holdingSnapshots,
      lastPriceSyncAt: localData.lastPriceSyncAt,
    });
  },
  loadPortfolioHistory: async () => {
    if (!get().authToken) {
      set({ portfolioHistory: createEmptyPortfolioHistory() });
      return;
    }

    const localData = getInitialLocalData(get().user);
    set({
      portfolioHistory: localData.portfolioHistory,
      holdingSnapshots: localData.holdingSnapshots,
      lastPriceSyncAt: localData.lastPriceSyncAt,
    });
  },
  refreshPrices: async (options) => {
    const {
      accounts,
      exchangeRates: rates,
      portfolioHistory,
      holdingSnapshots,
      priceSyncInProgress,
      lastPriceSyncAt,
    } = get();
    const force = options?.force ?? false;

    if (priceSyncInProgress) {
      return {
        refreshedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        syncedAt: lastPriceSyncAt,
      };
    }

    if (!force && lastPriceSyncAt && getLocalDateKey(new Date(lastPriceSyncAt)) === getLocalDateKey()) {
      return {
        refreshedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        syncedAt: lastPriceSyncAt,
      };
    }

    const eligibleCount = accounts.reduce(
      (count, account) =>
        count +
        account.holdings.filter((holding) => isEligibleForPriceSync(account, holding)).length,
      0,
    );

    if (eligibleCount === 0) {
      return {
        refreshedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        syncedAt: lastPriceSyncAt,
      };
    }

    set({ priceSyncInProgress: true });

    let refreshedCount = 0;
    let failedCount = 0;
    const refreshedAt = new Date().toISOString();

    try {
      const nextAccounts = await Promise.all(
        accounts.map(async (account) => {
          let accountChanged = false;

          const nextHoldings = await Promise.all(
            account.holdings.map(async (holding) => {
              if (!isEligibleForPriceSync(account, holding)) {
                return holding;
              }

              try {
                const quote = await fetchLatestPrice({
                  symbol: holding.symbol,
                });
                const nextDailyChangeRate =
                  quote.percentChange !== null
                    ? quote.percentChange / 100
                    : quote.change !== null && quote.price !== 0
                      ? quote.change / quote.price
                      : holding.dailyChangeRate;

                accountChanged = true;
                refreshedCount += 1;

                return {
                  ...holding,
                  currentPrice: quote.price,
                  dailyChangeRate: nextDailyChangeRate,
                };
              } catch {
                failedCount += 1;
                return holding;
              }
            }),
          );

          if (!accountChanged) {
            return account;
          }

          return {
            ...account,
            holdings: nextHoldings,
            updatedAt: refreshedAt,
          };
        }),
      );

      set((state) => ({
        accounts: nextAccounts,
        portfolioHistory: refreshPortfolioHistory(portfolioHistory, nextAccounts, rates),
        holdingSnapshots: refreshHoldingSnapshots(holdingSnapshots, nextAccounts, rates),
        lastPriceSyncAt: refreshedCount > 0 ? refreshedAt : state.lastPriceSyncAt,
        priceSyncInProgress: false,
      }));
      persistPortfolioState(get());

      return {
        refreshedCount,
        failedCount,
        skippedCount: eligibleCount - refreshedCount - failedCount,
        syncedAt: refreshedCount > 0 ? refreshedAt : get().lastPriceSyncAt,
      };
    } catch (error) {
      set({ priceSyncInProgress: false });
      throw error;
    }
  },
  refreshPricesIfNeeded: async () => {
    await get().refreshPrices({ force: false });
  },
  restoreSession: async () => {
    const session = readSession();
    if (!session?.token) {
      const localData = getInitialLocalData(defaultUser);
      saveSession({ user: defaultUser, token: `local:${defaultUser.id}` });
      set({
        phase: 'app',
        user: defaultUser,
        authToken: `local:${defaultUser.id}`,
        ...localData,
      });
      persistPortfolioState(get());
      return;
    }

    try {
      const user =
        session.token === `local:${defaultUser.id}`
          ? session.user
          : await fetchCurrentUser(session.token);

      saveSession({
        token: session.token,
        user,
      });

      set({
        phase: 'app',
        user,
        authToken: session.token,
        ...getInitialLocalData(user),
      });
      persistPortfolioState(get());
    } catch {
      clearSession();
      const localData = getInitialLocalData(defaultUser);
      saveSession({ user: defaultUser, token: `local:${defaultUser.id}` });
      set({
        phase: 'app',
        user: defaultUser,
        authToken: `local:${defaultUser.id}`,
        ...localData,
      });
      persistPortfolioState(get());
    }
  },
  logout: () =>
    (clearSession(),
    saveSession({ user: defaultUser, token: `local:${defaultUser.id}` }),
    set({
      phase: 'app',
      user: defaultUser,
      authToken: `local:${defaultUser.id}`,
      ...getInitialLocalData(defaultUser),
    })),
  setBaseCurrency: (currency) => {
    set((state) => {
      const user = {
        ...state.user,
        baseCurrency: currency,
      };

      saveSession({ user, token: state.authToken ?? `local:${user.id}` });

      return { user };
    });
    persistPortfolioState(get());
  },
  addManualAccount: async (payload) => {
    if (payload.targetAccountId) {
      const targetAccount = get().accounts.find((account) => account.id === payload.targetAccountId);
      if (!targetAccount) {
        throw new Error('The selected account could not be found.');
      }

      const mergedAccount: Account = {
        ...targetAccount,
        cashBalance: payload.cashBalance,
        updatedAt: new Date().toISOString(),
        holdings: mergeHoldingsIntoAccount(targetAccount, payload),
      };

      set((state) => {
        const nextSnapshot = applyAccountSnapshot(
          state,
          state.accounts.map((account) =>
            account.id === targetAccount.id ? mergedAccount : account,
          ),
        );
        const portfolioHistory = refreshPortfolioHistory(
          state.portfolioHistory,
          nextSnapshot.accounts,
          state.exchangeRates,
        );
        const holdingSnapshots = refreshHoldingSnapshots(
          state.holdingSnapshots,
          nextSnapshot.accounts,
          state.exchangeRates,
        );

        return {
          ...nextSnapshot,
          portfolioHistory,
          holdingSnapshots,
        };
      });
      persistPortfolioState(get());

      return targetAccount.id;
    }

    const token = get().authToken;
    if (!token) {
      throw new Error('You must be logged in to add an account.');
    }

    const createdAccount = buildManualAccount(payload);

    set((state) => {
      const nextSnapshot = applyAccountSnapshot(state, [createdAccount, ...state.accounts]);
      const portfolioHistory = refreshPortfolioHistory(
        state.portfolioHistory,
        nextSnapshot.accounts,
        state.exchangeRates,
      );
      const holdingSnapshots = refreshHoldingSnapshots(
        state.holdingSnapshots,
        nextSnapshot.accounts,
        state.exchangeRates,
      );

      return {
        ...nextSnapshot,
        portfolioHistory,
        holdingSnapshots,
      };
    });
    persistPortfolioState(get());

    return createdAccount.id;
  },
  addScreenshotAccount: async () => {
    throw new Error('为保护资产数据，截图识别不会再上传到后端。后续需要接入本地 OCR 后再启用。');
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
    persistPortfolioState(get());

    return transactionId;
  },
  updateHoldingTrade: (tradeId, patch) => {
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

      const portfolioHistory = refreshPortfolioHistory(
        state.portfolioHistory,
        accounts,
        state.exchangeRates,
      );
      const holdingSnapshots = refreshHoldingSnapshots(
        state.holdingSnapshots,
        accounts,
        state.exchangeRates,
      );

      return {
        accounts,
        holdingTrades: trades,
        transactions: nextTransactions,
        portfolioHistory,
        holdingSnapshots,
      };
    });
    persistPortfolioState(get());
  },
  deleteAccount: async (accountId) => {
    set((state) => {
      const accounts = state.accounts.filter((account) => account.id !== accountId);
      const portfolioHistory = refreshPortfolioHistory(
        state.portfolioHistory,
        accounts,
        state.exchangeRates,
      );
      const holdingSnapshots = refreshHoldingSnapshots(
        state.holdingSnapshots,
        accounts,
        state.exchangeRates,
      );

      return {
        accounts,
        portfolioHistory,
        holdingSnapshots,
        holdingTrades: state.holdingTrades.filter((trade) => trade.accountId !== accountId),
        transactions: state.transactions.filter((transaction) => transaction.accountId !== accountId),
      };
    });
    persistPortfolioState(get());
  },
}));
