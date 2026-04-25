import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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
import type { RootStackScreenProps } from '../../navigation/types';
import { fetchLatestPrice, searchUsStocks, type StockSearchResult } from '../../services/marketData';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import {
  Account,
  AccountType,
  AssetClass,
  CurrencyCode,
  ManualEntryPrefill,
  ManualHoldingInput,
} from '../../types/models';
import { formatDateTime } from '../../utils/formatters';

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
  showSearch: boolean;
  onChange: (patch: Partial<HoldingDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

type SaveMode = 'new' | 'existing';

const importDestinationOptions = [
  { label: 'Create New', value: 'new' },
  { label: 'Merge Existing', value: 'existing' },
];

const accountTypeOptions = [
  { label: 'Brokerage', value: 'Brokerage' },
  { label: 'Fund', value: 'Fund' },
  { label: 'Crypto', value: 'Crypto' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Manual', value: 'Manual' },
];

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'CNY', value: 'CNY' },
  { label: 'EUR', value: 'EUR' },
  { label: 'HKD', value: 'HKD' },
  { label: 'USDT', value: 'USDT' },
];

const accountTypeLabels: Record<AccountType, string> = {
  Brokerage: 'Brokerage',
  Fund: 'Fund',
  Crypto: 'Crypto',
  Cash: 'Cash',
  Manual: 'Manual',
};

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

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function HoldingEditorCard({
  holding,
  index,
  showSearch,
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
    if (!showSearch) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return;
    }

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
          setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.');
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
  }, [hasCommittedSelection, searchText, showSearch]);

  async function refreshPrice(overrides?: Partial<StockSearchResult>) {
    const symbol = overrides?.symbol || holding.symbol;
    if (!symbol) {
      Alert.alert('Missing symbol', 'Select or enter a symbol before refreshing the latest price.');
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
      setPriceError(error instanceof Error ? error.message : 'Unable to refresh the latest price.');
    } finally {
      setPriceLoading(false);
    }
  }

  async function handlePickResult(result: StockSearchResult) {
    setHasCommittedSelection(true);
    setSearchResults([]);
    setSearchError('');
    setSearchText(`${result.symbol} / ${result.name}`);

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
        <Text style={styles.sectionTitle}>Holding #{index + 1}</Text>
        {canRemove ? (
          <Pressable onPress={onRemove} hitSlop={10}>
            <Ionicons name="trash-outline" size={18} color={colors.negative} />
          </Pressable>
        ) : null}
      </View>

      {showSearch ? (
        <View style={styles.searchBlock}>
          <Text style={styles.optionLabel}>Search US symbol</Text>
          <TextInput
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              setHasCommittedSelection(false);
              setPriceError('');
            }}
            placeholder="AAPL / Apple / Nvidia"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.searchHint}>
            {/* 选择后自动填充资产信息和最新价格 */}
          </Text>
          {searchLoading ? (
            <View style={styles.inlineStatus}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.inlineStatusText}>Searching...</Text>
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
                    {result.exchange} / {result.instrumentType}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {holding.symbol && holding.name ? (
        <View style={styles.selectedSymbolBlock}>
          <View style={styles.selectedSymbolRow}>
            <Text style={styles.selectedSymbol}>{holding.symbol}</Text>
            <Text style={styles.selectedName}>{holding.name}</Text>
          </View>
          <Text style={styles.selectedMeta}>
            {holding.exchange ? `${holding.exchange} · ` : ''}{holding.assetClass}
          </Text>
          {priceLoading ? (
            <View style={styles.inlineStatus}>
              <ActivityIndicator size="small" color={colors.info} />
              <Text style={styles.inlineStatusText}>Fetching price...</Text>
            </View>
          ) : null}
          {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
        </View>
      ) : null}

      <InputField
        label="Quantity"
        value={holding.quantity}
        onChangeText={(text) => onChange({ quantity: text })}
        keyboardType="decimal-pad"
        placeholder="0"
      />
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

function ExistingAccountOption({
  account,
  active,
  onPress,
}: {
  account: Account;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.accountOption,
        active ? styles.accountOptionActive : null,
        pressed ? styles.accountOptionPressed : null,
      ]}
    >
      <View style={styles.accountOptionMain}>
        <Text style={[styles.accountOptionTitle, active ? styles.accountOptionTitleActive : null]}>
          {account.name}
        </Text>
        <Text style={styles.accountOptionMeta}>
          {accountTypeLabels[account.type]} / {account.currency} / {account.holdings.length} holdings
        </Text>
      </View>
      <Text style={styles.accountOptionDate}>{formatDateTime(account.updatedAt)}</Text>
    </Pressable>
  );
}

