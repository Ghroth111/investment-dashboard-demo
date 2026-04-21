import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, spacing } from '../../theme';
import type { CurrencyCode, DistributionItem } from '../../types/models';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { SurfaceCard } from '../ui/SurfaceCard';

interface DistributionBarsProps {
  title: string;
  subtitle: string;
  items: DistributionItem[];
  currency: CurrencyCode;
  onItemPress?: (item: DistributionItem) => void;
}

export function DistributionBars({
  title,
  subtitle,
  items,
  currency,
  onItemPress,
}: DistributionBarsProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onItemPress ? <Text style={styles.headerHint}>查看明细</Text> : null}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.items}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            disabled={!onItemPress}
            onPress={() => onItemPress?.(item)}
            style={({ pressed }) => [
              styles.item,
              onItemPress ? styles.itemInteractive : null,
              pressed && onItemPress ? styles.itemPressed : null,
            ]}
          >
            <View style={styles.itemTopRow}>
              <View style={styles.itemMain}>
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
              {onItemPress ? (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 17,
    color: colors.text,
  },
  headerHint: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.accent,
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
  itemInteractive: {
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
  },
  itemPressed: {
    opacity: 0.9,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemMain: {
    flex: 1,
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
    flex: 1,
    paddingRight: spacing.sm,
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
    flexShrink: 0,
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
