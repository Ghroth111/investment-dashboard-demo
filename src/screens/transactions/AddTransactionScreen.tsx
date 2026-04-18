import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CategoryGrid } from '../../components/transactions/CategoryGrid';
import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import {
  customCategoryLabel,
  getTransactionCategories,
  transactionTypeOptions,
} from '../../features/transactions/config';
import type { RootStackScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { TransactionCategory, TransactionType } from '../../types/models';

const keypadRows = [
  ['7', '8', '9', 'backspace'],
  ['4', '5', '6', 'plus'],
  ['1', '2', '3', 'minus'],
  ['clear', '0', '.', 'confirm'],
];

function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildTransactionTitle(category: TransactionCategory, note: string, type: TransactionType) {
  const trimmed = note.trim();

  if (type === 'transfer') {
    return 'Transfer';
  }

  if (trimmed.length === 0) {
    return category;
  }

  return trimmed.length > 28 ? `${trimmed.slice(0, 28)}...` : trimmed;
}

export function AddTransactionScreen({
  navigation,
}: RootStackScreenProps<'AddTransaction'>) {
  const user = useDemoStore((state) => state.user);
  const accounts = useDemoStore((state) => state.accounts);
  const addTransaction = useDemoStore((state) => state.addTransaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);
  const [amountInput, setAmountInput] = useState('0');
  const [note, setNote] = useState('');
  const [dateInput, setDateInput] = useState(todayInputValue());
  const [selectedAccountId, setSelectedAccountId] = useState<string>('cash-wallet');
  const [fromAccountId, setFromAccountId] = useState<string>('cash-wallet');
  const [toAccountId, setToAccountId] = useState<string>('acct-broker-us');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState<Record<TransactionType, string[]>>({
    expense: [],
    income: [],
    transfer: [],
  });

  const revealAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSelectedCategory(null);
    setCustomCategoryName('');
    Animated.timing(revealAnimation, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [revealAnimation, type]);

  useEffect(() => {
    Animated.timing(revealAnimation, {
      toValue: selectedCategory ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [revealAnimation, selectedCategory]);

  const accountOptions = useMemo(
    () => [
      { id: 'cash-wallet', label: 'Cash Wallet', currency: user.baseCurrency },
      ...accounts.map((account) => ({
        id: account.id,
        label: account.name,
        currency: account.currency,
      })),
    ],
    [accounts, user.baseCurrency],
  );

  const selectedAccount =
    accountOptions.find((option) => option.id === selectedAccountId) ?? accountOptions[0];
  const fromAccount =
    accountOptions.find((option) => option.id === fromAccountId) ?? accountOptions[0];
  const toAccount =
    accountOptions.find((option) => option.id === toAccountId) ?? accountOptions[1] ?? accountOptions[0];
  const categories = getTransactionCategories(type, customCategories[type]);
  const parsedAmount = Number.parseFloat(amountInput);
  const resolvedCategory =
    selectedCategory === customCategoryLabel ? customCategoryName.trim() : selectedCategory;
  const canSave =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    !!resolvedCategory &&
    (type !== 'transfer' || fromAccountId !== toAccountId);

  function handleCategorySelect(category: TransactionCategory) {
    setSelectedCategory(category);
  }

  function handleKeyPress(key: string) {
    if (key === 'plus') {
      setType('income');
      return;
    }

    if (key === 'minus') {
      setType('expense');
      return;
    }

    if (key === 'confirm') {
      handleSave();
      return;
    }

    if (key === 'clear') {
      setAmountInput('0');
      return;
    }

    setAmountInput((current) => {
      if (key === 'backspace') {
        if (current.length <= 1) {
          return '0';
        }

        const next = current.slice(0, -1);
        return next === '' ? '0' : next;
      }

      if (key === '.') {
        return current.includes('.') ? current : `${current}.`;
      }

      if (current === '0') {
        return key;
      }

      return `${current}${key}`;
    });
  }

  function addCustomCategory() {
    const trimmed = customCategoryName.trim();

    if (!trimmed) {
      Alert.alert('Category name required', 'Enter a custom category name first.');
      return;
    }

    setCustomCategories((current) => {
      if (current[type].includes(trimmed)) {
        return current;
      }

      return {
        ...current,
        [type]: [...current[type], trimmed],
      };
    });
    setSelectedCategory(trimmed);
  }

  function handleSave() {
    if (!canSave || !resolvedCategory) {
      Alert.alert('Incomplete entry', 'Choose a category, enter an amount, and complete the required fields.');
      return;
    }

    if (type === 'transfer' && fromAccountId === toAccountId) {
      Alert.alert('Invalid transfer', 'Choose two different accounts for the transfer.');
      return;
    }

    const transactionDate = new Date(`${dateInput}T12:00:00`).toISOString();

    addTransaction({
      title: buildTransactionTitle(resolvedCategory, note, type),
      type,
      category: resolvedCategory,
      subCategory: resolvedCategory,
      amount: parsedAmount,
      currency: type === 'transfer' ? fromAccount.currency : selectedAccount.currency,
      date: transactionDate,
      note,
      account:
        type === 'transfer'
          ? `${fromAccount.label} → ${toAccount.label}`
          : selectedAccount.label,
      accountId:
        type === 'transfer'
          ? fromAccount.id === 'cash-wallet'
            ? undefined
            : fromAccount.id
          : selectedAccount.id === 'cash-wallet'
            ? undefined
            : selectedAccount.id,
    });

    navigation.goBack();
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Add Transaction</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
      </View>

      <SurfaceCard style={styles.topCard}>
        <SegmentedControl
          options={transactionTypeOptions.map((item) => ({
            label: item.label,
            value: item.value,
          }))}
          value={type}
          onChange={(next) => setType(next as TransactionType)}
        />
      </SurfaceCard>

      <SurfaceCard style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <Text style={styles.sectionTitle}>Category</Text>
          {!selectedCategory ? (
            <View style={styles.hintWrap}>
              <Ionicons name="arrow-up-outline" size={14} color={colors.accent} />
              <Text style={styles.hintText}>Choose one to unlock amount and details</Text>
            </View>
          ) : null}
        </View>
        <CategoryGrid
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleCategorySelect}
        />
      </SurfaceCard>

      <Animated.View
        pointerEvents={selectedCategory ? 'auto' : 'none'}
        style={[
          styles.editorWrap,
          {
            opacity: revealAnimation,
            transform: [
              {
                translateY: revealAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [36, 0],
                }),
              },
            ],
          },
        ]}
      >
        {selectedCategory ? (
          <>
            <SurfaceCard style={styles.editorCard}>
              <View style={styles.amountHeader}>
                <View>
                  <Text style={styles.selectedCategoryLabel}>
                    {resolvedCategory || selectedCategory}
                  </Text>
                  <Text style={styles.amountCurrency}>
                    {type === 'transfer' ? fromAccount.currency : selectedAccount.currency}
                  </Text>
                </View>
                <Text style={styles.amountValue}>{amountInput}</Text>
              </View>

              {selectedCategory === customCategoryLabel ? (
                <View style={styles.customCategoryBlock}>
                  <InputField
                    label="Custom category name"
                    value={customCategoryName}
                    onChangeText={setCustomCategoryName}
                    placeholder="Name your category"
                  />
                  <Button label="Add Category" onPress={addCustomCategory} variant="secondary" />
                </View>
              ) : null}

              <View style={styles.keypad}>
                {keypadRows.flat().map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => handleKeyPress(key)}
                    style={[
                      styles.key,
                      key === 'confirm' ? styles.keyConfirm : null,
                      key === 'plus' || key === 'minus' ? styles.keyAccent : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.keyText,
                        key === 'confirm' ? styles.keyTextConfirm : null,
                      ]}
                    >
                      {key === 'backspace'
                        ? '⌫'
                        : key === 'plus'
                          ? '+'
                          : key === 'minus'
                            ? '-'
                            : key === 'confirm'
                              ? 'OK'
                              : key === 'clear'
                                ? 'C'
                                : key}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SurfaceCard>

            <SurfaceCard style={styles.editorCard}>
              <Text style={styles.sectionTitle}>Details</Text>
              <InputField
                label="Date"
                value={dateInput}
                onChangeText={setDateInput}
                placeholder="YYYY-MM-DD"
              />
              <InputField
                label="Note"
                value={note}
                onChangeText={setNote}
                placeholder={
                  type === 'transfer' ? 'Optional transfer note' : 'Optional note'
                }
              />

              {type === 'transfer' ? (
                <>
                  <View style={styles.accountBlock}>
                    <Text style={styles.accountLabel}>From account</Text>
                    <View style={styles.accountChips}>
                      {accountOptions.slice(0, 6).map((option) => {
                        const active = option.id === fromAccountId;

                        return (
                          <Pressable
                            key={`from-${option.id}`}
                            onPress={() => setFromAccountId(option.id)}
                            style={[styles.accountChip, active ? styles.accountChipActive : null]}
                          >
                            <Text
                              style={[
                                styles.accountChipText,
                                active ? styles.accountChipTextActive : null,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.accountBlock}>
                    <Text style={styles.accountLabel}>To account</Text>
                    <View style={styles.accountChips}>
                      {accountOptions.slice(0, 6).map((option) => {
                        const active = option.id === toAccountId;

                        return (
                          <Pressable
                            key={`to-${option.id}`}
                            onPress={() => setToAccountId(option.id)}
                            style={[styles.accountChip, active ? styles.accountChipActive : null]}
                          >
                            <Text
                              style={[
                                styles.accountChipText,
                                active ? styles.accountChipTextActive : null,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.accountBlock}>
                  <Text style={styles.accountLabel}>Account</Text>
                  <View style={styles.accountChips}>
                    {accountOptions.slice(0, 6).map((option) => {
                      const active = option.id === selectedAccountId;

                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => setSelectedAccountId(option.id)}
                          style={[styles.accountChip, active ? styles.accountChipActive : null]}
                        >
                          <Text
                            style={[
                              styles.accountChipText,
                              active ? styles.accountChipTextActive : null,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </SurfaceCard>
          </>
        ) : null}
      </Animated.View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    color: colors.text,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  topCard: {
    gap: spacing.md,
  },
  categoryCard: {
    gap: spacing.md,
  },
  categoryHeader: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  hintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hintText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.accent,
  },
  editorWrap: {
    gap: spacing.lg,
  },
  editorCard: {
    gap: spacing.md,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  selectedCategoryLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: 20,
    color: colors.text,
  },
  amountCurrency: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  amountValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 42,
    color: colors.text,
    letterSpacing: -0.8,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  key: {
    width: '23%',
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyAccent: {
    backgroundColor: colors.infoSoft,
  },
  keyConfirm: {
    backgroundColor: colors.primary,
  },
  keyText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  keyTextConfirm: {
    color: colors.white,
  },
  customCategoryBlock: {
    gap: spacing.sm,
  },
  accountBlock: {
    gap: spacing.sm,
  },
  accountLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  accountChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  accountChip: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountChipActive: {
    backgroundColor: colors.primary,
  },
  accountChipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.text,
  },
  accountChipTextActive: {
    color: colors.white,
  },
});
