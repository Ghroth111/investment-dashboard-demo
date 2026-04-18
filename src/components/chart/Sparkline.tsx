import Svg, { Circle, Polyline } from 'react-native-svg';

import { colors } from '../../theme';
import type { TrendPoint } from '../../types/models';

interface SparklineProps {
  points: TrendPoint[];
  width?: number;
  height?: number;
  strokeColor?: string;
}

export function Sparkline({
  points,
  width = 150,
  height = 66,
  strokeColor = colors.positive,
}: SparklineProps) {
  if (points.length === 0) {
    return null;
  }

  const inset = 8;
  const values = points.map((point) => point.valueUsd);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const normalized = points.map((point, index) => {
    const x = inset + (index / Math.max(points.length - 1, 1)) * (width - inset * 2);
    const y =
      height -
      inset -
      ((point.valueUsd - min) / Math.max(max - min, 1)) * (height - inset * 2);

    return { x, y };
  });

  const polyline = normalized.map((point) => `${point.x},${point.y}`).join(' ');
  const lastPoint = normalized[normalized.length - 1];

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={polyline}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={lastPoint.x} cy={lastPoint.y} r={3.5} fill={strokeColor} />
    </Svg>
  );
}
