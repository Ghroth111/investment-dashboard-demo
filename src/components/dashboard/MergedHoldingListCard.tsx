import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AggregatedAssetItem, AssetGroupSection } from '../../features/assets/selectors';
import { colors, fontFamilies, spacing } from '../../theme';
import type { CurrencyCode } from '../../types/models';
import { formatCurrency, formatPercent, formatSignedCurrency } from '../../utils/formatters';

interface MergedHoldingListCardProps {
  sections: AssetGroupSection[];
  currency: CurrencyCode;
  onAssetPress: (assetKey: string) => void;
}

const logoPalettes = [
  { background: '#D73B2D', text: '#FFFFFF' },
  { background: '#8ABF34', text: '#FFFFFF' },
  { background: '#F59E0B', text: '#FFFFFF' },
  { background: '#2563EB', text: '#FFFFFF' },
  { background: '#0F766E', text: '#FFFFFF' },
  { background: '#7C3AED', text: '#FFFFFF' },
];

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

function formatShares(quantity: number) {
  if (quantity % 1 === 0) {
    return `${quantity}`;
  }

  return `${quantity.toFixed(2)}`;
}

export function MergedHoldingListCard({
  sections,
  currency,
  onAssetPress,
}: MergedHoldingListCardProps) {
  const allAssets = sections.flatMap((section) => section.items);
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

      {allAssets.map((asset) => {
        const weight = totalMarketValue > 0 ? asset.marketValue / totalMarketValue : 0;
        const isPositive = asset.pnl >= 0;
        const palette = getLogoPalette(asset);

        return (
          <Pressable
            key={asset.assetKey}
            onPress={() => onAssetPress(asset.assetKey)}
            style={({ pressed }) => [
              styles.row,
              pressed ? styles.rowPressed : null,
              asset !== allAssets[allAssets.length - 1] ? styles.rowBorder : null,
            ]}
          >
            <View style={styles.content}>
              <View style={styles.topRow}>
                <View style={[styles.logoBadge, { backgroundColor: palette.background }]}>
                  <Text style={[styles.logoText, { color: palette.text }]}>{getSymbolMark(asset)}</Text>
                </View>

                <View style={styles.identityBlock}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {asset.name}
                  </Text>
                  <Text style={styles.codeText} numberOfLines={1}>
                    {asset.symbol}
                  </Text>
                </View>

                <View style={styles.weightTag}>
                  <Text style={styles.weightText}>{formatPercent(weight)}</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.pnlBlock}>
                  <Text style={[styles.pnlAmount, isPositive ? styles.positive : styles.negative]}>
                    {formatSignedCurrency(asset.pnl, currency, 2)}
                  </Text>
                  <Text style={[styles.pnlRate, isPositive ? styles.positive : styles.negative]}>
                    {formatPercent(asset.pnlRate)}
                  </Text>
                </View>

                <View style={styles.valueBlock}>
                  <Text style={styles.marketValueText}>
                    {formatCurrency(asset.marketValue, currency, 2)}
                  </Text>
                  <Text style={styles.quantityText}>{formatShares(asset.quantity)}</Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <View style={styles.footerMetric}>
                  <Text style={styles.footerLabel}>Price</Text>
                  <Text style={styles.footerValue}>{formatCurrency(asset.currentPrice, currency, 2)}</Text>
                </View>

                <View style={styles.footerDivider} />

                <View style={styles.footerMetric}>
                  <Text style={styles.footerLabel}>Cost</Text>
                  <Text style={styles.footerValue}>{formatCurrency(asset.costBasis, currency, 2)}</Text>
                </View>

                <View style={styles.footerDivider} />

                <View style={styles.footerMetricGrow}>
                  <Text style={styles.footerLabel}>Accounts</Text>
                  <Text style={styles.footerValue} numberOfLines={1}>
                    {asset.accountCount}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  eyebrow: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    letterSpacing: 1.2,
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
  row: {
    paddingVertical: spacing.lg,
  },
  rowPressed: {
    opacity: 0.78,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBF3',
  },
  content: {
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10233B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2,
  },
  logoText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 17,
    letterSpacing: 0.6,
  },
  identityBlock: {
    flex: 1,
    gap: 2,
  },
  nameText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 20,
    lineHeight: 24,
    color: '#17293F',
  },
  codeText: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 20,
    color: '#8997AB',
  },
  weightTag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F4F7FB',
  },
  weightText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: '#6D7C91',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  pnlBlock: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  valueBlock: {
    minWidth: 140,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  pnlAmount: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  pnlRate: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  marketValueText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 28,
    lineHeight: 34,
    color: '#17293F',
    textAlign: 'right',
  },
  quantityText: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 22,
    color: '#90A0B4',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#EEF3F8',
    paddingTop: spacing.md,
  },
  footerMetric: {
    gap: 4,
  },
  footerMetricGrow: {
    flex: 1,
    gap: 4,
  },
  footerLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#97A5B8',
  },
  footerValue: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#506076',
  },
  footerDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#EEF3F8',
  },
  positive: {
    color: '#EC5B5A',
  },
  negative: {
    color: '#4AAA74',
  },
});
