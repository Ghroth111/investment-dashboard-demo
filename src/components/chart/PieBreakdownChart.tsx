import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fontFamilies, spacing } from '../../theme';
import type { CurrencyCode } from '../../types/models';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface PieItem {
  key: string;
  label: string;
  value: number;
  percentage: number;
  tone: string;
}

interface PieBreakdownChartProps {
  items: PieItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
  currency: CurrencyCode;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeDonutSegment(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const endOuter = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const startInner = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const endInner = polarToCartesian(centerX, centerY, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ');
}

export function PieBreakdownChart({
  items,
  selectedKey,
  onSelect,
  currency,
}: PieBreakdownChartProps) {
  const selectedItem = items.find((item) => item.key === selectedKey) ?? items[0] ?? null;
  const chartSize = 220;
  const center = chartSize / 2;
  const outerRadius = 82;
  const innerRadius = 50;

  let angleCursor = 0;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrap}>
        <Svg width={chartSize} height={chartSize}>
          {items.length === 1 && selectedItem ? (
            <>
              <Circle cx={center} cy={center} r={outerRadius} fill={selectedItem.tone} opacity={0.92} />
              <Circle cx={center} cy={center} r={innerRadius} fill={colors.surface} />
            </>
          ) : (
            items.map((item) => {
              const startAngle = angleCursor;
              const endAngle = angleCursor + item.percentage * 360;
              angleCursor = endAngle;
              const path = describeDonutSegment(
                center,
                center,
                outerRadius,
                innerRadius,
                startAngle,
                endAngle,
              );
              const active = item.key === selectedKey;

              return (
                <Path
                  key={item.key}
                  d={path}
                  fill={item.tone}
                  opacity={active ? 1 : 0.74}
                />
              );
            })
          )}
        </Svg>

        {selectedItem ? (
          <View pointerEvents="none" style={styles.centerLabel}>
            <Text style={styles.centerEyebrow}>{selectedItem.label}</Text>
            <Text style={styles.centerValue}>{formatCurrency(selectedItem.value, currency, 0)}</Text>
            <Text style={styles.centerPercent}>{formatPercent(selectedItem.percentage)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.legendList}>
        {items.map((item) => {
          const active = item.key === selectedKey;

          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={[styles.legendRow, active ? styles.legendRowActive : null]}
            >
              <View style={styles.legendMain}>
                <View style={[styles.legendDot, { backgroundColor: item.tone }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
              <View style={styles.legendMeta}>
                <Text style={styles.legendValue}>{formatCurrency(item.value, currency, 0)}</Text>
                <Text style={styles.legendPercent}>{formatPercent(item.percentage)}</Text>
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
    gap: spacing.lg,
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  centerEyebrow: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  centerValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.4,
  },
  centerPercent: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.accent,
  },
  legendList: {
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
  },
  legendRowActive: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  legendMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: colors.text,
  },
  legendMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  legendValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
    color: colors.text,
  },
  legendPercent: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
});