export function ManualEntryScreen({ navigation, route }: RootStackScreenProps<'ManualEntry'>) {
  const addManualAccount = useDemoStore((state) => state.addManualAccount);
  const accounts = useDemoStore((state) => state.accounts);
  const prefill = route.params?.prefill;
  const showImportDestination = Boolean(prefill && accounts.length > 0);

  const matchedExistingAccount = useMemo(() => {
    const lookupTokens = [normalizeText(prefill?.name), normalizeText(prefill?.platform)].filter(Boolean);
    if (lookupTokens.length === 0) {
      return undefined;
    }

    return accounts.find((account) => {
      const name = normalizeText(account.name);
      const platform = normalizeText(account.platform);
      return lookupTokens.includes(name) || lookupTokens.includes(platform);
    });
  }, [accounts, prefill?.name, prefill?.platform]);

  const [saveMode, setSaveMode] = useState<SaveMode>(showImportDestination ? 'existing' : 'new');
  const [existingAccountId, setExistingAccountId] = useState('');
  const [accountName, setAccountName] = useState(prefill?.name || prefill?.platform || '');
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
  const [accountSetupExpanded, setAccountSetupExpanded] = useState(false);

  useEffect(() => {
    if (!showImportDestination || existingAccountId) {
      return;
    }

    setExistingAccountId(matchedExistingAccount?.id ?? accounts[0]?.id ?? '');
  }, [accounts, existingAccountId, matchedExistingAccount?.id, showImportDestination]);

  useEffect(() => {
    if (!showImportDestination && saveMode !== 'new') {
      setSaveMode('new');
    }
  }, [saveMode, showImportDestination]);

  const selectedExistingAccount = accounts.find((account) => account.id === existingAccountId);

  useEffect(() => {
    if (saveMode !== 'existing' || !selectedExistingAccount) {
      return;
    }

    setAccountType(selectedExistingAccount.type);
    setCurrency(selectedExistingAccount.currency);
    setCashBalance(
      prefill?.cashBalance !== null && prefill?.cashBalance !== undefined
        ? String(prefill.cashBalance)
        : String(selectedExistingAccount.cashBalance),
    );
  }, [prefill?.cashBalance, saveMode, selectedExistingAccount]);

  const matchingHoldingCount = useMemo(() => {
    if (!selectedExistingAccount) {
      return 0;
    }

    const existingSymbols = new Set(
      selectedExistingAccount.holdings.map((holding) => normalizeSymbol(holding.symbol)),
    );

    return holdings.reduce((count, holding) => {
      if (!holding.symbol) {
        return count;
      }

      return existingSymbols.has(normalizeSymbol(holding.symbol)) ? count + 1 : count;
    }, 0);
  }, [holdings, selectedExistingAccount]);

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

    setSaveMessage('Validating account data...');

    if (saveMode === 'existing' && !selectedExistingAccount) {
      setSaveMessage('Select an existing account before saving.');
      Alert.alert('Missing account', 'Choose one existing account to merge the imported holdings into.');
      return;
    }

    if (saveMode === 'new' && !accountName.trim()) {
      setAccountName('手动账户');
    }

    const parsedCashBalance = Number.parseFloat(cashBalance || '0');
    if (Number.isNaN(parsedCashBalance)) {
      setSaveMessage('Cash balance must be a valid number.');
      Alert.alert('Invalid cash balance', 'Please enter a valid cash balance.');
      return;
    }

    const nextHoldings = holdings.map((holding) => ({ ...holding }));
    let refreshedMissingPrice = false;

    for (const holding of nextHoldings) {
      if (holding.currentPrice.trim() || !holding.symbol.trim()) {
        continue;
      }

      try {
        setSaveMessage(`Refreshing the latest price for ${normalizeSymbol(holding.symbol)}...`);
        const quote = await fetchLatestPrice({
          symbol: normalizeSymbol(holding.symbol),
          exchange: holding.exchange,
          micCode: holding.micCode,
          country: holding.country,
          type: holding.instrumentType,
        });
        holding.currentPrice = formatLivePrice(quote.price);
        refreshedMissingPrice = true;
      } catch {
        // Validation below will stop the save if the price is still missing.
      }
    }

    if (refreshedMissingPrice) {
      setHoldings(nextHoldings);
    }

    const parsedHoldings: ManualHoldingInput[] = [];

    for (const holding of nextHoldings) {
      if (!holding.symbol.trim() || !holding.name.trim()) {
        const message =
          `Holding #${parsedHoldings.length + 1} 缺少证券信息，请先搜索选择一个标的。`;
        setSaveMessage(message);
        Alert.alert('Incomplete holding', message);
        return;
      }

      const quantity = Number.parseFloat(holding.quantity);
      if (Number.isNaN(quantity) || quantity <= 0) {
        const message =
          `Holding #${parsedHoldings.length + 1} 请输入有效的持仓数量。`;
        setSaveMessage(message);
        Alert.alert('Incomplete holding', message);
        return;
      }

      const currentPrice = Number.parseFloat(holding.currentPrice) || 0;
      const costBasis = Number.parseFloat(holding.costBasis) || currentPrice;

      parsedHoldings.push({
        name: holding.name.trim(),
        symbol: normalizeSymbol(holding.symbol),
        assetClass: holding.assetClass,
        quantity,
        currentPrice,
        costBasis,
      });
    }

    try {
      setSaving(true);
      setSaveMessage(
        saveMode === 'existing'
          ? 'Merging imported holdings into the selected account...'
          : 'Creating the new account...',
      );

      const resolvedAccount = selectedExistingAccount;
      const resolvedName = saveMode === 'existing' ? resolvedAccount?.name ?? '' : (accountName.trim() || '手动账户');
      const resolvedType = saveMode === 'existing' ? resolvedAccount?.type ?? accountType : accountType;
      const resolvedCurrency =
        saveMode === 'existing' ? resolvedAccount?.currency ?? currency : currency;

      const accountId = await addManualAccount({
        name: resolvedName,
        platform: resolvedName,
        type: resolvedType,
        currency: resolvedCurrency,
        cashBalance: parsedCashBalance,
        holdings: parsedHoldings,
        targetAccountId: saveMode === 'existing' ? resolvedAccount?.id : undefined,
      });

      navigation.reset({
        index: 1,
        routes: [{ name: 'MainTabs' }, { name: 'AccountDetail', params: { accountId } }],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save the account right now.';
      setSaveMessage(message);
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen>
      {/* <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Manual Entry</Text>
          <Text style={styles.description}>
            {prefill
              ? 'Review the recognized holdings, then choose whether to merge them into an existing account or save them as a new one.'
              : 'Create or update an account manually when no live connection is available.'}
          </Text>
        </View>
      </View> */}

      {showImportDestination ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>Import Destination</Text>
          <Text style={styles.sectionDescription}>
            You can save this import as a new account or merge it into an existing one.
          </Text>
          <SegmentedControl options={importDestinationOptions} value={saveMode} onChange={(value) => setSaveMode(value as SaveMode)} />

          {saveMode === 'existing' ? (
            <View style={styles.accountOptionList}>
              {accounts.map((account) => (
                <ExistingAccountOption
                  key={account.id}
                  account={account}
                  active={account.id === existingAccountId}
                  onPress={() => setExistingAccountId(account.id)}
                />
              ))}
              <View style={styles.importTip}>
                <Ionicons name="swap-horizontal-outline" size={16} color={colors.info} />
                <Text style={styles.importTipText}>
                  {matchingHoldingCount > 0
                    ? `${matchingHoldingCount} matching holding${matchingHoldingCount > 1 ? 's' : ''} will use the imported quantity by default. Unmatched holdings stay in the account and new symbols will be appended.`
                    : 'Matching holdings in the selected account will use the imported quantity by default. Unmatched holdings stay in the account and new symbols will be appended.'}
                </Text>
              </View>
            </View>
          ) : (
            <InputField
              label="Account Name"
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Retirement Portfolio"
            />
          )}
        </SurfaceCard>
      ) : null}

      {holdings.map((holding, index) => (
        <HoldingEditorCard
          key={holding.id}
          holding={holding}
          index={index}
          showSearch={!prefill}
          canRemove={holdings.length > 1}
          onRemove={() => removeHolding(holding.id)}
          onChange={(patch) => updateHolding(holding.id, patch)}
        />
      ))}

      <Button label="Add Holding" onPress={addHolding} icon="add-outline" variant="secondary" />

      <SurfaceCard style={styles.card}>
        <Pressable
          onPress={() => setAccountSetupExpanded((prev) => !prev)}
          style={styles.collapsibleHeader}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Text style={styles.sectionTitle}>Account Setup</Text>
            <Text style={styles.collapsibleHint}>
              {accountSetupExpanded ? '点击收起' : '可选，留空将使用默认值'}
            </Text>
          </View>
          <Text style={styles.collapsibleIcon}>{accountSetupExpanded ? '▲' : '▼'}</Text>
        </Pressable>

        {accountSetupExpanded ? (
          <>
            {!showImportDestination ? (
              <InputField
                label="Account Name"
                value={accountName}
                onChangeText={setAccountName}
                placeholder="手动账户"
              />
            ) : null}

            {saveMode === 'existing' && selectedExistingAccount ? (
              <View style={styles.readOnlyBox}>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Account</Text>
                  <Text style={styles.readOnlyValue}>{selectedExistingAccount.name}</Text>
                </View>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Type</Text>
                  <Text style={styles.readOnlyValue}>{accountTypeLabels[selectedExistingAccount.type]}</Text>
                </View>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Currency</Text>
                  <Text style={styles.readOnlyValue}>{selectedExistingAccount.currency}</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.optionBlock}>
                  <Text style={styles.optionLabel}>Account Type</Text>
                  <SegmentedControl
                    options={accountTypeOptions}
                    value={accountType}
                    onChange={(next) => setAccountType(next as AccountType)}
                    compact
                  />
                </View>
                <View style={styles.optionBlock}>
                  <Text style={styles.optionLabel}>Quote Currency</Text>
                  <SegmentedControl
                    options={currencyOptions}
                    value={currency}
                    onChange={(next) => setCurrency(next as CurrencyCode)}
                    compact
                  />
                </View>
              </>
            )}

            <InputField
              label="Cash Balance"
              value={cashBalance}
              onChangeText={setCashBalance}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </>
        ) : null}
      </SurfaceCard>

      {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}
      <Pressable
        disabled={saving}
        onPressIn={() => {
          if (!saving) {
            setSaveMessage('Preparing account changes...');
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
        <Text style={styles.saveButtonLabel}>
          {saving ? 'Saving...' : saveMode === 'existing' ? 'Merge Into Account' : 'Save'}
        </Text>
      </Pressable>
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
  sectionDescription: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsibleHeaderLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  collapsibleHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  collapsibleIcon: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
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
  selectedSymbolBlock: {
    gap: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  selectedSymbolRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  selectedSymbol: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    color: colors.text,
  },
  selectedName: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.text,
  },
  selectedMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.negative,
  },
  accountOptionList: {
    gap: spacing.sm,
  },
  accountOption: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  accountOptionActive: {
    borderColor: colors.info,
    backgroundColor: colors.infoSoft,
  },
  accountOptionPressed: {
    opacity: 0.92,
  },
  accountOptionMain: {
    gap: spacing.xs,
  },
  accountOptionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  accountOptionTitleActive: {
    color: colors.primary,
  },
  accountOptionMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  accountOptionDate: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  importTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.infoSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  importTipText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  readOnlyBox: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  readOnlyLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  readOnlyValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.text,
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
  saveMessage: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.info,
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
});
