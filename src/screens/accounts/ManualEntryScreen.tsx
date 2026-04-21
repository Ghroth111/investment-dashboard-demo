import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { fetchLatestPrice, searchUsStocks, type StockSearchResult } from '../../services/marketData';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, spacing } from '../../theme';
import type { RootStackScreenProps } from '../../navigation/types';
import type {
  AccountType,
  AssetClass,
  CurrencyCode,
  ManualEntryPrefill,
  ManualHoldingInput,
} from '../../types/models';
import { formatCurrency } from '../../utils/formatters';

interface HoldingDraft {
  id: string;
  name: string;
  symbol: string;
  assetClass: AssetClass;
  quantity: string;
  currentPrice: string;
  costBasis: string;
  exchange: string;
  micCode: string;
  country: string;
  instrumentType: string;
}

interface HoldingEditorCardProps {
  holding: HoldingDraft;
  index: number;
  onChange: (patch: Partial<HoldingDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
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
    exchange: '',
    micCode: '',
    country: 'United States',
    instrumentType: '',
  };
}

function createHoldingDraftFromPrefill(
  prefill?: ManualEntryPrefill['holdings'][number],
): HoldingDraft {
  const draft = createHoldingDraft();

  if (!prefill) {
    return draft;
  }

  return {
    ...draft,
    name: prefill.name || '',
    symbol: prefill.symbol || '',
    assetClass: prefill.assetClass || 'Stock',
    quantity: prefill.quantity !== null && prefill.quantity !== undefined ? String(prefill.quantity) : '',
    currentPrice:
      prefill.currentPrice !== null && prefill.currentPrice !== undefined
        ? formatLivePrice(prefill.currentPrice)
        : '',
    costBasis:
      prefill.costBasis !== null && prefill.costBasis !== undefined
        ? String(prefill.costBasis)
        : '',
  };
}

function formatLivePrice(price: number) {
  if (price >= 1000) {
    return price.toFixed(2);
  }

  if (price >= 1) {
    return price.toFixed(4).replace(/\.?0+$/, '');
  }

  return price.toFixed(6).replace(/\.?0+$/, '');
}

