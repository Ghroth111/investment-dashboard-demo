import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DistributionBars } from '../../components/chart/DistributionBars';
import { LineChart } from '../../components/chart/LineChart';
import { AccountListItem } from '../../components/accounts/AccountListItem';
import { AssetSummaryCard } from '../../components/dashboard/AssetSummaryCard';
import { AppScreen } from '../../components/layout/AppScreen';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { LoadingCard } from '../../components/states/LoadingCard';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import {
  convertAmount,
  getCategoryDistribution,
  getDashboardSummary,
  getPlatformDistribution,
  getTopAccounts,
} from '../../features/dashboard/selectors';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, spacing } from '../../theme';
import type { TrendRange } from '../../types/models';
import { formatCurrency } from '../../utils/formatters';
import type { AppTabScreenProps } from '../../navigation/types';

type PreviewState = 'normal' | 'loading' | 'error' | 'empty';

const rangeOptions = [
  { label: '今日', value: '1D' },
  { label: '7 天', value: '7D' },
  { label: '30 天', value: '30D' },
  { label: '全部', value: 'ALL' },
];

const previewOptions = [
  { label: '正常', value: 'normal' },
  { label: '加载', value: 'loading' },
  { label: '异常', value: 'error' },
  { label: '空状态', value: 'empty' },
];

export function DashboardScreen({ navigation }: AppTabScreenProps<'Dashboard'>) {
  const user = useDemoStore((state) => state.user);
  const accounts = useDemoStore((state) => state.accounts);
  const portfolioHistory = useDemoStore((state) => state.portfolioHistory);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const [range, setRange] = useState<TrendRange>('7D');
  const [previewState, setPreviewState] = useState<PreviewState>('normal');

  const summary = getDashboardSummary(accounts, user.baseCurrency, exchangeRates);
  const categoryDistribution = getCategoryDistribution(accounts, user.baseCurrency, exchangeRates);
  const platformDistribution = getPlatformDistribution(accounts, user.baseCurrency, exchangeRates);
  const quickAccounts = getTopAccounts(accounts);
  const historyPoints = portfolioHistory[range].map((point) => ({
    ...point,
    valueUsd: convertAmount(point.valueUsd, 'USD', user.baseCurrency, exchangeRates),
  }));

  function renderStateBlock() {
    if (previewState === 'loading') {
      return (
        <>
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </>
      );
    }

    if (previewState === 'error') {
      return (
        <ErrorState
          title="资产看板暂时不可用"
          description="已模拟图表与汇总接口失败，正式版会在这里给出重试与同步状态。"
          actionLabel="恢复正常"
          onAction={() => setPreviewState('normal')}
        />
      );
    }

    if (previewState === 'empty' || accounts.length === 0) {
      return (
        <EmptyState
          title="你还没有接入任何账户"
          description="先添加第一个账户，让首页开始展示跨平台、多币种的统一资产视图。"
          actionLabel="添加账户"
          onAction={() => navigation.navigate('AddAccount')}
        />
      );
    }

    return (
      <>
        <AssetSummaryCard summary={summary} currency={user.baseCurrency} />

        <SegmentedControl
          options={rangeOptions}
          value={range}
          onChange={(next) => setRange(next as TrendRange)}
          compact
        />

        <LineChart
          title="资产趋势"
          subtitle="展示 mock 净值曲线，用于验证首页信息层级与图表位置。"
          points={historyPoints}
        />

        <DistributionBars
          title="资产类别分布"
          subtitle="股票、ETF、基金、加密与现金的整体配置情况。"
          items={categoryDistribution}
          currency={user.baseCurrency}
        />

        <DistributionBars
          title="平台分布"
          subtitle="查看资产在不同账户与平台之间的分散情况。"
          items={platformDistribution}
          currency={user.baseCurrency}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>账户快捷列表</Text>
          <Text style={styles.sectionSubtitle}>优先展示规模较大的 4 个账户</Text>
        </View>

        {quickAccounts.map((account) => (
          <AccountListItem
            key={account.id}
            account={account}
            baseCurrency={user.baseCurrency}
            exchangeRates={exchangeRates}
            onPress={() => navigation.navigate('AccountDetail', { accountId: account.id })}
          />
        ))}

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
              label="查看记录"
              onPress={() => navigation.navigate('Records')}
              icon="receipt-outline"
              variant="ghost"
              style={styles.actionButton}
            />
          </View>
        </SurfaceCard>
      </>
    );
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>资产总览</Text>
          <Text style={styles.title}>投资整合资产看板</Text>
          <Text style={styles.description}>
            {summary.accountCount} 个账户 · 当前基础货币 {user.baseCurrency} · 组合净值{' '}
            {formatCurrency(summary.totalAssets, user.baseCurrency, 0)}
          </Text>
        </View>
        <SurfaceCard style={styles.previewCard}>
          <Text style={styles.previewLabel}>状态预览</Text>
          <SegmentedControl
            options={previewOptions}
            value={previewState}
            onChange={(next) => setPreviewState(next as PreviewState)}
            compact
          />
        </SurfaceCard>
      </View>

      {renderStateBlock()}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
  },
  headerCopy: {
    gap: spacing.sm,
  },
  kicker: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.accent,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  previewCard: {
    gap: spacing.sm,
  },
  previewLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionHeader: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.textMuted,
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
