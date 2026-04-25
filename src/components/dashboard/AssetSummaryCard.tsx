import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Line,
  Path,
  Stop,
} from 'react-native-svg';

import { convertAmount, getAccountMetrics } from '../../features/dashboard/selectors';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type {
  Account,
  AccountType,
  CurrencyCode,
  ExchangeRates,
  TrendPoint,
  PerformancePoint,
  PerformanceRange,
  PerformanceSeries,
} from '../../types/models';
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatSignedCurrency,
} from '../../utils/formatters';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SegmentKey = 'overview' | AccountType;

interface AssetSummaryCardProps {
  accounts: Account[];
  currency: CurrencyCode;
  exchangeRates: ExchangeRates;
  portfolioHistory: Record<string, TrendPoint[]>;
  onAnalyticsPress: () => void;
}

interface CategorySegment {
  key: SegmentKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  totalAssets: number;
  cumulativeReturn: number;
  cumulativeReturnRate: number;
  todayChange: number;
  lastUpdated: string;
  series: PerformanceSeries;
}

interface AnimatedMetrics {
  totalAssets: number;
  cumulativeReturn: number;
  cumulativeReturnRate: number;
  todayChange: number;
  rangeChange: number;
  rangeChangeRate: number;
}

const chartHeight = 224;
const chartInsetX = 8;
const chartInsetTop = 10;
const chartInsetBottom = 20;

const rangeOptions: Array<{ value: PerformanceRange; label: string; summaryLabel: string }> = [
  { value: '7D', label: '7D', summaryLabel: '近 7 日收益' },
  { value: '1M', label: '1M', summaryLabel: '近 1 月收益' },
  { value: '6M', label: '6M', summaryLabel: '近 6 月收益' },
  { value: 'YTD', label: 'YTD', summaryLabel: '年初至今收益' },
  { value: '1Y', label: '1Y', summaryLabel: '近 1 年收益' },
  { value: 'ALL', label: 'ALL', summaryLabel: '全部周期收益' },
];

const categoryMeta: Record<
  SegmentKey,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    accentColor: string;
  }
