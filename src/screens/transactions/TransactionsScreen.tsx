import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TransactionRow } from '../../components/transactions/TransactionRow';
import { AppScreen } from '../../components/layout/AppScreen';
import { EmptyState } from '../../components/states/EmptyState';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { convertAmount } from '../../features/dashboard/selectors';
import type { AppTabScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { Transaction } from '../../types/models';
import {
  formatCurrency,
  formatMonthYear,
  formatTransactionDay,
  formatYear,
} from '../../utils/formatters';

type PeriodMode = 'month' | 'year';

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function shiftPeriod(date: Date, mode: PeriodMode, amount: number) {
  return mode === 'month'
    ? new Date(date.getFullYear(), date.getMonth() + amount, 1)
    : new Date(date.getFullYear() + amount, 0, 1);
}

function isInPeriod(dateLike: string, currentPeriod: Date, mode: PeriodMode) {
  const date = new Date(dateLike);

  if (mode === 'year') {
    return date.getFullYear() === currentPeriod.getFullYear();
  }

  return (
    date.getFullYear() === currentPeriod.getFullYear() &&
    date.getMonth() === currentPeriod.getMonth()
  );
}

function getLatestTransactionDate(transactions: Transaction[]) {
  if (transactions.length === 0) {
    return new Date();
  }

  return new Date(
    Math.max(...transactions.map((transaction) => new Date(transaction.date).getTime())),
  );
}

export function TransactionsScreen({
  navigation,
}: AppTabScreenProps<'Transactions'>) {
  const transactions = useDemoStore((state) => state.transactions);
  const user = useDemoStore((state) => state.user);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [selectedPeriod, setSelectedPeriod] = useState(() =>
    startOfMonth(getLatestTransactionDate(transactions)),
  );

  const periodTransactions = useMemo(
    () =>
      [...transactions]
        .filter((transaction) => isInPeriod(transaction.date, selectedPeriod, periodMode))
        .sort(
          (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
        ),
    [periodMode, selectedPeriod, transactions],
  );

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    periodTransactions.forEach((transaction) => {
      const key = formatTransactionDay(transaction.date);
      const current = groups.get(key) ?? [];
      current.push(transaction);
      groups.set(key, current);
    });

    return Array.from(groups.entries());
  }, [periodTransactions]);

  const incomeTotal = periodTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce(
      (sum, transaction) =>
        sum +
        convertAmount(transaction.amount, transaction.currency, user.baseCurrency, exchangeRates),
      0,
    );

  const spendingTotal = periodTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce(
      (sum, transaction) =>
        sum +
        convertAmount(transaction.amount, transaction.currency, user.baseCurrency, exchangeRates),
      0,
    );

  const netTotal = incomeTotal - spendingTotal;

  function goToPreviousPeriod() {
    setSelectedPeriod((current) => shiftPeriod(current, periodMode, -1));
  }

  function goToNextPeriod() {
    setSelectedPeriod((current) => shiftPeriod(current, periodMode, 1));
  }

  function togglePeriodMode() {
    setPeriodMode((current) => {
      const nextMode: PeriodMode = current === 'month' ? 'year' : 'month';
      setSelectedPeriod((previous) =>
        nextMode === 'year' ? startOfYear(previous) : startOfMonth(previous),
      );
      return nextMode;
    });
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 14,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -40) {
            goToNextPeriod();
          } else if (gestureState.dx >= 40) {
            goToPreviousPeriod();
          }
        },
      }),
    [periodMode],
  );

  return (
    <View style={styles.root}>
      <AppScreen contentStyle={styles.content}>
        <Text style={styles.title}>Transactions</Text>

        <SurfaceCard style={styles.periodCard}>
          <View style={styles.periodRow} {...panResponder.panHandlers}>
            <Pressable onPress={goToPreviousPeriod} style={styles.periodButton}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>

            <Pressable onPress={togglePeriodMode} style={styles.periodLabelWrap}>
              <Text style={styles.periodLabel}>
                {periodMode === 'month'
                  ? formatMonthYear(selectedPeriod.toISOString())
                  : formatYear(selectedPeriod.toISOString())}
              </Text>
              <Text style={styles.periodHint}>
                {periodMode === 'month' ? 'Tap to switch to year' : 'Tap to switch to month'}
              </Text>
            </Pressable>

            <Pressable onPress={goToNextPeriod} style={styles.periodButton}>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.summaryCard}>
          <View style={[styles.sideMetric, styles.sideMetricLeft]}>
            <Text style={styles.sideLabel}>Income</Text>
            <Text style={[styles.sideValue, styles.positive]}>
              {formatCurrency(incomeTotal, user.baseCurrency, 0)}
            </Text>
          </View>

          <View style={styles.netMetric}>
            <Text style={styles.netLabel}>Net</Text>
            <Text style={[styles.netValue, netTotal >= 0 ? styles.positive : styles.negative]}>
              {formatCurrency(netTotal, user.baseCurrency, 0)}
            </Text>
          </View>

          <View style={[styles.sideMetric, styles.sideMetricRight]}>
            <Text style={styles.sideLabel}>Spending</Text>
            <Text style={[styles.sideValue, styles.negative]}>
              {formatCurrency(spendingTotal, user.baseCurrency, 0)}
            </Text>
          </View>
        </SurfaceCard>

        {groupedTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Add your first income, expense, or transfer to start building the cash flow layer."
            actionLabel="Add Transaction"
            onAction={() => navigation.navigate('AddTransaction')}
          />
        ) : (
          groupedTransactions.map(([day, items]) => (
            <SurfaceCard key={day} style={styles.groupCard}>
              <Text style={styles.groupTitle}>{day}</Text>
              {items.map((transaction) => {
                const signedAmount =
                  transaction.type === 'expense' ? -transaction.amount : transaction.amount;
                const displayAmount = convertAmount(
                  signedAmount,
                  transaction.currency,
                  user.baseCurrency,
                  exchangeRates,
                );

                return (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    displayAmount={displayAmount}
                    baseCurrency={user.baseCurrency}
                  />
                );
              })}
            </SurfaceCard>
          ))
        )}
      </AppScreen>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddTransaction')}>
        <Ionicons name="add" size={24} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    color: colors.text,
  },
  periodCard: {
    gap: spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  periodLabelWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  periodLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
  },
  periodHint: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  sideMetric: {
    flex: 1,
    gap: spacing.xs,
  },
  sideMetricLeft: {
    alignItems: 'flex-start',
  },
  sideMetricRight: {
    alignItems: 'flex-end',
  },
  sideLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  sideValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
  },
  netMetric: {
    flex: 1.2,
    alignItems: 'center',
    gap: spacing.xs,
  },
  netLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  netValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  groupCard: {
    gap: spacing.xs,
  },
  groupTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
