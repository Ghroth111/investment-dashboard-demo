import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AssetGroupSection } from '../../features/assets/selectors';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { CurrencyCode } from '../../types/models';
import { formatCurrency, formatPercent, formatSignedCurrency } from '../../utils/formatters';
import { SurfaceCard } from '../ui/SurfaceCard';

interface MergedHoldingListCardProps {
  sections: AssetGroupSection[];
  currency: CurrencyCode;
  onAssetPress: (assetKey: string) => void;
}

export function MergedHoldingListCard({
  sections,
  currency,
  onAssetPress,
}: MergedHoldingListCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Merged Holdings</Text>
          <Text style={styles.description}>
            Combined positions across accounts, grouped by asset type and sorted by size.
          </Text>
        </View>
      </View>

      <View style={styles.sectionList}>
        {sections.map((section) => (
          <View key={section.assetClass} style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionValue}>{formatCurrency(section.totalValue, currency, 0)}</Text>
            </View>

            <View style={styles.rowList}>
              {section.items.map((asset) => (
                <Pressable
                  key={asset.assetKey}
                  onPress={() => onAssetPress(asset.assetKey)}
                  style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
                >
                  <View style={styles.rowAvatar}>
                    <Text style={styles.rowAvatarText}>{asset.symbol.slice(0, 4)}</Text>
                  </View>

                  <View style={styles.rowMain}>
                    <Text style={styles.rowName}>{asset.name}</Text>
                    <Text style={styles.rowMeta}>
                      {asset.symbol} · {asset.accountCount} account{asset.accountCount > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {asset.positions.map((position) => position.accountName).join(' / ')}
                    </Text>
                  </View>

                  <View style={styles.rowRight}>
                    <Text style={styles.rowValue}>{formatCurrency(asset.marketValue, currency, 0)}</Text>
                    <Text style={[styles.rowPnl, asset.pnl >= 0 ? styles.positive : styles.negative]}>
                      {formatSignedCurrency(asset.pnl, currency, 0)} · {formatPercent(asset.pnlRate)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  description: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  sectionList: {
    gap: spacing.lg,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  sectionValue: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  rowList: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowPressed: {
    opacity: 0.9,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  rowAvatarText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
    color: colors.primary,
  },
  rowMain: {
    flex: 1,
    gap: spacing.xs,
  },
  rowName: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  rowMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  rowValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.text,
  },
  rowPnl: {
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
