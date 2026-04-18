import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { CurrencyCode, DashboardSummary } from '../../types/models';
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatSignedCurrency,
} from '../../utils/formatters';

interface AssetSummaryCardProps {
  summary: DashboardSummary;
  currency: CurrencyCode;
}

export function AssetSummaryCard({ summary, currency }: AssetSummaryCardProps) {
  return (
    <LinearGradient
      colors={['#0E2948', '#1E4567']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>总资产</Text>
          <Text style={styles.value}>{formatCurrency(summary.totalAssets, currency, 0)}</Text>
        </View>
        <View style={styles.currencyBadge}>
          <Text style={styles.currencyText}>{currency}</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>今日盈亏</Text>
          <Text
            style={[
              styles.metricValue,
              summary.todayChange >= 0 ? styles.positive : styles.negative,
            ]}
          >
            {formatSignedCurrency(summary.todayChange, currency, 0)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>累计收益</Text>
          <Text
            style={[
              styles.metricValue,
              summary.cumulativeReturn >= 0 ? styles.positive : styles.negative,
            ]}
          >
            {formatSignedCurrency(summary.cumulativeReturn, currency, 0)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>收益率</Text>
          <Text style={styles.metricValue}>{formatPercent(summary.cumulativeReturnRate)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>最近更新</Text>
          <Text style={styles.metricValue}>{formatDateTime(summary.lastUpdated)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xl,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: spacing.sm,
  },
  value: {
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    lineHeight: 40,
    color: colors.white,
    letterSpacing: -0.6,
  },
  currencyBadge: {
    paddingHorizontal: spacing.md,
    minHeight: 34,
    borderRadius: radius.pill,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  currencyText: {
    fontFamily: fontFamilies.semibold,
    color: colors.white,
    fontSize: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  metricItem: {
    width: '50%',
    gap: spacing.xs,
  },
  metricLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  metricValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.white,
  },
  positive: {
    color: '#9BE4BF',
  },
  negative: {
    color: '#FFB5BA',
  },
});
