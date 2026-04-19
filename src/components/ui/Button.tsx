import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, fontFamilies, radius, spacing } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
  disabled,
}: ButtonProps) {
  function handlePress() {
    onPress();

    void Haptics.selectionAsync().catch(() => {
      // Haptics can fail on web or unsupported environments; the button should still work.
    });
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={variantTextColors[variant]}
            style={styles.icon}
          />
        ) : null}
        <Text style={[styles.label, { color: variantTextColors[variant] }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  disabled: {
    opacity: 0.55,
  },
  icon: {
    marginTop: 1,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
  },
  ghost: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.negativeSoft,
    borderColor: 'transparent',
  },
});

const variantTextColors: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.text,
  ghost: colors.text,
  danger: colors.negative,
};
