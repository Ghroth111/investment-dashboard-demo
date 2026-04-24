import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MergedHoldingListCard } from '../../components/dashboard/MergedHoldingListCard';
import { AssetSummaryCard } from '../../components/dashboard/AssetSummaryCard';
import { CompactAccountCard } from '../../components/dashboard/CompactAccountCard';
import { AppScreen } from '../../components/layout/AppScreen';
import { EmptyState } from '../../components/states/EmptyState';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { buildAggregatedAssets, groupAssetsByClass } from '../../features/assets/selectors';
import { getTopAccounts } from '../../features/dashboard/selectors';
import type { AppTabScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, spacing } from '../../theme';

export function DashboardScreen({ navigation }: AppTabScreenProps<'Dashboard'>) {
  const user = useDemoStore((state) => state.user);
  const accounts = useDemoStore((state) => state.accounts);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const portfolioHistory = useDemoStore((state) => state.portfolioHistory);
  const [accountsExpanded, setAccountsExpanded] = useState(false);

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

      <MergedHoldingListCard
        sections={groupedAssets}
        currency={user.baseCurrency}
        onAssetPress={(assetKey) => navigation.navigate('AssetDetail', { assetKey })}
      />

      <SurfaceCard style={styles.collapsibleCard}>
        <Pressable
          onPress={() => setAccountsExpanded((prev) => !prev)}
          style={styles.collapsibleHeader}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Text style={styles.sectionTitle}>重点账户</Text>
            <Text style={styles.collapsibleHint}>
              {accountsExpanded ? '点击收起' : `${quickAccounts.length} 个账户，点击展开`}
            </Text>
          </View>
          <Text style={styles.collapsibleIcon}>{accountsExpanded ? '▲' : '▼'}</Text>
        </Pressable>

        {accountsExpanded ? (
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
        ) : null}
      </SurfaceCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
  collapsibleCard: {
    gap: spacing.md,
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
    color: '#5E6F84',
  },
  collapsibleIcon: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});
