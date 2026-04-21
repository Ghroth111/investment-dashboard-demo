import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { HoldingRow } from '../../components/accounts/HoldingRow';
import { InteractivePerformanceChart } from '../../components/chart/InteractivePerformanceChart';
import { AppScreen } from '../../components/layout/AppScreen';
import { ErrorState } from '../../components/states/ErrorState';
import { Button } from '../../components/ui/Button';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { getHoldingAssetKey } from '../../features/assets/selectors';
import { convertAmount, getAccountMetrics } from '../../features/dashboard/selectors';
import { createEmptyPerformanceSeries } from '../../features/performance/series';
import type { RootStackScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, spacing } from '../../theme';
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatSignedCurrency,
} from '../../utils/formatters';

const accountTypeLabels = {
  Brokerage: 'Brokerage Account',
  Fund: 'Fund Account',
  Crypto: 'Crypto Account',
  Cash: 'Cash Account',
  Manual: 'Manual Account',
} as const;

const sourceLabels = {
  api: 'API Sync',
  manual: 'Manual Entry',
  screenshot: 'Screenshot Import',
  mock: 'Auto Sync',
} as const;

async function confirmDeleteAccount() {
  const browserConfirm = (globalThis as { confirm?: (message?: string) => boolean }).confirm;

  if (typeof browserConfirm === 'function') {
    return browserConfirm(
      'Deleting this account will remove the account, linked holdings, and related flow records from the current workspace.',
    );
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      'Delete Account',
      'Deleting this account will remove the account, linked holdings, and related flow records from the current workspace.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ],
    );
  });
}

export function AccountDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'AccountDetail'>) {
  const user = useDemoStore((state) => state.user);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const accounts = useDemoStore((state) => state.accounts);
  const deleteAccount = useDemoStore((state) => state.deleteAccount);
  const loadAccounts = useDemoStore((state) => state.loadAccounts);
  const account = accounts.find((item) => item.id === route.params.accountId);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshNote, setRefreshNote] = useState('');

  if (!account) {
    return (
      <AppScreen>
        <ErrorState
          title="Account not found"
          description="This account may have been removed or replaced by a newer import."
          actionLabel="Go Back"
          onAction={() => navigation.goBack()}
        />
      </AppScreen>
    );
  }

  const currentAccount = account;

  const metrics = getAccountMetrics(currentAccount);
  const totalValue = convertAmount(
    metrics.totalValue,
    currentAccount.currency,
    user.baseCurrency,
    exchangeRates,
  );
  const totalReturn = convertAmount(
    metrics.cumulativeReturn,
    currentAccount.currency,
    user.baseCurrency,
    exchangeRates,
  );
  const cashBalance = convertAmount(
    currentAccount.cashBalance,
    currentAccount.currency,
    user.baseCurrency,
    exchangeRates,
  );
  const todayChange = convertAmount(
    metrics.todayChange,
    currentAccount.currency,
    user.baseCurrency,
    exchangeRates,
  );
  const performanceSeries = useMemo(() => createEmptyPerformanceSeries(), []);

  async function handleDelete() {
    if (deleting) {
      return;
    }

    const shouldDelete = await confirmDeleteAccount();
    if (!shouldDelete) {
      return;
    }

    try {
      setDeleting(true);
      await deleteAccount(currentAccount.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Delete Failed',
        error instanceof Error ? error.message : 'Unable to remove the account right now.',
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleRefresh() {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);
      setRefreshNote('');
      await loadAccounts();
      setRefreshNote(`Last refresh completed at ${formatDateTime(new Date().toISOString())}`);
    } catch (error) {
      Alert.alert(
        'Refresh Failed',
        error instanceof Error ? error.message : 'Unable to refresh account data right now.',
      );
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.platform}>{currentAccount.platform}</Text>
          <Text style={styles.title}>{currentAccount.name}</Text>
          <Text style={styles.subtitle}>{currentAccount.subtitle}</Text>
        </View>
      </View>

      <InteractivePerformanceChart
        title="Holding Performance"
        subtitle={`${currentAccount.platform} · ${currentAccount.subtitle}`}
        currency={user.baseCurrency}
        series={performanceSeries}
        defaultRange="YTD"
        emptyMessage="账户详情页当前不再编造收益曲线；等后端记录到账户级历史快照后，这里会显示真实走势。"
      />

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Account Value</Text>
            <Text style={styles.metricValue}>{formatCurrency(totalValue, user.baseCurrency, 0)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Return</Text>
            <Text style={[styles.metricValue, totalReturn >= 0 ? styles.positive : styles.negative]}>
              {formatSignedCurrency(totalReturn, user.baseCurrency, 0)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Today P/L</Text>
            <Text style={[styles.metricValue, todayChange >= 0 ? styles.positive : styles.negative]}>
              {formatSignedCurrency(todayChange, user.baseCurrency, 0)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Return Rate</Text>
            <Text style={styles.metricValue}>{formatPercent(metrics.cumulativeReturnRate)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Cash Balance</Text>
            <Text style={styles.metricValue}>{formatCurrency(cashBalance, user.baseCurrency, 0)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Updated</Text>
            <Text style={styles.metricValue}>{formatDateTime(currentAccount.updatedAt)}</Text>
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Holdings</Text>
        <Text style={styles.sectionDescription}>
          Layout stays fully in English here so we can keep tuning spacing and alignment.
        </Text>
        {currentAccount.holdings.length === 0 ? (
          <Text style={styles.emptyText}>No holdings in this account yet.</Text>
        ) : (
          currentAccount.holdings.map((holding) => (
            <HoldingRow
              key={holding.id}
              holding={holding}
              baseCurrency={user.baseCurrency}
              exchangeRates={exchangeRates}
              onPress={() =>
                navigation.navigate('AssetDetail', {
                  accountId: currentAccount.id,
                  holdingId: holding.id,
                  assetKey: getHoldingAssetKey(holding),
                })
              }
            />
          ))
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.actionCard}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <View style={styles.actionButtons}>
          <Button
            label={refreshing ? 'Refreshing...' : 'Refresh Data'}
            onPress={() => {
              void handleRefresh();
            }}
            variant="secondary"
            icon="refresh-outline"
            style={styles.actionButton}
            disabled={refreshing}
          />
          <Button
            label="Add Transaction"
            onPress={() => navigation.navigate('AddTransaction')}
            variant="ghost"
            icon="receipt-outline"
            style={styles.actionButton}
          />
          <Button
            label={deleting ? 'Deleting...' : 'Delete Account'}
            onPress={() => {
              void handleDelete();
            }}
            variant="danger"
            icon="trash-outline"
            style={styles.actionButton}
            disabled={deleting}
          />
        </View>

        {refreshNote ? (
          <View style={styles.refreshBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.positive} />
            <Text style={styles.refreshText}>{refreshNote}</Text>
          </View>
        ) : null}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Account Profile</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Account Type</Text>
            <Text style={styles.metricValue}>{accountTypeLabels[currentAccount.type]}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Data Source</Text>
            <Text style={styles.metricValue}>{sourceLabels[currentAccount.sourceType]}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pricing Currency</Text>
            <Text style={styles.metricValue}>{currentAccount.currency}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Position Count</Text>
            <Text style={styles.metricValue}>{currentAccount.holdings.length}</Text>
          </View>
        </View>
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
  platform: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.accent,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 26,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  card: {
    gap: spacing.md,
  },
  actionCard: {
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  metricItem: {
    width: '50%',
    gap: spacing.xs,
  },
  metricLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  metricValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  actionButtons: {
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  refreshBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.positiveSoft,
  },
  refreshText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  emptyText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
