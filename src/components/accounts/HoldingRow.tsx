import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { convertAmount } from '../../features/dashboard/selectors';
import { colors, fontFamilies, spacing } from '../../theme';
import type { CurrencyCode, ExchangeRates, Holding } from '../../types/models';
import { formatCurrency, formatPercent, formatSignedCurrency } from '../../utils/formatters';

interface HoldingRowProps {
  holding: Holding;
  baseCurrency: CurrencyCode;
  exchangeRates: ExchangeRates;
  onPress?: () => void;
}

export function HoldingRow({
  holding,
  baseCurrency,
  exchangeRates,
  onPress,
}: HoldingRowProps) {
  const marketValue = holding.currentPrice * holding.quantity;
  const costValue = holding.costBasis * holding.quantity;
  const pnl = marketValue - costValue;
  const pnlRate = costValue === 0 ? 0 : pnl / costValue;
  const convertedMarketValue = convertAmount(
    marketValue,
    holding.currency,
    baseCurrency,
    exchangeRates,
  );
  const convertedCurrentPrice = convertAmount(
    holding.currentPrice,
    holding.currency,
    baseCurrency,
    exchangeRates,
  );
  const convertedCostBasis = convertAmount(
    holding.costBasis,
    holding.currency,
    baseCurrency,
    exchangeRates,
  );
  const convertedPnl = convertAmount(pnl, holding.currency, baseCurrency, exchangeRates);

  const Container = onPress ? Pressable : View;

  return (
    <Container
      {...(onPress
        ? {
            onPress,
            style: ({ pressed }: { pressed: boolean }) => [
              styles.row,
              pressed ? styles.rowPressed : null,
            ],
          }
        : { style: styles.row })}
    >
      <View style={styles.left}>
        <Text style={styles.name}>{holding.name}</Text>
        <Text style={styles.meta}>
          {holding.symbol} · {holding.assetClass}
        </Text>
        <Text style={styles.meta}>Qty {holding.quantity}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.value}>{formatCurrency(convertedMarketValue, baseCurrency, 0)}</Text>
        <Text style={styles.meta}>
          Price {formatCurrency(convertedCurrentPrice, baseCurrency, 2)} · Cost{' '}
          {formatCurrency(convertedCostBasis, baseCurrency, 2)}
        </Text>
        <View style={styles.pnlRow}>
          <Text style={[styles.pnl, convertedPnl >= 0 ? styles.positive : styles.negative]}>
            {formatSignedCurrency(convertedPnl, baseCurrency, 0)} · {formatPercent(pnlRate)}
          </Text>
          {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowPressed: {
    opacity: 0.9,
  },
  left: {
    flex: 1,
    gap: spacing.xs,
  },
  right: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  name: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  meta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'right',
  },
  value: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pnl: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
