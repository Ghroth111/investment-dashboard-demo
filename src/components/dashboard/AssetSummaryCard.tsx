import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { CurrencyCode, DashboardSummary, TrendPoint } from '../../types/models';
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatSignedCurrency,
} from '../../utils/formatters';
import { Sparkline } from '../chart/Sparkline';

type SummaryRange = '1D' | '7D' | '30D' | '1Y';

interface AssetSummaryCardProps {
  summary: DashboardSummary;
  currency: CurrencyCode;
  trendSeries: Record<SummaryRange, TrendPoint[]>;
}

const rangeMeta: Record<SummaryRange, { label: string; shortLabel: string }> = {
  '1D': { label: '今日', shortLabel: '今日' },
  '7D': { label: '近 7 日', shortLabel: '7日' },
  '30D': { label: '近 30 日', shortLabel: '30日' },
  '1Y': { label: '近 1 年', shortLabel: '1年' },
};

export function AssetSummaryCard({
  summary,
  currency,
  trendSeries,
}: AssetSummaryCardProps) {
  const [range, setRange] = useState<SummaryRange>('7D');
  const [menuVisible, setMenuVisible] = useState(false);

  const chartPoints = useMemo(() => trendSeries[range] ?? [], [range, trendSeries]);

  return (
    <LinearGradient
      colors={['#0E2948', '#1E4567']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.summaryBlock}>
          <Text style={styles.eyebrow}>总资产</Text>
          <Text style={styles.value}>{formatCurrency(summary.totalAssets, currency, 0)}</Text>
        </View>

        <View style={styles.chartBlock}>
          <Pressable onPress={() => setMenuVisible((visible) => !visible)} style={styles.rangeTrigger}>
            <Text style={styles.rangeTriggerText}>{rangeMeta[range].label}</Text>
          </Pressable>

          <View style={styles.sparklineWrap}>
            <Sparkline points={chartPoints} width={152} height={64} strokeColor="#9BE4BF" />
          </View>

          {menuVisible ? (
            <View style={styles.menu}>
              {(Object.keys(rangeMeta) as SummaryRange[]).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    setRange(option);
                    setMenuVisible(false);
                  }}
                  style={[styles.menuItem, option === range ? styles.menuItemActive : null]}
                >
                  <Text style={[styles.menuText, option === range ? styles.menuTextActive : null]}>
                    {rangeMeta[option].shortLabel}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
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
    gap: spacing.lg,
  },
  summaryBlock: {
    flex: 1,
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
  chartBlock: {
    width: 160,
    alignItems: 'flex-end',
    position: 'relative',
  },
  rangeTrigger: {
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginBottom: spacing.sm,
  },
  rangeTriggerText: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.white,
  },
  sparklineWrap: {
    width: '100%',
    height: 68,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    top: 34,
    right: 0,
    width: 80,
    borderRadius: radius.md,
    padding: spacing.xs,
    backgroundColor: '#244765',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 10,
  },
  menuItem: {
    minHeight: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  menuText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  menuTextActive: {
    color: colors.white,
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
