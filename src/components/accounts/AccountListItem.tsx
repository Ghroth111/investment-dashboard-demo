import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { convertAmount, getAccountMetrics } from '../../features/dashboard/selectors';
import { colors, fontFamilies, spacing } from '../../theme';
import type { Account, CurrencyCode, ExchangeRates } from '../../types/models';
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatSignedCurrency,
} from '../../utils/formatters';
import { SurfaceCard } from '../ui/SurfaceCard';

interface AccountListItemProps {
  account: Account;
  baseCurrency: CurrencyCode;
  exchangeRates: ExchangeRates;
  onPress: () => void;
}

const typeLabels: Record<Account['type'], string> = {
  Brokerage: '券商',
  Fund: '基金',
  Crypto: '加密',
  Cash: '现金',
  Manual: '手动',
};

export function AccountListItem({
  account,
  baseCurrency,
  exchangeRates,
  onPress,
}: AccountListItemProps) {
  const metrics = getAccountMetrics(account);
  const totalValue = convertAmount(metrics.totalValue, account.currency, baseCurrency, exchangeRates);
  const todayChange = convertAmount(metrics.todayChange, account.currency, baseCurrency, exchangeRates);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <SurfaceCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.platform}>{account.currency} account</Text>
            <Text style={styles.name}>{account.name}</Text>
            <Text style={styles.subtitle}>
              {typeLabels[account.type]} · {account.holdings.length} 项资产 · {account.currency} ·{' '}
              {formatDateTime(account.updatedAt)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricLabel}>总资产</Text>
            <Text style={styles.metricValue}>{formatCurrency(totalValue, baseCurrency, 0)}</Text>
          </View>
          <View style={styles.metricRight}>
            <Text style={styles.metricLabel}>今日变动</Text>
            <Text style={[styles.metricChange, todayChange >= 0 ? styles.positive : styles.negative]}>
              {formatSignedCurrency(todayChange, baseCurrency, 0)}
            </Text>
            <Text style={styles.metricFootnote}>{formatPercent(metrics.cumulativeReturnRate)}</Text>
          </View>
        </View>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  platform: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.accent,
  },
  name: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  metricLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricChange: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
  },
  metricFootnote: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
