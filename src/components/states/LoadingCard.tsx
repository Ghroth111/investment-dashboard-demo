import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import { SurfaceCard } from '../ui/SurfaceCard';

interface LoadingCardProps {
  lines?: number;
  height?: number;
}

export function LoadingCard({ lines = 3, height = 16 }: LoadingCardProps) {
  return (
    <SurfaceCard>
      <View style={[styles.block, styles.hero]} />
      {Array.from({ length: lines }).map((_, index) => (
        <View
          key={`loading-line-${index}`}
          style={[
            styles.block,
            styles.line,
            {
              height,
              width: index === lines - 1 ? '55%' : '100%',
            },
          ]}
        />
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  hero: {
    height: 160,
    marginBottom: spacing.md,
  },
  line: {
    marginTop: spacing.sm,
  },
});
