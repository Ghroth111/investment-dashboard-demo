import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { HoldingRow } from '../../components/accounts/HoldingRow';
import { AppScreen } from '../../components/layout/AppScreen';
import { ErrorState } from '../../components/states/ErrorState';
import { Button } from '../../components/ui/Button';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { convertAmount, getAccountMetrics } from '../../features/dashboard/selectors';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, spacing } from '../../theme';
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatSignedCurrency,
} from '../../utils/formatters';
import type { RootStackScreenProps } from '../../navigation/types';

type SyncState = 'idle' | 'syncing' | 'error' | 'success';

export function AccountDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'AccountDetail'>) {
  const user = useDemoStore((state) => state.user);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const accounts = useDemoStore((state) => state.accounts);
  const deleteAccount = useDemoStore((state) => state.deleteAccount);
  const account = accounts.find((item) => item.id === route.params.accountId);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [firstRefreshShouldFail, setFirstRefreshShouldFail] = useState(true);

  if (!account) {
    return (
      <AppScreen>
        <ErrorState
          title="账户不存在"
          description="当前账户可能已经被删除，或者 mock 路由参数已失效。"
          actionLabel="返回账户列表"
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

  function handleDelete() {
    Alert.alert('删除账户', '这会从当前前端 mock 状态中移除该账户以及关联记录。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteAccount(currentAccount.id);
          navigation.goBack();
        },
      },
    ]);
  }

  function handleRefresh() {
    setSyncState('syncing');

    setTimeout(() => {
      if (firstRefreshShouldFail) {
        setSyncState('error');
        setFirstRefreshShouldFail(false);
        return;
      }

      setSyncState('success');
    }, 900);
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.platform}>{account.platform}</Text>
          <Text style={styles.title}>{currentAccount.name}</Text>
          <Text style={styles.subtitle}>{currentAccount.subtitle}</Text>
        </View>
      </View>

      <SurfaceCard style={styles.heroCard}>
        <Text style={styles.heroValue}>{formatCurrency(totalValue, user.baseCurrency, 0)}</Text>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricLabel}>累计收益</Text>
            <Text style={[styles.heroMetricValue, totalReturn >= 0 ? styles.positive : styles.negative]}>
              {formatSignedCurrency(totalReturn, user.baseCurrency, 0)}
            </Text>
          </View>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricLabel}>收益率</Text>
            <Text style={styles.heroMetricValue}>{formatPercent(metrics.cumulativeReturnRate)}</Text>
          </View>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricLabel}>现金余额</Text>
            <Text style={styles.heroMetricValue}>{formatCurrency(cashBalance, user.baseCurrency, 0)}</Text>
          </View>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricLabel}>最近更新</Text>
            <Text style={styles.heroMetricValue}>{formatDateTime(currentAccount.updatedAt)}</Text>
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.actionCard}>
        <Text style={styles.sectionTitle}>账户操作</Text>
        <View style={styles.actionButtons}>
          <Button
            label="编辑账户"
            onPress={() =>
              Alert.alert('编辑账户', '当前首轮 Demo 仅保留按钮位置，后续阶段再接编辑表单。')
            }
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            label={syncState === 'syncing' ? '刷新中...' : '刷新数据'}
            onPress={handleRefresh}
            variant="ghost"
            style={styles.actionButton}
            disabled={syncState === 'syncing'}
          />
          <Button
            label="删除账户"
            onPress={handleDelete}
            variant="danger"
            style={styles.actionButton}
          />
        </View>

        {syncState === 'error' ? (
          <View style={[styles.syncBanner, styles.syncError]}>
            <Ionicons name="warning-outline" size={16} color={colors.negative} />
            <Text style={styles.syncText}>模拟同步失败，正式版这里会展示错误原因与重试策略。</Text>
          </View>
        ) : null}
        {syncState === 'success' ? (
          <View style={[styles.syncBanner, styles.syncSuccess]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.positive} />
            <Text style={styles.syncText}>已完成一次 mock 刷新，最近同步时间已更新样式验证。</Text>
          </View>
        ) : null}
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>持仓明细</Text>
        {currentAccount.holdings.map((holding) => (
          <HoldingRow
            key={holding.id}
            holding={holding}
            baseCurrency={user.baseCurrency}
            exchangeRates={exchangeRates}
          />
        ))}
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>说明</Text>
        <Text style={styles.noteLine}>
          数据来源：{currentAccount.sourceType === 'manual' ? '手动录入' : 'Mock API'}
        </Text>
        <Text style={styles.noteLine}>账户币种：{currentAccount.currency}</Text>
        <Text style={styles.noteLine}>未来可扩展：同步状态、接口健康度、编辑账户资料。</Text>
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
    color: colors.textMuted,
  },
  heroCard: {
    gap: spacing.lg,
  },
  heroValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    color: colors.text,
    letterSpacing: -0.4,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  heroMetric: {
    width: '50%',
    gap: spacing.xs,
  },
  heroMetricLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  heroMetricValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.text,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
  actionCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  actionButtons: {
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  syncError: {
    backgroundColor: colors.negativeSoft,
  },
  syncSuccess: {
    backgroundColor: colors.positiveSoft,
  },
  syncText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  noteLine: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});
