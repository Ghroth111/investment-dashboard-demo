import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AggregatedAssetItem, AssetGroupSection } from '../../features/assets/selectors';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { CurrencyCode } from '../../types/models';
import { formatCurrency, formatPercent, formatSignedCurrency } from '../../utils/formatters';

interface MergedHoldingListCardProps {
  sections: AssetGroupSection[];
  currency: CurrencyCode;
  onAssetPress: (assetKey: string) => void;
}

const logoPalettes = [
  { background: '#D73B2D', text: '#FFFFFF' },
  { background: '#2563EB', text: '#FFFFFF' },
  { background: '#8ABF34', text: '#FFFFFF' },
  { background: '#7C3AED', text: '#FFFFFF' },
  { background: '#0F766E', text: '#FFFFFF' },
  { background: '#64748B', text: '#FFFFFF' },
];

const companyNameOverrides: Record<string, string> = {
  AMD: 'AMD',
  MSFT: 'Microsoft',
  INTC: 'Intel',
  UNH: 'UnitedHealth',
  AAPL: 'Apple',
  NVDA: 'NVIDIA',
  TSLA: 'Tesla',
  SPY: 'SPDR S&P 500 ETF',
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
};

function getLogoPalette(asset: AggregatedAssetItem) {
  const seed = `${asset.symbol}${asset.name}`
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return logoPalettes[seed % logoPalettes.length];
}

function getSymbolMark(asset: AggregatedAssetItem) {
  const symbol = asset.symbol.trim().toUpperCase();

  if (symbol.length >= 2) {
    return symbol.slice(0, 2);
  }

  if (symbol.length === 1) {
    return symbol;
  }

  return asset.name.trim().slice(0, 1).toUpperCase();
}

function getDisplayName(asset: AggregatedAssetItem) {
  const symbol = asset.symbol.trim().toUpperCase();
  const normalizedName = asset.name.trim();

  if (companyNameOverrides[symbol]) {
    return companyNameOverrides[symbol];
  }

  if (/[\u3400-\u9FFF]/.test(normalizedName)) {
    return symbol || 'Holding';
  }

  return normalizedName || symbol || 'Holding';
}

function formatShares(quantity: number) {
  if (quantity % 1 === 0) {
    return `${quantity}`;
  }

  return `${quantity.toFixed(2)}`;
}

function formatAllocationPercent(value: number) {
  return `${Math.max(0, value * 100).toFixed(2)}%`;
}

export function MergedHoldingListCard({
  sections,
  currency,
  onAssetPress,
}: MergedHoldingListCardProps) {
  const allAssets = sections
    .flatMap((section) => section.items)
    .sort((left, right) => right.marketValue - left.marketValue);
  const totalMarketValue = allAssets.reduce((sum, asset) => sum + asset.marketValue, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Portfolio</Text>
          <Text style={styles.title}>Holdings</Text>
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.headerValue}>{allAssets.length} Items</Text>
          <Text style={styles.headerHint}>Sorted by market value</Text>
        </View>
      </View>

      <View style={styles.list}>
        {allAssets.map((asset) => {
          const displayName = getDisplayName(asset);
          const isPositive = asset.pnl >= 0;
          const palette = getLogoPalette(asset);
          const allocation = totalMarketValue === 0 ? 0 : asset.marketValue / totalMarketValue;

          return (
            <Pressable
              key={asset.assetKey}
              onPress={() => onAssetPress(asset.assetKey)}
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            >
              <View style={styles.topRow}>
                <View style={[styles.logoBadge, { backgroundColor: palette.background }]}>
                  <Text style={[styles.logoText, { color: palette.text }]}>{getSymbolMark(asset)}</Text>
                </View>

                <View style={styles.mainColumn}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.codeText} numberOfLines={1}>
                    {asset.symbol} / {formatShares(asset.quantity)}
                  </Text>
                  <View style={styles.priceStack}>
                    <Text style={styles.priceLine} numberOfLines={1}>
                      Price {formatCurrency(asset.currentPrice, currency, 2)}
                    </Text>
                    <Text style={styles.priceLine} numberOfLines={1}>
                      Cost {formatCurrency(asset.costBasis, currency, 2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.rightColumn}>
                  <View style={styles.allocationTag}>
                    <Text style={styles.allocationText}>
                      {formatAllocationPercent(allocation)}
                    </Text>
                  </View>
                  <Text style={styles.marketValueText} numberOfLines={1} adjustsFontSizeToFit>
                    {formatCurrency(asset.marketValue, currency, 2)}
                  </Text>
                </View>
              </View>

              <View style={styles.returnRow}>
                <Text style={[styles.pnlAmount, isPositive ? styles.positive : styles.negative]} numberOfLines={1}>
                  {formatSignedCurrency(asset.pnl, currency, 2)}
                </Text>
                <Text style={[styles.pnlRate, isPositive ? styles.positive : styles.negative]} numberOfLines={1}>
                  {formatPercent(asset.pnlRate)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#7C8CA1',
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 28,
    lineHeight: 34,
    color: '#12243C',
  },
  headerMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  headerValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: '#12243C',
  },
  headerHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    borderWidth: 1,
    borderColor: '#E5ECF4',
    borderRadius: 26,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: '#10233B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 2,
  },
  rowPressed: {
    opacity: 0.82,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
    shadowColor: '#10233B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  logoText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12,
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nameText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: '#12243C',
  },
  codeText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 17,
    color: '#7586A3',
  },
  priceLine: {
    fontFamily: fontFamilies.regular,
    fontSize: 10,
    lineHeight: 13,
    color: '#7586A3',
  },
  priceStack: {
    gap: 1,
  },
  rightColumn: {
    width: 134,
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  allocationTag: {
    minHeight: 28,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.positiveSoft,
  },
  allocationText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.positive,
  },
  marketValueText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 24,
    lineHeight: 33,
    color: '#0D1F39',
    textAlign: 'right',
  },
  returnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E8EEF5',
  },
  pnlAmount: {
    flex: 1,
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  pnlRate: {
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 18,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
