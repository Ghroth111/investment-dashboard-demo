import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { getTransactionCategoryIcon } from '../../features/transactions/config';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { CurrencyCode, Transaction } from '../../types/models';
import { formatCurrency, formatSignedCurrency, formatTime } from '../../utils/formatters';

interface TransactionRowProps {
  transaction: Transaction;
  displayAmount: number;
  baseCurrency: CurrencyCode;
}

export function TransactionRow({
  transaction,
  displayAmount,
  baseCurrency,
}: TransactionRowProps) {
  const positive = transaction.type === 'income';
  const transfer = transaction.type === 'transfer';

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconWrap,
          transfer ? styles.iconTransfer : positive ? styles.iconPositive : styles.iconNegative,
        ]}
      >
        <Ionicons
          name={getTransactionCategoryIcon(transaction.category)}
          size={18}
          color={transfer ? colors.info : positive ? colors.positive : colors.negative}
        />
      </View>

      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{transaction.title}</Text>
          {transaction.isAuto ? (
            <View style={styles.autoTag}>
              <Text style={styles.autoTagText}>Auto</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          {transaction.subCategory} · {transaction.account}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text
          style={[
            styles.amount,
            transfer ? styles.transfer : positive ? styles.positive : styles.negative,
          ]}
        >
          {transfer
            ? formatCurrency(Math.abs(displayAmount), baseCurrency, 0)
            : formatSignedCurrency(displayAmount, baseCurrency, 0)}
        </Text>
        <Text style={styles.time}>{formatTime(transaction.date)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPositive: {
    backgroundColor: colors.positiveSoft,
  },
  iconNegative: {
    backgroundColor: colors.negativeSoft,
  },
  iconTransfer: {
    backgroundColor: colors.infoSoft,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  autoTag: {
    minHeight: 20,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    justifyContent: 'center',
    backgroundColor: colors.infoSoft,
  },
  autoTagText: {
    fontFamily: fontFamilies.medium,
    fontSize: 10,
    color: colors.info,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  meta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amount: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
  },
  time: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
  transfer: {
    color: colors.info,
  },
});
