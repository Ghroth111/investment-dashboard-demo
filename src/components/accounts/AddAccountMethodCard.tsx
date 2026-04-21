import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, radius, spacing } from '../../theme';
import { SurfaceCard } from '../ui/SurfaceCard';

interface AddAccountMethodCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  badge: string;
  onPress: () => void;
}

export function AddAccountMethodCard({
  icon,
  title,
  description,
  badge,
  onPress,
}: AddAccountMethodCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <SurfaceCard style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.badgeWrap}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    minHeight: 28,
    borderRadius: radius.pill,
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  badgeText: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  description: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
});
