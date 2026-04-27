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
  G,
  LinearGradient as SvgLinearGradient,
  Line,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { convertAmount, getAccountMetrics } from '../../features/dashboard/selectors';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type {
  Account,
  AccountType,
  CurrencyCode,
  ExchangeRates,
  PerformancePoint,
  PerformanceRange,
  PerformanceSeries,
  TrendPoint,
} from '../../types/models';
import { formatCurrency, formatPercent, formatSignedCurrency } from '../../utils/formatters';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SegmentKey = Exclude<AccountType, 'Manual'>;

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

const chartHeight = 154;
const chartInsetX = 8;
const chartInsetTop = 10;
const chartInsetBottom = 28;
const chartAxisLabelWidth = 40;

const rangeOptions: Array<{ value: PerformanceRange; label: string }> = [
  { value: '7D', label: '7D' },
  { value: '1M', label: '1M' },
  { value: '6M', label: '6M' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'All' },
];

const categoryMeta: Record<
  SegmentKey,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    accentColor: string;
  }
> = {
  Brokerage: { label: 'Brokerage', icon: 'stats-chart-outline', accentColor: '#7DE6D8' },
  Fund: { label: 'Fund', icon: 'pie-chart-outline', accentColor: '#A4E7C2' },
  Crypto: { label: 'Crypto', icon: 'logo-bitcoin', accentColor: '#70D4FF' },
  Cash: { label: 'Cash', icon: 'wallet-outline', accentColor: '#B0E7D4' },
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
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatChartDate(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

function formatAxisValue(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1000000) {
    return `${Math.round(value / 1000000)}M`;
  }

  if (absoluteValue >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return `${Math.round(value)}`;
}

function createEmptySeries(): PerformanceSeries {
  return {
    '7D': [],
    '1M': [],
    '6M': [],
    YTD: [],
    '1Y': [],
    ALL: [],
  };
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
  const emptySeries = createEmptySeries();

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

function buildScaledPerformanceSeries(
  overviewSeries: PerformanceSeries,
  totalAssets: number,
  cumulativeReturn: number,
) {
  const series = createEmptySeries();
  const costBase = Math.max(totalAssets - cumulativeReturn, 1);

  (Object.keys(series) as PerformanceRange[]).forEach((range) => {
    const source = overviewSeries[range];
    const lastSourceValue = source.at(-1)?.value ?? 0;

    if (source.length < 2 || lastSourceValue === 0 || totalAssets === 0) {
      series[range] = [];
      return;
    }

    const scale = totalAssets / lastSourceValue;

    series[range] = source.map((point) => {
      const value = point.value * scale;
      const gain = value - costBase;

      return {
        timestamp: point.timestamp,
        value,
        gain,
        gainRate: gain / costBase,
      };
    });
  });

  return series;
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

  const overviewSeries = buildOverviewPerformanceSeries(portfolioHistory, currency, exchangeRates);
  const orderedTypes: SegmentKey[] = ['Brokerage', 'Fund', 'Crypto', 'Cash'];

  const segments: CategorySegment[] = [];

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
      series: buildScaledPerformanceSeries(
        overviewSeries,
        metrics.totalAssets,
        metrics.cumulativeReturn,
      ),
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

function getPreviewSpanDays(range: PerformanceRange) {
  switch (range) {
    case '7D':
      return 7;
    case '1M':
      return 30;
    case '6M':
      return 180;
    case 'YTD':
      return 120;
    case '1Y':
      return 365;
    case 'ALL':
      return 900;
  }
}

function buildPreviewPerformancePoints(
  segment: CategorySegment,
  range: PerformanceRange,
): PerformancePoint[] {
  const pointCount = range === '7D' ? 18 : 30;
  const totalAssets = Math.max(segment.totalAssets, 0);
  const costBase = Math.max(totalAssets - segment.cumulativeReturn, 1);
  const spanDays = getPreviewSpanDays(range);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const factors = Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const trend = 0.82 + progress * 0.24;
    const dip = -0.055 * Math.exp(-Math.pow((progress - 0.42) / 0.15, 2));
    const lateRamp = 0.045 * Math.exp(-Math.pow((progress - 0.82) / 0.18, 2));
    const wave = Math.sin(progress * Math.PI * 5.2) * 0.018;
    const smallWave = Math.sin(progress * Math.PI * 15.4) * 0.007;

    return trend + dip + lateRamp + wave + smallWave;
  });
  const lastFactor = factors.at(-1) ?? 1;

  return factors.map((factor, index) => {
    const progress = index / (pointCount - 1);
    const timestamp = new Date(now - spanDays * (1 - progress) * dayMs).toISOString();
    const value =
      index === pointCount - 1
        ? totalAssets
        : totalAssets === 0
          ? 0
          : totalAssets * (factor / lastFactor);
    const gain = totalAssets === 0 ? 0 : value - costBase;

    return {
      timestamp,
      value,
      gain,
      gainRate: totalAssets === 0 ? 0 : gain / costBase,
    };
  });
}

export function AssetSummaryCard({
  accounts,
  currency,
  exchangeRates,
  portfolioHistory,
}: AssetSummaryCardProps) {
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<PerformanceRange>('ALL');
  const [activeSegmentKey, setActiveSegmentKey] = useState<SegmentKey>('Brokerage');
  const [showPercentages, setShowPercentages] = useState(false);
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
  const overviewMetrics = useMemo(
    () => getAggregateMetrics(accounts, currency, exchangeRates),
    [accounts, currency, exchangeRates],
  );
  const overviewSeries = useMemo(
    () => buildOverviewPerformanceSeries(portfolioHistory, currency, exchangeRates),
    [portfolioHistory, currency, exchangeRates],
  );
  const overviewSegment = useMemo<CategorySegment>(() => {
    const costBase = Math.max(overviewMetrics.totalAssets - overviewMetrics.cumulativeReturn, 0);
    return {
      key: 'overview' as SegmentKey,
      label: 'Overview',
      icon: 'grid-outline' as keyof typeof Ionicons.glyphMap,
      accentColor: '#72D8FF',
      totalAssets: overviewMetrics.totalAssets,
      cumulativeReturn: overviewMetrics.cumulativeReturn,
      cumulativeReturnRate: costBase === 0 ? 0 : overviewMetrics.cumulativeReturn / costBase,
      todayChange: overviewMetrics.todayChange,
      lastUpdated: overviewMetrics.lastUpdated,
      series: overviewSeries,
    };
  }, [overviewMetrics, overviewSeries]);

  useEffect(() => {
    if (segments.length > 0 && !segments.find((s) => s.key === activeSegmentKey)) {
      setActiveSegmentKey(segments[0].key);
    }
  }, [segments, activeSegmentKey]);

  const activeSegment =
    segments.find((segment) => segment.key === activeSegmentKey) ?? segments[0] ?? null;
  const chartSegment = activeSegment ?? overviewSegment;
  const points = useMemo(
    () => buildPreviewPerformancePoints(chartSegment, range),
    [chartSegment, range],
  );
  const lastPoint = points.at(-1) ?? null;
  const rangeChange = useMemo(() => getRangeChange(points), [points]);
  const hasSufficientHistory = points.length >= 2;

  useEffect(() => {
    setActiveIndex(Math.max(points.length - 1, 0));
    setScrubbing(false);
  }, [points.length, range]);

  useEffect(() => {
    if (!lastPoint) {
      return;
    }

    const listenerId = countUpProgress.addListener(({ value }) => {
      setAnimatedMetrics({
        totalAssets: overviewMetrics.totalAssets * value,
        cumulativeReturn: overviewMetrics.cumulativeReturn * value,
        cumulativeReturnRate:
          overviewMetrics.costBase === 0
            ? 0
            : (overviewMetrics.cumulativeReturn / overviewMetrics.costBase) * value,
        todayChange: overviewMetrics.todayChange * value,
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
  }, [chartSegment, countUpProgress, lastPoint, overviewMetrics, rangeChange, revealProgress]);

  const chartBounds = useMemo(() => {
    if (points.length === 0) {
      return { min: 0, max: 1 };
    }

    const rawMin = Math.min(...points.map((point) => point.value));
    const rawMax = Math.max(...points.map((point) => point.value));
    const rangeValue = Math.max(rawMax - rawMin, Math.abs(rawMax) * 0.02, 1);

    return {
      min: rawMin - rangeValue * 0.1,
      max: rawMax + rangeValue * 0.08,
    };
  }, [points]);

  const normalized = useMemo(() => {
    if (!chartWidth || points.length === 0) {
      return [];
    }

    const drawableWidth = Math.max(chartWidth - chartInsetX * 2 - chartAxisLabelWidth, 1);
    const drawableHeight = chartHeight - chartInsetTop - chartInsetBottom;

    return points.map((point, index) => {
      const progress = points.length === 1 ? 1 : index / (points.length - 1);
      const x = chartInsetX + drawableWidth * progress;
      const y =
        chartHeight -
        chartInsetBottom -
        ((point.value - chartBounds.min) / Math.max(chartBounds.max - chartBounds.min, 1)) *
          drawableHeight;

      return {
        ...point,
        x,
        y,
      };
    });
  }, [chartBounds.max, chartBounds.min, chartWidth, points]);

  const yAxisTicks = useMemo(() => {
    if (!chartWidth || !hasSufficientHistory) {
      return [];
    }

    const tickCount = 4;
    const drawableHeight = chartHeight - chartInsetTop - chartInsetBottom;

    return Array.from({ length: tickCount }, (_, index) => {
      const ratio = index / (tickCount - 1);
      const value = chartBounds.max - (chartBounds.max - chartBounds.min) * ratio;

      return {
        value,
        y: chartInsetTop + drawableHeight * ratio,
      };
    });
  }, [chartBounds.max, chartBounds.min, chartWidth, hasSufficientHistory]);

  const xAxisTicks = useMemo(() => {
    if (!normalized.length) {
      return [];
    }

    const lastIndex = normalized.length - 1;
    const indexes = [0, Math.floor(lastIndex / 3), Math.floor((lastIndex * 2) / 3), lastIndex];

    return Array.from(new Set(indexes))
      .map((index) => {
        const point = normalized[index];
        return point ? { x: point.x, label: formatChartDate(point.timestamp) } : null;
      })
      .filter((tick): tick is { x: number; label: string } => tick !== null);
  }, [normalized]);

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
  const animatedChartWidth = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, chartWidth || Math.max(width - 64, 248)],
  });
  const floatingDateWidth = 116;
  const floatingDateLeft = activeCoordinates
    ? clamp(activeCoordinates.x - floatingDateWidth / 2, 0, Math.max(chartWidth - floatingDateWidth, 0))
    : 0;

  function updateActiveIndex(event: GestureResponderEvent) {
    if (!normalized.length || chartWidth <= 0) {
      return;
    }

    const locationX = event.nativeEvent.locationX;
    const drawableWidth = Math.max(chartWidth - chartInsetX * 2 - chartAxisLabelWidth, 1);
    const nextIndex = Math.round(
      ((locationX - chartInsetX) / drawableWidth) * (normalized.length - 1),
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

  const chartAccentColor = chartSegment.accentColor;

  const visibleTotalAssets = animatedMetrics.totalAssets;
  const visibleCumulative = animatedMetrics.cumulativeReturn;
  const visibleCumulativeRate = animatedMetrics.cumulativeReturnRate;
  const visibleTodayChange = animatedMetrics.todayChange;

  return (
    <LinearGradient
      colors={['#061F39', '#0B2B4D', '#12385B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(visibleTotalAssets, currency, 0)}
        </Text>

        <Pressable onPress={() => setShowPercentages((prev) => !prev)} style={styles.headerMetrics}>
          <View style={styles.headerMetric}>
            <Text style={styles.headerMetricLabel}>Total Return</Text>
            <Text
              style={[
                styles.headerMetricValue,
                visibleCumulative >= 0 ? styles.positive : styles.negative,
              ]}
              numberOfLines={1}
            >
              {showPercentages
                ? formatPercent(visibleCumulativeRate)
                : formatSignedCurrency(visibleCumulative, currency, 0)}
            </Text>
          </View>

          <View style={styles.headerMetric}>
            <Text style={styles.headerMetricLabel}>Today's Gain</Text>
            <Text
              style={[
                styles.headerMetricValue,
                visibleTodayChange >= 0 ? styles.positive : styles.negative,
              ]}
              numberOfLines={1}
            >
              {showPercentages
                ? formatPercent(
                    overviewMetrics.totalAssets === 0
                      ? 0
                      : visibleTodayChange / overviewMetrics.totalAssets,
                  )
                : formatSignedCurrency(visibleTodayChange, currency, 0)}
            </Text>
          </View>
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
                  size={14}
                  color={active ? segment.accentColor : 'rgba(255,255,255,0.70)'}
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
                  <Stop offset="0%" stopColor={chartAccentColor} stopOpacity={0.42} />
                  <Stop offset="100%" stopColor={chartAccentColor} stopOpacity={0} />
                </SvgLinearGradient>
              </Defs>

              {yAxisTicks.map((tick) => (
                <G key={`y-${tick.y}`}>
                  <Line
                    x1={0}
                    x2={Math.max(chartWidth - chartAxisLabelWidth, 0)}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={1}
                    strokeDasharray="5 6"
                  />
                  <SvgText
                    x={chartWidth - 2}
                    y={tick.y + 4}
                    fill="rgba(255,255,255,0.78)"
                    fontSize={11}
                    fontFamily={fontFamilies.medium}
                    textAnchor="end"
                  >
                    {formatAxisValue(tick.value)}
                  </SvgText>
                </G>
              ))}

              <Path d={areaPath} fill="url(#summaryAreaFill)" />
              <Path
                d={linePath}
                stroke={chartAccentColor}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Line
                x1={0}
                x2={Math.max(chartWidth - chartAxisLabelWidth, 0)}
                y1={chartHeight - chartInsetBottom}
                y2={chartHeight - chartInsetBottom}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1}
              />

              {xAxisTicks.map((tick) => (
                <SvgText
                  key={`x-${tick.label}-${tick.x}`}
                  x={tick.x}
                  y={chartHeight - 6}
                  fill="rgba(255,255,255,0.72)"
                  fontSize={11}
                  fontFamily={fontFamilies.regular}
                  textAnchor="middle"
                >
                  {tick.label}
                </SvgText>
              ))}

              {activeCoordinates ? (
                <G>
                  <Line
                    x1={activeCoordinates.x}
                    x2={activeCoordinates.x}
                    y1={chartInsetTop}
                    y2={chartHeight - chartInsetBottom}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <Circle
                    cx={activeCoordinates.x}
                    cy={activeCoordinates.y}
                    r={7}
                    fill={`${chartAccentColor}44`}
                  />
                  <Circle
                    cx={activeCoordinates.x}
                    cy={activeCoordinates.y}
                    r={4.5}
                    fill={chartAccentColor}
                  />
                </G>
              ) : null}
            </Svg>
          ) : (
            <View style={styles.emptyChartState}>
              <Ionicons name="analytics-outline" size={20} color="rgba(255,255,255,0.7)" />
              <Text style={styles.emptyChartTitle}>Not enough history</Text>
              <Text style={styles.emptyChartText}>
                Add at least two portfolio snapshots to render the return curve.
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rangeTabsShell}
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
                active ? { borderColor: `${chartAccentColor}88` } : null,
              ]}
            >
              <Text style={[styles.rangeChipText, active ? styles.rangeChipTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    overflow: 'hidden',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    lineHeight: 42,
    color: colors.white,
  },
  headerMetrics: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  headerMetric: {
    alignItems: 'flex-end',
    gap: 2,
  },
  headerMetricLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 10,
    lineHeight: 12,
    color: 'rgba(255,255,255,0.78)',
  },
  headerMetricValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  segmentTabs: {
    gap: 8,
    paddingRight: spacing.md,
  },
  segmentChip: {
    minHeight: 32,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
  },
  segmentChipActive: {
    paddingRight: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  segmentIconWrap: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12,
    color: colors.white,
  },
  chartWrap: {
    minHeight: chartHeight + 18,
    justifyContent: 'flex-end',
    paddingTop: 18,
  },
  chartReveal: {
    overflow: 'hidden',
    minHeight: chartHeight,
  },
  emptyChartState: {
    minHeight: chartHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  emptyChartTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.white,
  },
  emptyChartText: {
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.72)',
  },
  floatingDateBadge: {
    position: 'absolute',
    top: 0,
    minHeight: 26,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    zIndex: 2,
  },
  floatingDateText: {
    fontFamily: fontFamilies.medium,
    fontSize: 10,
    color: colors.white,
  },
  rangeTabsShell: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  rangeTabs: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 4,
    gap: 4,
  },
  rangeChip: {
    minWidth: 48,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rangeChipActive: {
    backgroundColor: 'rgba(84,154,230,0.28)',
  },
  rangeChipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
  },
  rangeChipTextActive: {
    color: colors.white,
  },
  positive: {
    color: '#9BE4BF',
  },
  negative: {
    color: '#FFB5BA',
  },
});
