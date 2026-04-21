import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fontFamilies, radius, spacing } from '../../theme';

export interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  compact = false,
}: SegmentedControlProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.wrapper, compact ? styles.compactWrapper : null]}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              active ? styles.optionActive : null,
              pressed ? styles.optionPressed : null,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  compactWrapper: {
    gap: spacing.xs,
  },
  option: {
    paddingHorizontal: spacing.md,
    minHeight: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionPressed: {
    opacity: 0.92,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.white,
  },
});
