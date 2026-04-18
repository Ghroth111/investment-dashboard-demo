import { StyleSheet, Text, View } from 'react-native';

import { DistributionBars } from '../../components/chart/DistributionBars';
import { AssetSummaryCard } from '../../components/dashboard/AssetSummaryCard';
import { CompactAccountCard } from '../../components/dashboard/CompactAccountCard';
import { AppScreen } from '../../components/layout/AppScreen';
import { EmptyState } from '../../components/states/EmptyState';
import { Button } from '../../components/ui/Button';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import {
  convertAmount,
  getCategoryDistribution,
  getDashboardSummary,
  getPlatformDistribution,
  getTopAccounts,
} from '../../features/dashboard/selectors';
import type { AppTabScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { fontFamilies, spacing } from '../../theme';

export function DashboardScreen({ navigation }: AppTabScreenProps<'Dashboard'>) {
  const user = useDemoStore((state) => state.user);
  const accounts = useDemoStore((state) => state.accounts);
  const portfolioHistory = useDemoStore((state) => state.portfolioHistory);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);

  if (accounts.length === 0) {
    return (
      <AppScreen>
        <EmptyState
          title="你还没有接入任何账户"
          description="先添加第一个账户，让首页开始展示统一资产和收益概览。"
          actionLabel="添加账户"
          onAction={() => navigation.navigate('AddAccount')}
        />
      </AppScreen>
    );
  }

  const summary = getDashboardSummary(accounts, user.baseCurrency, exchangeRates);
  const categoryDistribution = getCategoryDistribution(accounts, user.baseCurrency, exchangeRates);
  const platformDistribution = getPlatformDistribution(accounts, user.baseCurrency, exchangeRates);
  const quickAccounts = getTopAccounts(accounts);
  const summaryTrendSeries = {
    '1D': portfolioHistory['1D'].map((point) => ({
      ...point,
      valueUsd: convertAmount(point.valueUsd, 'USD', user.baseCurrency, exchangeRates),
    })),
    '7D': portfolioHistory['7D'].map((point) => ({
      ...point,
      valueUsd: convertAmount(point.valueUsd, 'USD', user.baseCurrency, exchangeRates),
    })),
    '30D': portfolioHistory['30D'].map((point) => ({
      ...point,
      valueUsd: convertAmount(point.valueUsd, 'USD', user.baseCurrency, exchangeRates),
    })),
    '1Y': portfolioHistory['1Y'].map((point) => ({
      ...point,
      valueUsd: convertAmount(point.valueUsd, 'USD', user.baseCurrency, exchangeRates),
    })),
  };

  return (
    <AppScreen>
      <AssetSummaryCard
        summary={summary}
        currency={user.baseCurrency}
        trendSeries={summaryTrendSeries}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>账户速览</Text>
      </View>
      <View style={styles.quickGrid}>
        {quickAccounts.map((account) => (
          <CompactAccountCard
            key={account.id}
            account={account}
            baseCurrency={user.baseCurrency}
            exchangeRates={exchangeRates}
            onPress={() => navigation.navigate('AccountDetail', { accountId: account.id })}
          />
        ))}
      </View>

      <DistributionBars
        title="资产类别分布"
        subtitle="查看股票、ETF、基金、加密与现金的整体配置。"
        items={categoryDistribution}
        currency={user.baseCurrency}
      />

      <DistributionBars
        title="平台分布"
        subtitle="查看资产在不同平台和账户之间的分散情况。"
        items={platformDistribution}
        currency={user.baseCurrency}
      />

      <SurfaceCard style={styles.quickActions}>
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.actionButtons}>
          <Button
            label="添加账户"
            onPress={() => navigation.navigate('AddAccount')}
            icon="add-circle-outline"
            style={styles.actionButton}
          />
          <Button
            label="导入截图"
            onPress={() => navigation.navigate('ScreenshotImport')}
            icon="scan-outline"
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            label="查看交易"
            onPress={() => navigation.navigate('Transactions')}
            icon="receipt-outline"
            variant="ghost"
            style={styles.actionButton}
          />
        </View>
      </SurfaceCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: '#10233B',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  quickActions: {
    gap: spacing.md,
  },
  actionButtons: {
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
