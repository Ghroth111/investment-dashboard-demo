import { Pressable, StyleSheet, Text, View } from 'react-native';

import { convertAmount, getAccountMetrics } from '../../features/dashboard/selectors';
import { colors, fontFamilies, spacing } from '../../theme';
import type { Account, CurrencyCode, ExchangeRates } from '../../types/models';
import { formatCurrency, formatSignedCurrency } from '../../utils/formatters';
import { SurfaceCard } from '../ui/SurfaceCard';

interface CompactAccountCardProps {
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

export function CompactAccountCard({
  account,
  baseCurrency,
  exchangeRates,
  onPress,
}: CompactAccountCardProps) {
  const metrics = getAccountMetrics(account);
  const totalValue = convertAmount(metrics.totalValue, account.currency, baseCurrency, exchangeRates);
  const todayChange = convertAmount(metrics.todayChange, account.currency, baseCurrency, exchangeRates);

  return (
    <Pressable
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressablePressed : null]}
      onPress={onPress}
    >
      <SurfaceCard style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.platform} numberOfLines={1}>
            {account.platform}
          </Text>
          <Text style={styles.type}>{typeLabels[account.type]}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {account.name}
        </Text>
        <Text style={styles.total}>{formatCurrency(totalValue, baseCurrency, 0)}</Text>
        <Text style={[styles.change, todayChange >= 0 ? styles.positive : styles.negative]}>
          {formatSignedCurrency(todayChange, baseCurrency, 0)}
        </Text>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '48.5%',
  },
  pressablePressed: {
    opacity: 0.92,
  },
  card: {
    gap: spacing.sm,
    minHeight: 132,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  platform: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.accent,
  },
  type: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  name: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.text,
  },
  total: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    color: colors.text,
    letterSpacing: -0.2,
  },
  change: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
