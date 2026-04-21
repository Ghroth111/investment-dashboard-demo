import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { ErrorState } from '../../components/states/ErrorState';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import type { RootStackScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, spacing } from '../../theme';

const tradeTypeOptions = [
  { label: 'Buy', value: 'buy' },
  { label: 'Sell', value: 'sell' },
];

export function EditHoldingTradeScreen({
  navigation,
  route,
}: RootStackScreenProps<'EditHoldingTrade'>) {
  const holdingTrades = useDemoStore((state) => state.holdingTrades);
  const updateHoldingTrade = useDemoStore((state) => state.updateHoldingTrade);
  const trade = holdingTrades.find((item) => item.id === route.params.tradeId);
  const [tradeType, setTradeType] = useState(trade?.tradeType ?? 'buy');
  const [quantity, setQuantity] = useState(trade ? String(trade.quantity) : '');
  const [price, setPrice] = useState(trade ? String(trade.price) : '');
  const [executedAt, setExecutedAt] = useState(trade ? trade.executedAt.slice(0, 10) : '');
  const [changeRate, setChangeRate] = useState(trade ? String(trade.changeRate) : '');

  if (!trade) {
    return (
      <AppScreen>
        <ErrorState
          title="Trade not found"
          description="This trade may have been removed or replaced by a newer import."
          actionLabel="Go Back"
          onAction={() => navigation.goBack()}
        />
      </AppScreen>
    );
  }

  const currentTrade = trade;

  function handleSave() {
    const parsedQuantity = Number.parseFloat(quantity);
    const parsedPrice = Number.parseFloat(price);
    const parsedChangeRate = Number.parseFloat(changeRate);

    if (
      Number.isNaN(parsedQuantity) ||
      parsedQuantity <= 0 ||
      Number.isNaN(parsedPrice) ||
      parsedPrice <= 0 ||
      Number.isNaN(parsedChangeRate)
    ) {
      Alert.alert('Invalid Trade', 'Enter a valid quantity, price, and trade change rate.');
      return;
    }

    updateHoldingTrade(currentTrade.id, {
      tradeType,
      quantity: parsedQuantity,
      price: parsedPrice,
      executedAt: new Date(`${executedAt}T12:00:00`).toISOString(),
      changeRate: parsedChangeRate,
      source: 'manual',
    });

    navigation.goBack();
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Edit Trade</Text>
          <Text style={styles.description}>
            Update the imported trade record and the linked holding summary will refresh with it.
          </Text>
        </View>
      </View>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>{currentTrade.assetName}</Text>
        <Text style={styles.sectionMeta}>
          {currentTrade.symbol} · {currentTrade.assetClass} · {currentTrade.currency}
        </Text>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Trade Details</Text>
        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>Trade Type</Text>
          <SegmentedControl
            options={tradeTypeOptions}
            value={tradeType}
            onChange={(next) => setTradeType(next as 'buy' | 'sell')}
          />
        </View>
        <InputField
          label="Trade Date"
          value={executedAt}
          onChangeText={setExecutedAt}
          placeholder="YYYY-MM-DD"
        />
        <InputField
          label="Buy/Sell Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <InputField
          label="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <InputField
          label="Trade Change Rate"
          value={changeRate}
          onChangeText={setChangeRate}
          keyboardType="decimal-pad"
          placeholder="0.05 for 5%"
        />
        <Button label="Save Trade" onPress={handleSave} icon="save-outline" />
      </SurfaceCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 26,
    color: colors.text,
  },
  description: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  card: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  sectionMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  optionBlock: {
    gap: spacing.sm,
  },
  optionLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
});
