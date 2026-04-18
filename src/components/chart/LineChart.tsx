import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';

import { colors, fontFamilies, spacing } from '../../theme';
import type { TrendPoint } from '../../types/models';
import { SurfaceCard } from '../ui/SurfaceCard';

interface LineChartProps {
  title: string;
  subtitle: string;
  points: TrendPoint[];
}

export function LineChart({ title, subtitle, points }: LineChartProps) {
  const chartWidth = Dimensions.get('window').width - 88;
  const chartHeight = 200;
  const inset = 18;
  const values = points.map((point) => point.valueUsd);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const normalized = points.map((point, index) => {
    const x = inset + (index / Math.max(points.length - 1, 1)) * (chartWidth - inset * 2);
    const y =
      chartHeight -
      inset -
      ((point.valueUsd - min) / Math.max(max - min, 1)) * (chartHeight - inset * 2);

    return { x, y, label: point.label };
  });

  const linePath = normalized.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = `M ${normalized[0]?.x ?? 0} ${chartHeight - inset}
    ${normalized.map((point) => `L ${point.x} ${point.y}`).join(' ')}
    L ${normalized[normalized.length - 1]?.x ?? 0} ${chartHeight - inset}
    Z`;

  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="lineFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#0D7A6B" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#0D7A6B" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#lineFill)" />
        <Polyline
          points={linePath}
          fill="none"
          stroke={colors.accent}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.labelsRow}>
        {normalized.map((point) => (
          <Text key={point.label} style={styles.axisLabel}>
            {point.label}
          </Text>
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
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
});
