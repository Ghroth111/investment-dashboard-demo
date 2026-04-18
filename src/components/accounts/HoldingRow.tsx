import { StyleSheet, Text, View } from 'react-native';

import { convertAmount } from '../../features/dashboard/selectors';
import { colors, fontFamilies, spacing } from '../../theme';
import type { CurrencyCode, ExchangeRates, Holding } from '../../types/models';
import { formatCurrency, formatPercent, formatSignedCurrency } from '../../utils/formatters';

interface HoldingRowProps {
  holding: Holding;
  baseCurrency: CurrencyCode;
  exchangeRates: ExchangeRates;
}

export function HoldingRow({ holding, baseCurrency, exchangeRates }: HoldingRowProps) {
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
  const convertedCostValue = convertAmount(costValue, holding.currency, baseCurrency, exchangeRates);
  const convertedPnl = convertAmount(pnl, holding.currency, baseCurrency, exchangeRates);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.name}>{holding.name}</Text>
        <Text style={styles.meta}>
          {holding.symbol} · {holding.assetClass} · {holding.quantity}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.value}>{formatCurrency(convertedMarketValue, baseCurrency, 0)}</Text>
        <Text style={styles.meta}>
          现价 {formatCurrency(convertedCurrentPrice, baseCurrency, 2)} · 成本{' '}
          {formatCurrency(convertedCostValue, baseCurrency, 0)}
        </Text>
        <Text style={[styles.pnl, convertedPnl >= 0 ? styles.positive : styles.negative]}>
          {formatSignedCurrency(convertedPnl, baseCurrency, 0)} · {formatPercent(pnlRate)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  left: {
    flex: 1,
    gap: spacing.xs,
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  name: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  meta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  value: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
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
