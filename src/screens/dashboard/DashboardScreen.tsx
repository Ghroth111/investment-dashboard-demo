import { StyleSheet, Text, View } from 'react-native';

import { MergedHoldingListCard } from '../../components/dashboard/MergedHoldingListCard';
import { AssetSummaryCard } from '../../components/dashboard/AssetSummaryCard';
import { CompactAccountCard } from '../../components/dashboard/CompactAccountCard';
import { AppScreen } from '../../components/layout/AppScreen';
import { EmptyState } from '../../components/states/EmptyState';
import { Button } from '../../components/ui/Button';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { buildAggregatedAssets, groupAssetsByClass } from '../../features/assets/selectors';
import { getTopAccounts } from '../../features/dashboard/selectors';
import type { AppTabScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { fontFamilies, spacing } from '../../theme';

export function DashboardScreen({ navigation }: AppTabScreenProps<'Dashboard'>) {
  const user = useDemoStore((state) => state.user);
  const accounts = useDemoStore((state) => state.accounts);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const portfolioHistory = useDemoStore((state) => state.portfolioHistory);

  if (accounts.length === 0) {
    return (
      <AppScreen>
        <EmptyState
          title="还没有接入任何账户"
          description="添加第一个投资账户后，这里会开始汇总你的资产、持仓和分析数据。"
          actionLabel="添加账户"
          onAction={() => navigation.navigate('AddAccount')}
        />
      </AppScreen>
    );
  }

  const quickAccounts = getTopAccounts(accounts);
  const groupedAssets = groupAssetsByClass(
    buildAggregatedAssets(accounts, user.baseCurrency, exchangeRates),
  );

  return (
    <AppScreen>
      <AssetSummaryCard
        accounts={accounts}
        currency={user.baseCurrency}
        exchangeRates={exchangeRates}
        portfolioHistory={portfolioHistory}
        onAnalyticsPress={() => navigation.navigate('Accounts')}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>重点账户</Text>
        <Text style={styles.sectionDescription}>保留最常用的账户入口，方便直接进入账户详情。</Text>
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

      <MergedHoldingListCard
        sections={groupedAssets}
        currency={user.baseCurrency}
        onAssetPress={(assetKey) => navigation.navigate('AssetDetail', { assetKey })}
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
            label="截图导入"
            onPress={() => navigation.navigate('ScreenshotImport')}
            icon="scan-outline"
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            label="查看流水"
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
  sectionDescription: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: '#5E6F84',
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
