import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTransactionCategoryIcon } from '../../features/transactions/config';
import { colors, fontFamilies, spacing } from '../../theme';
import type { TransactionCategory } from '../../types/models';

interface CategoryGridProps {
  categories: TransactionCategory[];
  selectedCategory: TransactionCategory | null;
  onSelect: (category: TransactionCategory) => void;
}

export function CategoryGrid({
  categories,
  selectedCategory,
  onSelect,
}: CategoryGridProps) {
  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const active = category === selectedCategory;

        return (
          <Pressable
            key={category}
            onPress={() => onSelect(category)}
            style={styles.item}
          >
            <View style={[styles.iconWrap, active ? styles.iconWrapActive : null]}>
              <Ionicons
                name={getTransactionCategoryIcon(category)}
                size={18}
                color={active ? colors.white : colors.primary}
              />
            </View>
            <Text style={[styles.label, active ? styles.labelActive : null]}>{category}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  item: {
    width: '18.5%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.infoSoft,
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.white,
  },
});
