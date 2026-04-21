import { useEffect, useMemo, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
} from 'react-native-svg';

import { colors, fontFamilies, radius, spacing } from '../../theme';
import type {
  CurrencyCode,
  PerformancePoint,
  PerformanceRange,
  PerformanceSeries,
} from '../../types/models';
import { formatCurrency, formatPercent, formatSignedCurrency } from '../../utils/formatters';
import { SurfaceCard } from '../ui/SurfaceCard';

interface InteractivePerformanceChartProps {
  title: string;
  subtitle?: string;
  currency: CurrencyCode;
  series: PerformanceSeries;
  defaultRange?: PerformanceRange;
  emptyMessage?: string;
}

const rangeOptions: { label: string; value: PerformanceRange }[] = [
  { label: '7D', value: '7D' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' },
];

function formatChartDate(dateLike: string, range: PerformanceRange) {
  const date = new Date(dateLike);

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
    }).format(date);
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function InteractivePerformanceChart({
  title,
  subtitle,
  currency,
  series,
  defaultRange = 'YTD',
  emptyMessage = '暂无真实历史数据，记录更多快照后这里会显示收益曲线。',
}: InteractivePerformanceChartProps) {
  const [range, setRange] = useState<PerformanceRange>(defaultRange);
  const [chartWidth, setChartWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const points = series[range] ?? [];
  const hasHistory = points.length >= 2;

  useEffect(() => {
    setActiveIndex(Math.max(points.length - 1, 0));
    setScrubbing(false);
  }, [points.length, range]);

  const chartHeight = 226;
  const chartInset = 18;

  const normalized = useMemo(() => {
    if (points.length === 0 || chartWidth <= 0) {
      return [];
    }

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return points.map((point, index) => {
      const x =
        chartInset +
        (index / Math.max(points.length - 1, 1)) * Math.max(chartWidth - chartInset * 2, 1);
      const y =
        chartHeight -
        chartInset -
        ((point.value - min) / Math.max(max - min, 1)) * (chartHeight - chartInset * 2);

      return { ...point, x, y };
    });
  }, [chartHeight, chartInset, chartWidth, points]);

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

    return `${linePath} L ${normalized[normalized.length - 1].x} ${chartHeight - chartInset} L ${
      normalized[0].x
    } ${chartHeight - chartInset} Z`;
  }, [chartHeight, chartInset, linePath, normalized]);

  const displayedIndex = Math.min(activeIndex, Math.max(points.length - 1, 0));
  const activePoint = points[displayedIndex];
  const activeCoordinates = normalized[displayedIndex];

  function updateActiveIndexFromEvent(event: GestureResponderEvent) {
    if (normalized.length === 0) {
      return;
    }

    const locationX = event.nativeEvent.locationX;
    const index = Math.round(
      ((locationX - chartInset) / Math.max(chartWidth - chartInset * 2, 1)) * (normalized.length - 1),
    );

    setActiveIndex(Math.max(0, Math.min(normalized.length - 1, index)));
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setScrubbing(true);
          updateActiveIndexFromEvent(event);
        },
        onPanResponderMove: (event) => {
          updateActiveIndexFromEvent(event);
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
    [chartInset, chartWidth, normalized.length, points.length],
  );

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {activePoint ? (
            <>
              <Text style={styles.value}>{formatCurrency(activePoint.value, currency, 0)}</Text>
              <View style={styles.returnRow}>
                <Text style={[styles.returnValue, activePoint.gain >= 0 ? styles.positive : styles.negative]}>
                  {formatSignedCurrency(activePoint.gain, currency, 0)}
                </Text>
                <Text style={[styles.returnRate, activePoint.gain >= 0 ? styles.positive : styles.negative]}>
                  {formatPercent(activePoint.gainRate)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyValue}>历史数据不足</Text>
          )}
        </View>

        {activePoint ? (
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{formatChartDate(activePoint.timestamp, range)}</Text>
          </View>
        ) : null}
      </View>

      <View
        style={styles.chartWrap}
        onLayout={(event) => {
          setChartWidth(event.nativeEvent.layout.width);
        }}
        {...panResponder.panHandlers}
      >
        {chartWidth > 0 && normalized.length > 0 ? (
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="performanceFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#31D7DE" stopOpacity="0.28" />
                <Stop offset="100%" stopColor="#31D7DE" stopOpacity="0.02" />
              </LinearGradient>
            </Defs>

            <Path d={areaPath} fill="url(#performanceFill)" />
            <Path
              d={linePath}
              fill="none"
              stroke="#28D2D9"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {activeCoordinates ? (
              <>
                <Line
                  x1={activeCoordinates.x}
                  x2={activeCoordinates.x}
                  y1={12}
                  y2={chartHeight - chartInset}
                  stroke="rgba(16,35,59,0.14)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <Circle cx={activeCoordinates.x} cy={activeCoordinates.y} r={7} fill="rgba(40,210,217,0.18)" />
                <Circle cx={activeCoordinates.x} cy={activeCoordinates.y} r={4.5} fill="#28D2D9" />
              </>
            ) : null}
          </Svg>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{emptyMessage}</Text>
          </View>
        )}

        {!scrubbing && hasHistory ? <Text style={styles.dragHint}>按住并左右拖动可查看任意时点收益</Text> : null}
      </View>

      <View style={styles.rangeRow}>
        {rangeOptions.map((option) => {
          const active = option.value === range;

          return (
            <Pressable
              key={option.value}
              onPress={() => setRange(option.value)}
              style={[styles.rangeChip, active ? styles.rangeChipActive : null]}
            >
              <Text style={[styles.rangeChipText, active ? styles.rangeChipTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
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
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.accent,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  value: {
    marginTop: spacing.sm,
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.text,
  },
  emptyValue: {
    marginTop: spacing.sm,
    fontFamily: fontFamilies.semibold,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textMuted,
  },
  returnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  returnValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
  },
  returnRate: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  dateBadge: {
    paddingHorizontal: spacing.md,
    minHeight: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  dateBadgeText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.text,
  },
  chartWrap: {
    minHeight: 226,
    justifyContent: 'flex-end',
  },
  emptyState: {
    minHeight: 226,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  dragHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rangeChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  rangeChipActive: {
    backgroundColor: colors.accentSoft,
  },
  rangeChipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  rangeChipTextActive: {
    color: colors.accent,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