> = {
  overview: { label: '总览', icon: 'grid-outline', accentColor: '#7DE6D8' },
  Brokerage: { label: '券商', icon: 'stats-chart-outline', accentColor: '#89D5FF' },
  Fund: { label: '基金', icon: 'pie-chart-outline', accentColor: '#A4E7C2' },
  Crypto: { label: '加密', icon: 'logo-bitcoin', accentColor: '#70D4FF' },
  Cash: { label: '现金', icon: 'wallet-outline', accentColor: '#B0E7D4' },
  Manual: { label: '手动', icon: 'create-outline', accentColor: '#B5CFF1' },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHistoryTimestamp(timestamp?: string) {
  if (!timestamp) {
    return new Date().toISOString();
  }

  const parsed = new Date(timestamp);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  const dateOnly = new Date(`${timestamp}T00:00:00.000Z`);
  if (!Number.isNaN(dateOnly.getTime())) {
    return dateOnly.toISOString();
  }

  return new Date().toISOString();
}

function formatSummaryDate(timestamp: string, range: PerformanceRange) {
  const date = new Date(timestamp);

  if (range === '7D') {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  if (range === 'ALL') {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getAggregateMetrics(
  accounts: Account[],
  baseCurrency: CurrencyCode,
  rates: ExchangeRates,
) {
  return accounts.reduce(
    (accumulator, account) => {
      const metrics = getAccountMetrics(account);

      accumulator.totalAssets += convertAmount(
        metrics.totalValue,
        account.currency,
        baseCurrency,
        rates,
      );
      accumulator.cumulativeReturn += convertAmount(
        metrics.cumulativeReturn,
        account.currency,
        baseCurrency,
        rates,
      );
      accumulator.costBase += convertAmount(
        metrics.totalValue - metrics.cumulativeReturn,
        account.currency,
        baseCurrency,
        rates,
      );
      accumulator.todayChange += convertAmount(
        metrics.todayChange,
        account.currency,
        baseCurrency,
        rates,
      );
      accumulator.lastUpdated =
        new Date(account.updatedAt) > new Date(accumulator.lastUpdated)
          ? account.updatedAt
          : accumulator.lastUpdated;

      return accumulator;
    },
    {
      totalAssets: 0,
      cumulativeReturn: 0,
      costBase: 0,
      todayChange: 0,
      lastUpdated: accounts[0]?.updatedAt ?? new Date().toISOString(),
    },
  );
}

function mapHistoryRange(range: PerformanceRange) {
  switch (range) {
    case '1M':
      return '30D';
    case '6M':
      return '90D';
    default:
      return range;
  }
}

function buildOverviewPerformanceSeries(
  portfolioHistory: Record<string, TrendPoint[]>,
  currency: CurrencyCode,
  rates: ExchangeRates,
) {
  const emptySeries: PerformanceSeries = {
    '7D': [],
    '1M': [],
    '6M': [],
    YTD: [],
    '1Y': [],
    ALL: [],
  };

  (Object.keys(emptySeries) as PerformanceRange[]).forEach((range) => {
    const historyRange = mapHistoryRange(range);
    const points = portfolioHistory[historyRange] ?? [];
    const firstPoint = points[0];

    emptySeries[range] = points.map((point) => {
      const value = convertAmount(point.valueUsd, 'USD', currency, rates);
      const baseValue = convertAmount(firstPoint?.valueUsd ?? point.valueUsd, 'USD', currency, rates);
      const gain = value - baseValue;

      return {
        timestamp: normalizeHistoryTimestamp(point.timestamp),
        value,
        gain,
        gainRate: baseValue === 0 ? 0 : gain / baseValue,
      };
    });
  });

  return emptySeries;
}

function buildCategorySegments(
  accounts: Account[],
  currency: CurrencyCode,
  exchangeRates: ExchangeRates,
  portfolioHistory: Record<string, TrendPoint[]>,
) {
  const groupedAccounts = accounts.reduce<Record<AccountType, Account[]>>(
    (accumulator, account) => {
      accumulator[account.type] = [...(accumulator[account.type] ?? []), account];
      return accumulator;
    },
    {
      Brokerage: [],
      Fund: [],
      Crypto: [],
      Cash: [],
      Manual: [],
    },
  );

  const overviewMetrics = getAggregateMetrics(accounts, currency, exchangeRates);
  const orderedTypes: AccountType[] = ['Brokerage', 'Fund', 'Crypto', 'Cash', 'Manual'];

  const segments: CategorySegment[] = [
    {
      key: 'overview',
      ...categoryMeta.overview,
      totalAssets: overviewMetrics.totalAssets,
      cumulativeReturn: overviewMetrics.cumulativeReturn,
      cumulativeReturnRate:
        overviewMetrics.costBase === 0
          ? 0
          : overviewMetrics.cumulativeReturn / overviewMetrics.costBase,
      todayChange: overviewMetrics.todayChange,
      lastUpdated: overviewMetrics.lastUpdated,
      series: buildOverviewPerformanceSeries(portfolioHistory, currency, exchangeRates),
    },
  ];

  orderedTypes.forEach((type) => {
    const bucket = groupedAccounts[type];
    if (!bucket.length) {
      return;
    }

    const metrics = getAggregateMetrics(bucket, currency, exchangeRates);

    segments.push({
      key: type,
      ...categoryMeta[type],
      totalAssets: metrics.totalAssets,
      cumulativeReturn: metrics.cumulativeReturn,
      cumulativeReturnRate: metrics.costBase === 0 ? 0 : metrics.cumulativeReturn / metrics.costBase,
      todayChange: metrics.todayChange,
      lastUpdated: metrics.lastUpdated,
      series: {
        '7D': [],
        '1M': [],
        '6M': [],
        YTD: [],
        '1Y': [],
        ALL: [],
      },
    });
  });

  return segments;
}

function getRangeChange(points: PerformancePoint[]) {
  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (!firstPoint || !lastPoint) {
    return { amount: 0, rate: 0 };
  }

  const amount = lastPoint.value - firstPoint.value;

  return {
    amount,
    rate: firstPoint.value === 0 ? 0 : amount / firstPoint.value,
  };
}

export function AssetSummaryCard({
  accounts,
  currency,
  exchangeRates,
  portfolioHistory,
  onAnalyticsPress,
}: AssetSummaryCardProps) {
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<PerformanceRange>('YTD');
  const [activeSegmentKey, setActiveSegmentKey] = useState<SegmentKey>('overview');
  const [scrubbing, setScrubbing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartWidth, setChartWidth] = useState(0);
  const [animatedMetrics, setAnimatedMetrics] = useState<AnimatedMetrics>({
    totalAssets: 0,
    cumulativeReturn: 0,
    cumulativeReturnRate: 0,
    todayChange: 0,
    rangeChange: 0,
    rangeChangeRate: 0,
  });
  const revealProgress = useRef(new Animated.Value(1)).current;
  const countUpProgress = useRef(new Animated.Value(0)).current;

  const segments = useMemo(
    () => buildCategorySegments(accounts, currency, exchangeRates, portfolioHistory),
    [accounts, currency, exchangeRates, portfolioHistory],
  );
  const activeSegment =
    segments.find((segment) => segment.key === activeSegmentKey) ?? segments[0] ?? null;
  const points = activeSegment?.series[range] ?? [];
  const lastPoint = points.at(-1) ?? null;
  const rangeChange = useMemo(() => getRangeChange(points), [points]);
  const hasSufficientHistory = points.length >= 2;

  useEffect(() => {
    setActiveIndex(Math.max(points.length - 1, 0));
    setScrubbing(false);
  }, [points.length, range]);

  useEffect(() => {
    if (!activeSegment || !lastPoint) {
      return;
    }

    const listenerId = countUpProgress.addListener(({ value }) => {
      setAnimatedMetrics({
        totalAssets: lastPoint.value * value,
        cumulativeReturn: lastPoint.gain * value,
        cumulativeReturnRate: lastPoint.gainRate * value,
        todayChange: activeSegment.todayChange * value,
        rangeChange: rangeChange.amount * value,
        rangeChangeRate: rangeChange.rate * value,
      });
    });

    countUpProgress.stopAnimation();
    countUpProgress.setValue(0);
    revealProgress.stopAnimation();
    revealProgress.setValue(0);

    Animated.parallel([
      Animated.timing(countUpProgress, {
        toValue: 1,
        duration: 720,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(revealProgress, {
        toValue: 1,
        duration: 640,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    return () => {
      countUpProgress.removeListener(listenerId);
    };
  }, [activeSegment, countUpProgress, lastPoint, rangeChange, revealProgress]);

  const normalized = useMemo(() => {
    if (!chartWidth || points.length === 0) {
      return [];
    }

    const min = Math.min(...points.map((point) => point.value));
    const max = Math.max(...points.map((point) => point.value));
    const drawableWidth = Math.max(chartWidth - chartInsetX * 2, 1);
    const drawableHeight = chartHeight - chartInsetTop - chartInsetBottom;

    return points.map((point, index) => {
      const progress = points.length === 1 ? 1 : index / (points.length - 1);
      const x = chartInsetX + drawableWidth * progress;
      const y =
        chartHeight -
        chartInsetBottom -
        ((point.value - min) / Math.max(max - min, 1)) * drawableHeight;

      return {
        ...point,
        x,
        y,
      };
    });
  }, [chartWidth, points]);

  const linePath = useMemo(() => {
    if (normalized.length === 0) {
      return '';
    }

    return normalized
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  }, [normalized]);

  const areaPath = useMemo(() => {
    if (normalized.length === 0) {
      return '';
    }

    return `${linePath} L ${normalized[normalized.length - 1].x} ${chartHeight - chartInsetBottom} L ${
      normalized[0].x
    } ${chartHeight - chartInsetBottom} Z`;
  }, [linePath, normalized]);

  const displayedIndex = Math.min(activeIndex, Math.max(normalized.length - 1, 0));
  const activeCoordinates = normalized[displayedIndex];
  const activePoint = points[displayedIndex] ?? lastPoint;
  const activeRangeMeta =
    rangeOptions.find((option) => option.value === range) ?? rangeOptions[0];
  const animatedChartWidth = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, chartWidth || Math.max(width - 92, 248)],
  });
  const floatingDateWidth = 136;
  const floatingDateLeft = activeCoordinates
    ? clamp(activeCoordinates.x - floatingDateWidth / 2, 0, Math.max(chartWidth - floatingDateWidth, 0))
    : 0;

  function updateActiveIndex(event: GestureResponderEvent) {
    if (!normalized.length || chartWidth <= 0) {
      return;
    }

    const locationX = event.nativeEvent.locationX;
    const nextIndex = Math.round(
      ((locationX - chartInsetX) / Math.max(chartWidth - chartInsetX * 2, 1)) * (normalized.length - 1),
    );

    setActiveIndex(Math.max(0, Math.min(normalized.length - 1, nextIndex)));
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setScrubbing(true);
          updateActiveIndex(event);
        },
        onPanResponderMove: (event) => {
          updateActiveIndex(event);
        },
        onPanResponderRelease: () => {
          setScrubbing(false);
          setActiveIndex(Math.max(points.length - 1, 0));
        },
        onPanResponderTerminate: () => {
          setScrubbing(false);
          setActiveIndex(Math.max(points.length - 1, 0));
        },
      }),
    [chartWidth, normalized.length, points.length],
  );

  const handleSegmentChange = (nextKey: SegmentKey) => {
    if (nextKey === activeSegmentKey) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSegmentKey(nextKey);
  };

  if (!activeSegment) {
    return null;
  }

  const displayedValue = scrubbing && activePoint ? activePoint.value : animatedMetrics.totalAssets;
  const displayedCumulative = scrubbing && activePoint ? activePoint.gain : animatedMetrics.cumulativeReturn;
  const displayedCumulativeRate = scrubbing
    ? (activePoint?.gainRate ?? 0)
    : animatedMetrics.cumulativeReturnRate;
  const primaryChange = scrubbing && activePoint ? activePoint.gain : animatedMetrics.rangeChange;
  const primaryChangeRate = scrubbing && activePoint ? activePoint.gainRate : animatedMetrics.rangeChangeRate;
  const primaryLabel = scrubbing ? '持有收益' : activeRangeMeta.summaryLabel;
  const visibleTotalAssets = hasSufficientHistory ? displayedValue : activeSegment.totalAssets;
  const visibleCumulative = hasSufficientHistory
    ? displayedCumulative
    : activeSegment.cumulativeReturn;
  const visibleCumulativeRate = hasSufficientHistory
    ? displayedCumulativeRate
    : activeSegment.cumulativeReturnRate;
  const visibleTodayChange = hasSufficientHistory
    ? animatedMetrics.todayChange
    : activeSegment.todayChange;
  const visiblePrimaryChange = hasSufficientHistory ? primaryChange : 0;
  const visiblePrimaryChangeRate = hasSufficientHistory ? primaryChangeRate : 0;

  return (
    <LinearGradient
      colors={['#0E2948', '#173959', '#20486B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.summaryBlock}>
          <Text style={styles.eyebrow}>总资产</Text>
          <Text style={styles.value}>{formatCurrency(visibleTotalAssets, currency, 0)}</Text>
          <View style={styles.performanceRow}>
            <Text
              style={[
                styles.performanceValue,
                visiblePrimaryChange >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {formatSignedCurrency(visiblePrimaryChange, currency, 0)} ({formatPercent(visiblePrimaryChangeRate)})
            </Text>
            <Text style={styles.performanceLabel}>{primaryLabel}</Text>
          </View>
          <View style={styles.performanceRow}>
            <Text
              style={[
                styles.performanceValue,
                visibleTodayChange >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {formatSignedCurrency(visibleTodayChange, currency, 0)}
            </Text>
            <Text style={styles.performanceLabel}>今日盈亏</Text>
          </View>
        </View>

        <Pressable onPress={onAnalyticsPress} style={styles.analyticsButton}>
          <Ionicons name="pie-chart-outline" size={18} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentTabs}
      >
        {segments.map((segment) => {
          const active = segment.key === activeSegmentKey;

          return (
            <Pressable
              key={segment.key}
              onPress={() => handleSegmentChange(segment.key)}
              style={[
                styles.segmentChip,
                active ? styles.segmentChipActive : null,
                { borderColor: active ? `${segment.accentColor}66` : 'rgba(255,255,255,0.08)' },
              ]}
            >
              <View
                style={[
                  styles.segmentIconWrap,
                  active ? { backgroundColor: `${segment.accentColor}22` } : null,
                ]}
              >
                <Ionicons
                  name={segment.icon}
                  size={16}
                  color={active ? segment.accentColor : 'rgba(255,255,255,0.72)'}
                />
              </View>
              {active ? <Text style={styles.segmentChipText}>{segment.label}</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={styles.chartWrap}
        onLayout={(event) => {
          setChartWidth(event.nativeEvent.layout.width);
        }}
        {...panResponder.panHandlers}
      >
        {scrubbing && hasSufficientHistory && activeCoordinates && activePoint ? (
          <View style={[styles.floatingDateBadge, { width: floatingDateWidth, left: floatingDateLeft }]}>
            <Text style={styles.floatingDateText}>{formatSummaryDate(activePoint.timestamp, range)}</Text>
          </View>
        ) : null}

        <Animated.View style={[styles.chartReveal, { width: animatedChartWidth }]}>
          {chartWidth > 0 && hasSufficientHistory && normalized.length > 0 ? (
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <SvgLinearGradient id="summaryAreaFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={activeSegment.accentColor} stopOpacity={0.34} />
                  <Stop offset="100%" stopColor={activeSegment.accentColor} stopOpacity={0} />
                </SvgLinearGradient>
              </Defs>

              <Path d={areaPath} fill="url(#summaryAreaFill)" />
              <Path
                d={linePath}
                stroke={activeSegment.accentColor}
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Line
                x1={0}
                x2={chartWidth}
                y1={chartHeight - chartInsetBottom}
                y2={chartHeight - chartInsetBottom}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />

              {activeCoordinates ? (
                <>
                  <Line
                    x1={activeCoordinates.x}
                    x2={activeCoordinates.x}
                    y1={14}
                    y2={chartHeight - chartInsetBottom}
                    stroke="rgba(255,255,255,0.24)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <Circle
                    cx={activeCoordinates.x}
                    cy={activeCoordinates.y}
                    r={7}
                    fill={`${activeSegment.accentColor}44`}
                  />
                  <Circle
                    cx={activeCoordinates.x}
                    cy={activeCoordinates.y}
                    r={4.5}
                    fill={activeSegment.accentColor}
                  />
                </>
              ) : null}
            </Svg>
          ) : (
            <View style={styles.emptyChartState}>
              <Ionicons name="analytics-outline" size={22} color="rgba(255,255,255,0.7)" />
              <Text style={styles.emptyChartTitle}>历史数据不足</Text>
              <Text style={styles.emptyChartText}>
                {activeSegment.key === 'overview'
                  ? '当前仅展示已保存的真实快照；至少需要两天数据后才会显示收益曲线。'
                  : '当前只对总览提供真实历史曲线，分类分段暂未记录独立快照。'}
              </Text>
            </View>
          )}
        </Animated.View>

        {!scrubbing && hasSufficientHistory ? (
          <Text style={styles.dragHint}>按住图表左右拖动，可查看精确日期与金额</Text>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rangeTabs}
      >
        {rangeOptions.map((option) => {
          const active = option.value === range;

          return (
            <Pressable
              key={option.value}
              onPress={() => setRange(option.value)}
              style={[
                styles.rangeChip,
                active ? styles.rangeChipActive : null,
                active ? { borderColor: `${activeSegment.accentColor}77` } : null,
              ]}
            >
              <Text style={[styles.rangeChipText, active ? styles.rangeChipTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footerMetrics}>
        <View style={styles.footerMetric}>
          <Text style={styles.footerMetricLabel}>累计收益</Text>
          <Text
            style={[
              styles.footerMetricValue,
              visibleCumulative >= 0 ? styles.positive : styles.negative,
            ]}
          >
            {formatSignedCurrency(visibleCumulative, currency, 0)}
          </Text>
        </View>
        <View style={styles.footerMetric}>
          <Text style={styles.footerMetricLabel}>收益率</Text>
          <Text style={styles.footerMetricValue}>{formatPercent(visibleCumulativeRate)}</Text>
        </View>
        <View style={styles.footerMetric}>
          <Text style={styles.footerMetricLabel}>最近更新</Text>
          <Text style={styles.footerMetricValue}>{formatDateTime(activeSegment.lastUpdated)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.xs,
    overflow: 'hidden',
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  eyebrow: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
  },
  value: {
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: colors.white,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  performanceValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
  },
  performanceLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
  },
  analyticsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  segmentTabs: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  segmentChip: {
    minHeight: 42,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  segmentChipActive: {
    paddingRight: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  segmentIconWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.white,
  },
  chartWrap: {
    minHeight: chartHeight + 36,
    justifyContent: 'flex-end',
    paddingTop: 36,
  },
  chartReveal: {
    overflow: 'hidden',
    minHeight: chartHeight,
  },
  emptyChartState: {
    minHeight: chartHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyChartTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.white,
  },
  emptyChartText: {
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
  },
  floatingDateBadge: {
    position: 'absolute',
    top: 0,
    minHeight: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  floatingDateText: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.white,
  },
  dragHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6,
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
  },
  rangeTabs: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  rangeChip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rangeChipActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  rangeChipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.68)',
  },
  rangeChipTextActive: {
    color: colors.white,
  },
  footerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerMetric: {
    flex: 1,
    gap: spacing.xs,
  },
  footerMetricLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
  footerMetricValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.white,
  },
  positive: {
    color: '#9BE4BF',
  },
  negative: {
    color: '#FFB5BA',
  },
});
