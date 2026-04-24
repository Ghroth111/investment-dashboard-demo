import { getHoldingAssetKey } from '../assets/selectors';
import type {
  Account,
  AssetClass,
  Holding,
  HoldingTrade,
  HoldingTradeType,
  Transaction,
} from '../../types/models';

interface HoldingSnapshot {
  account: Account;
  holding: Holding;
}

interface SyncArtifactsInput {
  previousAccounts: Account[];
  nextAccounts: Account[];
  existingTrades: HoldingTrade[];
  existingTransactions: Transaction[];
}

interface SyncArtifactsResult {
  trades: HoldingTrade[];
  transactions: Transaction[];
}

function getHoldingRecordKey(accountId: string, holdingId: string) {
  return `${accountId}:${holdingId}`;
}

function getCategoryForAssetClass(assetClass: AssetClass) {
  switch (assetClass) {
    case 'Crypto':
      return 'Crypto';
    case 'Fund':
    case 'ETF':
      return 'Funds';
    default:
      return 'Stocks';
  }
}

function flattenAccounts(accounts: Account[]) {
  const map = new Map<string, HoldingSnapshot>();

  accounts.forEach((account) => {
    account.holdings.forEach((holding) => {
      map.set(getHoldingRecordKey(account.id, holding.id), {
        account,
        holding,
      });
    });
  });

  return map;
}

function createTradeId(snapshot: HoldingSnapshot, tradeType: HoldingTradeType) {
  return `trade-${snapshot.account.id}-${snapshot.holding.id}-${tradeType}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2, 6)}`;
}

function createTradeTransaction(
  snapshot: HoldingSnapshot,
  trade: HoldingTrade,
): Transaction {
  const isBuy = trade.tradeType === 'buy';
  const referenceCostBasis = trade.referenceCostBasis ?? trade.price;
  const realizedPnl = (trade.price - referenceCostBasis) * trade.quantity;

  return {
    id: `txn-${trade.id}`,
    title: isBuy
      ? `Buy ${trade.symbol}`
      : `${realizedPnl >= 0 ? 'Realized Gain' : 'Realized Loss'} ${trade.symbol}`,
    type: isBuy ? 'transfer' : realizedPnl >= 0 ? 'income' : 'expense',
    category: isBuy ? 'Transfer' : getCategoryForAssetClass(trade.assetClass),
    subCategory: isBuy ? `Buy ${trade.assetClass}` : `Realized ${trade.assetClass} P/L`,
    amount: isBuy ? trade.quantity * trade.price : Math.abs(realizedPnl),
    currency: trade.currency,
    date: trade.executedAt,
    note:
      trade.source === 'sync'
        ? isBuy
          ? 'Auto synced as an investment transfer from imported portfolio changes'
          : 'Auto synced as realized profit or loss from imported portfolio changes'
        : isBuy
          ? 'Manual investment transfer'
          : 'Manual realized profit or loss',
    account: snapshot.account.name,
    accountId: trade.accountId,
    holdingId: trade.holdingId,
    assetKey: trade.assetKey,
    tradeId: trade.id,
    tradeType: trade.tradeType,
    isAuto: trade.source === 'sync',
  };
}

function createTrade(
  snapshot: HoldingSnapshot,
  tradeType: HoldingTradeType,
  quantity: number,
  price: number,
  referenceCostBasis: number,
  source: HoldingTrade['source'],
) {
  const trade: HoldingTrade = {
    id: createTradeId(snapshot, tradeType),
    assetKey: getHoldingAssetKey(snapshot.holding),
    accountId: snapshot.account.id,
    holdingId: snapshot.holding.id,
    assetName: snapshot.holding.name,
    symbol: snapshot.holding.symbol,
    assetClass: snapshot.holding.assetClass,
    tradeType,
    quantity,
    price,
    currency: snapshot.holding.currency,
    executedAt: snapshot.account.updatedAt,
    changeRate: snapshot.holding.dailyChangeRate,
    referenceCostBasis,
    source,
  };

  return trade;
}

