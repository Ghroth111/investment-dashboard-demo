import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, spacing } from '../../theme';
import type {
  AccountType,
  AssetClass,
  CurrencyCode,
  ManualHoldingInput,
} from '../../types/models';
import { formatCurrency } from '../../utils/formatters';
import type { RootStackScreenProps } from '../../navigation/types';

interface HoldingDraft {
  id: string;
  name: string;
  symbol: string;
  assetClass: AssetClass;
  quantity: string;
  currentPrice: string;
  costBasis: string;
}

const accountTypeOptions = [
  { label: '券商', value: 'Brokerage' },
  { label: '基金', value: 'Fund' },
  { label: '加密', value: 'Crypto' },
  { label: '现金', value: 'Cash' },
  { label: '手动', value: 'Manual' },
];

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'CNY', value: 'CNY' },
  { label: 'EUR', value: 'EUR' },
  { label: 'HKD', value: 'HKD' },
];

const assetClassOptions = [
  { label: '股票', value: 'Stock' },
  { label: 'ETF', value: 'ETF' },
  { label: '基金', value: 'Fund' },
  { label: '加密', value: 'Crypto' },
  { label: '现金', value: 'Cash' },
];

function createHoldingDraft(): HoldingDraft {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    name: '',
    symbol: '',
    assetClass: 'Stock',
    quantity: '',
    currentPrice: '',
    costBasis: '',
  };
}

export function ManualEntryScreen({ navigation }: RootStackScreenProps<'ManualEntry'>) {
  const addManualAccount = useDemoStore((state) => state.addManualAccount);
  const [accountName, setAccountName] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Manual');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [cashBalance, setCashBalance] = useState('0');
  const [holdings, setHoldings] = useState<HoldingDraft[]>([createHoldingDraft()]);

  const previewTotal = holdings.reduce((sum, holding) => {
    const quantity = Number.parseFloat(holding.quantity || '0');
    const price = Number.parseFloat(holding.currentPrice || '0');
    return sum + quantity * price;
  }, 0) + Number.parseFloat(cashBalance || '0');

  function updateHolding(id: string, patch: Partial<HoldingDraft>) {
    setHoldings((current) =>
      current.map((holding) => (holding.id === id ? { ...holding, ...patch } : holding)),
    );
  }

  function removeHolding(id: string) {
    setHoldings((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  function addHolding() {
    setHoldings((current) => [...current, createHoldingDraft()]);
  }

  function handleSave() {
    if (!accountName.trim() || !platformName.trim()) {
      Alert.alert('字段不完整', '请至少填写账户名称和平台名称。');
      return;
    }

    const parsedHoldings: ManualHoldingInput[] = [];

    for (const holding of holdings) {
      const quantity = Number.parseFloat(holding.quantity);
      const currentPrice = Number.parseFloat(holding.currentPrice);
      const costBasis = Number.parseFloat(holding.costBasis);

      if (
        !holding.name.trim() ||
        !holding.symbol.trim() ||
        Number.isNaN(quantity) ||
        Number.isNaN(currentPrice) ||
        Number.isNaN(costBasis)
      ) {
        Alert.alert('持仓数据不完整', '请补全每条持仓的名称、代码、数量、现价和成本。');
        return;
      }

      parsedHoldings.push({
        name: holding.name.trim(),
        symbol: holding.symbol.trim().toUpperCase(),
        assetClass: holding.assetClass,
        quantity,
        currentPrice,
        costBasis,
      });
    }

    const accountId = addManualAccount({
      name: accountName.trim(),
      platform: platformName.trim(),
      type: accountType,
      currency,
      cashBalance: Number.parseFloat(cashBalance || '0'),
      holdings: parsedHoldings,
    });

    navigation.replace('AccountDetail', { accountId });
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>手动录入</Text>
          <Text style={styles.description}>这是本轮唯一会真实写入前端状态的新增流程。</Text>
        </View>
      </View>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>账户信息</Text>
        <InputField label="账户名称" value={accountName} onChangeText={setAccountName} placeholder="例如：退休组合 / 私募跟踪账户" />
        <InputField label="平台名称" value={platformName} onChangeText={setPlatformName} placeholder="例如：Manual Ledger / 家族办公室" />
        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>账户类型</Text>
          <SegmentedControl options={accountTypeOptions} value={accountType} onChange={(next) => setAccountType(next as AccountType)} compact />
        </View>
        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>币种</Text>
          <SegmentedControl options={currencyOptions} value={currency} onChange={(next) => setCurrency(next as CurrencyCode)} compact />
        </View>
        <InputField
          label="现金余额"
          value={cashBalance}
          onChangeText={setCashBalance}
          placeholder="0"
          keyboardType="decimal-pad"
        />
      </SurfaceCard>

      {holdings.map((holding, index) => (
        <SurfaceCard key={holding.id} style={styles.card}>
          <View style={styles.holdingHeader}>
            <Text style={styles.sectionTitle}>持仓 #{index + 1}</Text>
            <Pressable onPress={() => removeHolding(holding.id)} hitSlop={10}>
              <Ionicons name="trash-outline" size={18} color={colors.negative} />
            </Pressable>
          </View>
          <InputField label="标的名称" value={holding.name} onChangeText={(text) => updateHolding(holding.id, { name: text })} placeholder="例如 Apple Inc." />
          <InputField label="Symbol" value={holding.symbol} onChangeText={(text) => updateHolding(holding.id, { symbol: text })} placeholder="例如 AAPL" />
          <View style={styles.optionBlock}>
            <Text style={styles.optionLabel}>资产类型</Text>
            <SegmentedControl
              options={assetClassOptions}
              value={holding.assetClass}
              onChange={(next) => updateHolding(holding.id, { assetClass: next as AssetClass })}
              compact
            />
          </View>
          <InputField label="数量" value={holding.quantity} onChangeText={(text) => updateHolding(holding.id, { quantity: text })} keyboardType="decimal-pad" placeholder="0" />
          <InputField label="当前价" value={holding.currentPrice} onChangeText={(text) => updateHolding(holding.id, { currentPrice: text })} keyboardType="decimal-pad" placeholder="0" />
          <InputField label="成本价" value={holding.costBasis} onChangeText={(text) => updateHolding(holding.id, { costBasis: text })} keyboardType="decimal-pad" placeholder="0" />
        </SurfaceCard>
      ))}

      <Button label="添加持仓" onPress={addHolding} icon="add-outline" variant="secondary" />

      <SurfaceCard style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>预估结果</Text>
        <Text style={styles.summaryValue}>{formatCurrency(previewTotal, currency, 0)}</Text>
        <Text style={styles.summaryText}>保存后会立即出现在首页、账户列表和详情页。</Text>
        <Button label="保存到账户列表" onPress={handleSave} icon="save-outline" />
      </SurfaceCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
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
    fontSize: 28,
    color: colors.text,
  },
  description: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
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
  optionBlock: {
    gap: spacing.sm,
  },
  optionLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  holdingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCard: {
    gap: spacing.sm,
  },
  summaryValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    color: colors.text,
  },
  summaryText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
});
