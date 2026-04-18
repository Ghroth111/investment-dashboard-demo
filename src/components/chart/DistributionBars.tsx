import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, spacing } from '../../theme';
import type { CurrencyCode, DistributionItem } from '../../types/models';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { SurfaceCard } from '../ui/SurfaceCard';

interface DistributionBarsProps {
  title: string;
  subtitle: string;
  items: DistributionItem[];
  currency: CurrencyCode;
}

export function DistributionBars({
  title,
  subtitle,
  items,
  currency,
}: DistributionBarsProps) {
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.items}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={styles.itemLabelWrap}>
                <View style={[styles.swatch, { backgroundColor: item.tone }]} />
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              <View style={styles.itemNumbers}>
                <Text style={styles.itemValue}>{formatCurrency(item.value, currency, 0)}</Text>
                <Text style={styles.itemPercent}>{formatPercent(item.percentage)}</Text>
              </View>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.max(item.percentage * 100, 6)}%`,
                    backgroundColor: item.tone,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 17,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  items: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  item: {
    gap: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  itemLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: colors.text,
  },
  itemNumbers: {
    alignItems: 'flex-end',
  },
  itemValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
    color: colors.text,
  },
  itemPercent: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  track: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});
