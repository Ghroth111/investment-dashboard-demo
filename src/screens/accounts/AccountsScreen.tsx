import { Ionicons } from '@expo/vector-icons';
import { startTransition, useDeferredValue, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountListItem } from '../../components/accounts/AccountListItem';
import { AppScreen } from '../../components/layout/AppScreen';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { LoadingCard } from '../../components/states/LoadingCard';
import { InputField } from '../../components/ui/InputField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { Account } from '../../types/models';
import type { AppTabScreenProps } from '../../navigation/types';

type PreviewState = 'normal' | 'loading' | 'error' | 'empty';
type FilterType = 'all' | Account['type'];

const previewOptions = [
  { label: '正常', value: 'normal' },
  { label: '加载', value: 'loading' },
  { label: '异常', value: 'error' },
  { label: '空状态', value: 'empty' },
];

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '券商', value: 'Brokerage' },
  { label: '基金', value: 'Fund' },
  { label: '加密', value: 'Crypto' },
  { label: '现金', value: 'Cash' },
  { label: '手动', value: 'Manual' },
];

export function AccountsScreen({ navigation }: AppTabScreenProps<'Accounts'>) {
  const accounts = useDemoStore((state) => state.accounts);
  const user = useDemoStore((state) => state.user);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [previewState, setPreviewState] = useState<PreviewState>('normal');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredAccounts = accounts.filter((account) => {
    const matchesFilter = filter === 'all' ? true : account.type === filter;
    const matchesSearch =
      deferredSearch.length === 0
        ? true
        : [account.name, account.platform, account.subtitle].some((value) =>
            value.toLowerCase().includes(deferredSearch),
          );

    return matchesFilter && matchesSearch;
  });

  function handleSearchChange(text: string) {
    startTransition(() => {
      setSearch(text);
    });
  }

  function renderList() {
    if (previewState === 'loading') {
      return (
        <>
          <LoadingCard height={14} />
          <LoadingCard height={14} />
          <LoadingCard height={14} />
        </>
      );
    }

    if (previewState === 'error') {
      return (
        <ErrorState
          title="账户列表加载失败"
          description="这里模拟了统一账户列表的异常状态，便于确认正式版的报错占位样式。"
          actionLabel="恢复列表"
          onAction={() => setPreviewState('normal')}
        />
      );
    }

    if (previewState === 'empty' || filteredAccounts.length === 0) {
      return (
        <EmptyState
          title="没有可展示的账户"
          description="尝试重置筛选，或者直接添加新的券商、基金、加密或手动账户。"
          actionLabel="添加账户"
          onAction={() => navigation.navigate('AddAccount')}
        />
      );
    }

    return filteredAccounts.map((account) => (
      <AccountListItem
        key={account.id}
        account={account}
        baseCurrency={user.baseCurrency}
        exchangeRates={exchangeRates}
        onPress={() => navigation.navigate('AccountDetail', { accountId: account.id })}
      />
    ));
  }

  return (
    <View style={styles.root}>
      <AppScreen contentStyle={styles.screenContent}>
        <View style={styles.header}>
          <Text style={styles.title}>账户</Text>
          <Text style={styles.description}>
            统一管理已接入的券商、基金、加密与手动录入账户。
          </Text>
        </View>

        <SurfaceCard style={styles.toolbar}>
          <InputField
            label="搜索账户或平台"
            value={search}
            onChangeText={handleSearchChange}
            placeholder="例如 Binance / Global Growth"
          />
          <View style={styles.optionBlock}>
            <Text style={styles.optionLabel}>账户类型</Text>
            <SegmentedControl
              options={filterOptions}
              value={filter}
              onChange={(next) => setFilter(next as FilterType)}
              compact
            />
          </View>
          <View style={styles.optionBlock}>
            <Text style={styles.optionLabel}>状态预览</Text>
            <SegmentedControl
              options={previewOptions}
              value={previewState}
              onChange={(next) => setPreviewState(next as PreviewState)}
              compact
            />
          </View>
        </SurfaceCard>

        {renderList()}
      </AppScreen>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddAccount')}>
        <Ionicons name="add" size={22} color={colors.white} />
        <Text style={styles.fabLabel}>添加账户</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenContent: {
    paddingBottom: 120,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  toolbar: {
    gap: spacing.md,
  },
  optionBlock: {
    gap: spacing.sm,
  },
  optionLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    minHeight: 54,
  },
  fabLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.white,
  },
});