export function rebuildHoldingFromTrades(holding: Holding, trades: HoldingTrade[]) {
  const sortedTrades = [...trades].sort(
    (left, right) => new Date(left.executedAt).getTime() - new Date(right.executedAt).getTime(),
  );
  let quantity = 0;
  let costValue = 0;

  sortedTrades.forEach((trade) => {
    if (trade.tradeType === 'buy') {
      quantity += trade.quantity;
      costValue += trade.quantity * trade.price;
      return;
    }

    if (quantity <= 0) {
      return;
    }

    const averageCost = costValue / quantity;
    const sellQuantity = Math.min(quantity, trade.quantity);
    quantity -= sellQuantity;
    costValue = Math.max(0, costValue - averageCost * sellQuantity);
  });

  return {
    quantity,
    costBasis: quantity === 0 ? holding.costBasis : costValue / quantity,
  };
}

export function syncTradeArtifacts({
  previousAccounts,
  nextAccounts,
  existingTrades,
  existingTransactions,
}: SyncArtifactsInput): SyncArtifactsResult {
  const previousMap = flattenAccounts(previousAccounts);
  const nextMap = flattenAccounts(nextAccounts);
  const liveHoldingKeys = new Set(nextMap.keys());
  const trades = existingTrades.filter((trade) =>
    liveHoldingKeys.has(getHoldingRecordKey(trade.accountId, trade.holdingId)),
  );
  const transactions = existingTransactions.filter((transaction) => {
    if (!transaction.tradeId) {
      return true;
    }

    return trades.some((trade) => trade.id === transaction.tradeId);
  });

  nextMap.forEach((snapshot, key) => {
    const previous = previousMap.get(key);
    const tradeExists = trades.some(
      (trade) => trade.accountId === snapshot.account.id && trade.holdingId === snapshot.holding.id,
    );
    const generatedTrades: HoldingTrade[] = [];

    if (!previous && !tradeExists) {
      generatedTrades.push(
        createTrade(
          snapshot,
          'buy',
          snapshot.holding.quantity,
          snapshot.holding.costBasis,
          snapshot.holding.costBasis,
          'sync',
        ),
      );
    }

    if (previous) {
      const quantityDelta = snapshot.holding.quantity - previous.holding.quantity;
      const epsilon = 1e-6;

      if (quantityDelta > epsilon) {
        generatedTrades.push(
          createTrade(
            snapshot,
            'buy',
            quantityDelta,
            snapshot.holding.costBasis,
            previous.holding.costBasis,
            'sync',
          ),
        );
      } else if (quantityDelta < -epsilon) {
        generatedTrades.push(
          createTrade(
            snapshot,
            'sell',
            Math.abs(quantityDelta),
            snapshot.holding.currentPrice,
            previous.holding.costBasis,
            'sync',
          ),
        );
      }
    }

    generatedTrades.forEach((trade) => {
      const transaction = createTradeTransaction(snapshot, trade);
      trade.transactionId = transaction.id;
      trades.push(trade);
      transactions.unshift(transaction);
    });
  });

  return {
    trades,
    transactions,
  };
}

export function updateTradeTransaction(
  transaction: Transaction,
  trade: HoldingTrade,
  accountName: string,
) {
  const isBuy = trade.tradeType === 'buy';
  const referenceCostBasis = trade.referenceCostBasis ?? trade.price;
  const realizedPnl = (trade.price - referenceCostBasis) * trade.quantity;

  return {
    ...transaction,
    title: isBuy
      ? `Buy ${trade.symbol}`
      : `${realizedPnl >= 0 ? 'Realized Gain' : 'Realized Loss'} ${trade.symbol}`,
    type: isBuy ? 'transfer' : realizedPnl >= 0 ? 'income' : 'expense',
    category: isBuy ? 'Transfer' : getCategoryForAssetClass(trade.assetClass),
    subCategory: isBuy ? `Buy ${trade.assetClass}` : `Realized ${trade.assetClass} P/L`,
    amount: isBuy ? trade.quantity * trade.price : Math.abs(realizedPnl),
    currency: trade.currency,
    date: trade.executedAt,
    note:
      trade.source === 'sync'
        ? isBuy
          ? 'Auto synced as an investment transfer from imported portfolio changes'
          : 'Auto synced as realized profit or loss from imported portfolio changes'
        : isBuy
          ? 'Manual investment transfer'
          : 'Manual realized profit or loss',
    account: accountName,
    accountId: trade.accountId,
    holdingId: trade.holdingId,
    assetKey: trade.assetKey,
    tradeId: trade.id,
    tradeType: trade.tradeType,
    isAuto: trade.source === 'sync',
  } satisfies Transaction;
}