function HoldingEditorCard({
  holding,
  index,
  onChange,
  onRemove,
  canRemove,
}: HoldingEditorCardProps) {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [hasCommittedSelection, setHasCommittedSelection] = useState(false);

  useEffect(() => {
    const normalizedQuery = searchText.trim();
    if (!normalizedQuery || hasCommittedSelection) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError('');

    const timeoutId = setTimeout(async () => {
      try {
        const nextResults = await searchUsStocks(normalizedQuery);
        if (!cancelled) {
          setSearchResults(nextResults);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : '搜索失败，请稍后重试。');
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [hasCommittedSelection, searchText]);

  async function refreshPrice(overrides?: Partial<StockSearchResult>) {
    const symbol = overrides?.symbol || holding.symbol;
    if (!symbol) {
      Alert.alert('请选择标的', '请先通过搜索结果选择一个真实标的，再刷新最新价格。');
      return;
    }

    setPriceLoading(true);
    setPriceError('');

    try {
      const quote = await fetchLatestPrice({
        symbol,
        exchange: overrides?.exchange || holding.exchange,
        micCode: overrides?.micCode || holding.micCode,
        country: overrides?.country || holding.country,
        type: overrides?.instrumentType || holding.instrumentType,
      });

      onChange({
        currentPrice: formatLivePrice(quote.price),
        exchange: overrides?.exchange || holding.exchange,
        micCode: overrides?.micCode || holding.micCode,
        country: overrides?.country || holding.country,
        instrumentType: overrides?.instrumentType || holding.instrumentType,
      });
    } catch (error) {
      setPriceError(error instanceof Error ? error.message : '获取最新价格失败。');
    } finally {
      setPriceLoading(false);
    }
  }

  async function handlePickResult(result: StockSearchResult) {
    setHasCommittedSelection(true);
    setSearchResults([]);
    setSearchError('');
    setSearchText(`${result.symbol} · ${result.name}`);

    onChange({
      name: result.name,
      symbol: result.symbol,
      assetClass: result.assetClass,
      exchange: result.exchange,
      micCode: result.micCode || '',
      country: result.country,
      instrumentType: result.instrumentType,
    });

    await refreshPrice(result);
  }

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.holdingHeader}>
        <Text style={styles.sectionTitle}>持仓 #{index + 1}</Text>
        {canRemove ? (
          <Pressable onPress={onRemove} hitSlop={10}>
            <Ionicons name="trash-outline" size={18} color={colors.negative} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.searchBlock}>
        <Text style={styles.optionLabel}>搜索美股标的</Text>
        <TextInput
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            setHasCommittedSelection(false);
            setPriceError('');
          }}
          placeholder="输入 AAPL / Apple / Nvidia"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.searchHint}>
          匹配结果来自 Twelve Data，选中后会自动带入名称、代码和最新价格。
        </Text>
        {searchLoading ? (
          <View style={styles.inlineStatus}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.inlineStatusText}>正在搜索...</Text>
          </View>
        ) : null}
        {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
        {searchResults.length > 0 ? (
          <View style={styles.searchResults}>
            {searchResults.map((result) => (
              <Pressable
                key={`${result.symbol}-${result.exchange}`}
                onPress={() => {
                  void handlePickResult(result);
                }}
                style={styles.searchResultItem}
              >
                <View style={styles.searchResultMain}>
                  <Text style={styles.searchResultSymbol}>{result.symbol}</Text>
                  <Text style={styles.searchResultName}>{result.name}</Text>
                </View>
                <Text style={styles.searchResultMeta}>
                  {result.exchange} · {result.instrumentType}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <InputField
        label="标的名称"
        value={holding.name}
        onChangeText={(text) => onChange({ name: text })}
        placeholder="例如 Apple Inc."
      />
      <InputField
        label="代码"
        value={holding.symbol}
        onChangeText={(text) => onChange({ symbol: text.trim().toUpperCase() })}
        placeholder="例如 AAPL"
        autoCapitalize="characters"
      />
      <View style={styles.optionBlock}>
        <Text style={styles.optionLabel}>资产类型</Text>
        <SegmentedControl
          options={assetClassOptions}
          value={holding.assetClass}
          onChange={(next) => onChange({ assetClass: next as AssetClass })}
          compact
        />
      </View>
      <InputField
        label="数量"
        value={holding.quantity}
        onChangeText={(text) => onChange({ quantity: text })}
        keyboardType="decimal-pad"
        placeholder="0"
      />

      <View style={styles.priceHeader}>
        <Text style={styles.optionLabel}>当前价格</Text>
        <Pressable
          onPress={() => {
            void refreshPrice();
          }}
          disabled={priceLoading || !holding.symbol}
          style={styles.refreshPriceAction}
        >
          {priceLoading ? (
            <ActivityIndicator size="small" color={colors.info} />
          ) : (
            <Ionicons name="refresh-outline" size={14} color={holding.symbol ? colors.info : colors.textMuted} />
          )}
          <Text style={[styles.refreshPriceText, !holding.symbol ? styles.disabledText : null]}>
            刷新价格
          </Text>
        </Pressable>
      </View>
      <InputField
        label="最新价格"
        value={holding.currentPrice}
        onChangeText={(text) => onChange({ currentPrice: text })}
        keyboardType="decimal-pad"
        placeholder="选择标的后自动带入，也可以手动填写"
      />
      <Text style={styles.priceHint}>
        如果价格接口暂时不可用，你也可以手动填写最新价格后继续保存。
      </Text>
      {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}

      <InputField
        label="成本价"
        value={holding.costBasis}
        onChangeText={(text) => onChange({ costBasis: text })}
        keyboardType="decimal-pad"
        placeholder="0"
      />
    </SurfaceCard>
  );
}

export function ManualEntryScreen({ navigation, route }: RootStackScreenProps<'ManualEntry'>) {
  const addManualAccount = useDemoStore((state) => state.addManualAccount);
  const prefill = route.params?.prefill;
  const [accountName, setAccountName] = useState(prefill?.name || '');
  const [platformName, setPlatformName] = useState(prefill?.platform || '');
  const [accountType, setAccountType] = useState<AccountType>(prefill?.type || 'Manual');
  const [currency, setCurrency] = useState<CurrencyCode>(prefill?.currency || 'USD');
  const [cashBalance, setCashBalance] = useState(
    prefill?.cashBalance !== null && prefill?.cashBalance !== undefined ? String(prefill.cashBalance) : '0',
  );
  const [holdings, setHoldings] = useState<HoldingDraft[]>(
    prefill?.holdings && prefill.holdings.length > 0
      ? prefill.holdings.map((holding) => createHoldingDraftFromPrefill(holding))
      : [createHoldingDraft()],
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const previewTotal =
    holdings.reduce((sum, holding) => {
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
    setHoldings((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id),
    );
  }

  function addHolding() {
    setHoldings((current) => [...current, createHoldingDraft()]);
  }

  async function handleSave() {
    if (saving) {
      return;
    }

    setSaveMessage('正在校验并保存...');

    if (!accountName.trim() || !platformName.trim()) {
      setSaveMessage('请先填写账户名称和平台名称。');
      Alert.alert('信息不完整', '请至少填写账户名称和平台名称。');
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
        setSaveMessage(`持仓 #${parsedHoldings.length + 1} 信息不完整，请补全名称、代码、数量、价格和成本价。`);
        Alert.alert('持仓信息不完整', '请补全每条持仓的名称、代码、数量、最新价格和成本价。');
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

    try {
      setSaving(true);
      setSaveMessage('正在写入账户数据...');
      const accountId = await addManualAccount({
        name: accountName.trim(),
        platform: platformName.trim(),
        type: accountType,
        currency,
        cashBalance: Number.parseFloat(cashBalance || '0'),
        holdings: parsedHoldings,
      });

      navigation.replace('AccountDetail', { accountId });
    } catch (error) {
      setSaveMessage(error instanceof Error ? `保存失败：${error.message}` : '保存失败，请检查网络后重试。');
      Alert.alert(
        '保存失败',
        error instanceof Error ? error.message : '账户保存失败，请检查网络后重试。',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>手动录入</Text>
          <Text style={styles.description}>
            {prefill
              ? '截图识别结果已经预填，你可以继续校对后再保存。'
              : '适合线下资产、家庭账户或暂时无法直连的平台。'}
          </Text>
        </View>
      </View>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>账户信息</Text>
        <InputField
          label="账户名称"
          value={accountName}
          onChangeText={setAccountName}
          placeholder="例如：退休组合 / 家庭备用金"
        />
        <InputField
          label="平台名称"
          value={platformName}
          onChangeText={setPlatformName}
          placeholder="例如：Manual Ledger / Family Office"
        />
        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>账户类型</Text>
          <SegmentedControl
            options={accountTypeOptions}
            value={accountType}
            onChange={(next) => setAccountType(next as AccountType)}
            compact
          />
        </View>
        <View style={styles.optionBlock}>
          <Text style={styles.optionLabel}>计价币种</Text>
          <SegmentedControl
            options={currencyOptions}
            value={currency}
            onChange={(next) => setCurrency(next as CurrencyCode)}
            compact
          />
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
        <HoldingEditorCard
          key={holding.id}
          holding={holding}
          index={index}
          canRemove={holdings.length > 1}
          onRemove={() => removeHolding(holding.id)}
          onChange={(patch) => updateHolding(holding.id, patch)}
        />
      ))}

      <Button label="添加持仓" onPress={addHolding} icon="add-outline" variant="secondary" />

      <SurfaceCard style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>预估结果</Text>
        <Text style={styles.summaryValue}>{formatCurrency(previewTotal, currency, 0)}</Text>
        <Text style={styles.summaryText}>
          保存后，账户会立即出现在首页和账户列表中，持仓也会同步计入资产分布。
        </Text>
        {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}
        <Pressable
          disabled={saving}
          onPressIn={() => {
            if (!saving) {
              setSaveMessage('准备保存账户...');
            }
          }}
          onPress={() => {
            void handleSave();
          }}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && !saving ? styles.saveButtonPressed : null,
            saving ? styles.saveButtonDisabled : null,
          ]}
        >
          <Ionicons name="save-outline" size={18} color={colors.white} />
          <Text style={styles.saveButtonLabel}>{saving ? '保存中...' : '保存到账户列表'}</Text>
        </Pressable>
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
  searchBlock: {
    gap: spacing.sm,
  },
  searchInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    backgroundColor: colors.surface,
  },
  searchHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineStatusText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.primaryMuted,
  },
  searchResults: {
    gap: spacing.sm,
  },
  searchResultItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  searchResultMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  searchResultSymbol: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  searchResultName: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.text,
  },
  searchResultMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshPriceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  refreshPriceText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.info,
  },
  disabledText: {
    color: colors.textMuted,
  },
  priceHint: {
    marginTop: -6,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.negative,
  },
  saveMessage: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.info,
  },
  summaryCard: {
    gap: spacing.sm,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.white,
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
