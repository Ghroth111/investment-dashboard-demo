import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { convertAmount, getAccountMetrics } from '../../features/dashboard/selectors';
import type { RootStackScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { AssetClass, ExchangeRates, Holding } from '../../types/models';
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatSignedCurrency,
} from '../../utils/formatters';

type DetailEntry = {
  id: string;
  kind: 'holding' | 'cash';
  name: string;
  symbol: string;
  accountId: string;
  accountName: string;
  platform: string;
  value: number;
  quantity: number | null;
  unitPrice: number | null;
  pnl: number;
  pnlRate: number;
  dailyChange: number;
  updatedAt: string;
};

const assetClassLabels: Record<AssetClass | 'Cash', string> = {
  Stock: '股票',
  ETF: 'ETF',
  Fund: '基金',
  Crypto: '加密资产',
  Cash: '现金',
};

function buildHoldingEntry(
  account: {
    id: string;
    name: string;
    platform: string;
    currency: Holding['currency'];
    updatedAt: string;
  },
  holding: Holding,
  rates: ExchangeRates,
  baseCurrency: Holding['currency'],
): DetailEntry {
  const marketValue = holding.currentPrice * holding.quantity;
  const costValue = holding.costBasis * holding.quantity;
  const pnl = marketValue - costValue;
  const dailyChange = marketValue * holding.dailyChangeRate;

  return {
    id: holding.id,
    kind: 'holding',
    name: holding.name,
    symbol: holding.symbol,
    accountId: account.id,
    accountName: account.name,
    platform: account.platform,
    value: convertAmount(marketValue, holding.currency, baseCurrency, rates),
    quantity: holding.quantity,
    unitPrice: convertAmount(holding.currentPrice, holding.currency, baseCurrency, rates),
    pnl: convertAmount(pnl, holding.currency, baseCurrency, rates),
    pnlRate: costValue === 0 ? 0 : pnl / costValue,
    dailyChange: convertAmount(dailyChange, holding.currency, baseCurrency, rates),
    updatedAt: account.updatedAt,
  };
}

export function DistributionDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'DistributionDetail'>) {
  const user = useDemoStore((state) => state.user);
  const accounts = useDemoStore((state) => state.accounts);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const { kind, label, tone } = route.params;

  const entries = useMemo(() => {
    const nextEntries: DetailEntry[] = [];

    accounts.forEach((account) => {
      const platformMatched = account.platform === label;

      if (kind === 'platform' && !platformMatched) {
        return;
      }

      account.holdings.forEach((holding) => {
        const assetMatched =
          kind === 'assetClass' &&
          (holding.assetClass === label || (label === 'Cash' && holding.assetClass === 'Cash'));

        if (kind === 'assetClass' && !assetMatched) {
          return;
        }

        nextEntries.push(buildHoldingEntry(account, holding, exchangeRates, user.baseCurrency));
      });

      const shouldIncludeCashBalance =
        account.cashBalance > 0 &&
        ((kind === 'platform' && platformMatched) || (kind === 'assetClass' && label === 'Cash'));

      if (shouldIncludeCashBalance) {
        nextEntries.push({
          id: `cash-${account.id}`,
          kind: 'cash',
          name: '可用现金',
          symbol: account.currency,
          accountId: account.id,
          accountName: account.name,
          platform: account.platform,
          value: convertAmount(account.cashBalance, account.currency, user.baseCurrency, exchangeRates),
          quantity: null,
          unitPrice: null,
          pnl: 0,
          pnlRate: 0,
          dailyChange: 0,
          updatedAt: account.updatedAt,
        });
      }
    });

    return nextEntries.sort((left, right) => right.value - left.value);
  }, [accounts, exchangeRates, kind, label, user.baseCurrency]);

  const totalValue = entries.reduce((sum, entry) => sum + entry.value, 0);
  const totalPortfolioValue = accounts.reduce((sum, account) => {
    const metrics = getAccountMetrics(account);
    return sum + convertAmount(metrics.totalValue, account.currency, user.baseCurrency, exchangeRates);
  }, 0);
  const share = totalPortfolioValue === 0 ? 0 : totalValue / totalPortfolioValue;
  const todayChange = entries.reduce((sum, entry) => sum + entry.dailyChange, 0);

  const accountContributions = useMemo(() => {
    const contributionMap = new Map<
      string,
      {
        accountId: string;
        accountName: string;
        platform: string;
        value: number;
        updatedAt: string;
      }
    >();

    entries.forEach((entry) => {
      const current = contributionMap.get(entry.accountId);

      if (current) {
        current.value += entry.value;
        return;
      }

      contributionMap.set(entry.accountId, {
        accountId: entry.accountId,
        accountName: entry.accountName,
        platform: entry.platform,
        value: entry.value,
        updatedAt: entry.updatedAt,
      });
    });

    return Array.from(contributionMap.values()).sort((left, right) => right.value - left.value);
  }, [entries]);

  const displayTitle =
    kind === 'assetClass' ? assetClassLabels[label as AssetClass | 'Cash'] ?? label : label;
  const holdingCount = entries.filter((entry) => entry.kind === 'holding').length;
  const cashCount = entries.filter((entry) => entry.kind === 'cash').length;

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>{kind === 'assetClass' ? '资产分类' : '平台分布'}</Text>
          <Text style={styles.headerTitle}>{displayTitle}</Text>
        </View>
      </View>

      <LinearGradient
        colors={[colors.primary, tone]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroDescription}>
          {kind === 'assetClass'
            ? '查看该分类下的全部持仓、现金头寸和账户贡献。'
            : '查看该平台下的账户、持仓与现金分布。'}
        </Text>
        <Text style={styles.heroValue}>{formatCurrency(totalValue, user.baseCurrency, 0)}</Text>
        <View style={styles.metricGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>组合占比</Text>
            <Text style={styles.metricValue}>{formatPercent(share)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>关联账户</Text>
            <Text style={styles.metricValue}>{accountContributions.length}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>持仓数量</Text>
            <Text style={styles.metricValue}>{holdingCount}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>今日变动</Text>
            <Text style={[styles.metricValue, todayChange >= 0 ? styles.positive : styles.negative]}>
              {formatSignedCurrency(todayChange, user.baseCurrency, 0)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>关联账户</Text>
        <Text style={styles.sectionDescription}>
          {cashCount > 0 ? `包含 ${cashCount} 项现金头寸。` : '点击账户可继续查看该账户完整详情。'}
        </Text>
        <View style={styles.accountList}>
          {accountContributions.map((account) => (
            <Pressable
              key={account.accountId}
              onPress={() => navigation.navigate('AccountDetail', { accountId: account.accountId })}
              style={({ pressed }) => [styles.accountRow, pressed ? styles.rowPressed : null]}
            >
              <View style={styles.accountMain}>
                <Text style={styles.accountName}>{account.accountName}</Text>
                <Text style={styles.accountMeta}>
                  {account.platform} · {formatDateTime(account.updatedAt)}
                </Text>
              </View>
              <View style={styles.accountRight}>
                <Text style={styles.accountValue}>
                  {formatCurrency(account.value, user.baseCurrency, 0)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Pressable>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>资产明细</Text>
        <Text style={styles.sectionDescription}>
          点击单个资产可继续查看它自己的持有收益走势和统计明细。
        </Text>
        <View style={styles.entryList}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() =>
                entry.kind === 'holding'
                  ? navigation.navigate('AssetDetail', {
                      accountId: entry.accountId,
                      holdingId: entry.id,
                    })
                  : navigation.navigate('AccountDetail', { accountId: entry.accountId })
              }
              style={({ pressed }) => [styles.entryRow, pressed ? styles.rowPressed : null]}
            >
              <View style={styles.entryAvatar}>
                <Text style={styles.entryAvatarText}>
                  {entry.kind === 'cash' ? '¥' : entry.symbol.slice(0, 4)}
                </Text>
              </View>

              <View style={styles.entryMain}>
                <Text style={styles.entryName}>{entry.name}</Text>
                <Text style={styles.entryMeta}>
                  {entry.accountName} · {entry.platform}
                </Text>
                <Text style={styles.entryFootnote}>
                  {entry.kind === 'cash'
                    ? '现金余额'
                    : `${entry.quantity} 份 · 现价 ${formatCurrency(entry.unitPrice ?? 0, user.baseCurrency, 2)}`}
                </Text>
              </View>

              <View style={styles.entryRight}>
                <Text style={styles.entryValue}>{formatCurrency(entry.value, user.baseCurrency, 0)}</Text>
                {entry.kind === 'cash' ? (
                  <Text style={styles.entryNeutral}>可投资现金</Text>
                ) : (
                  <Text style={[styles.entryPnl, entry.pnl >= 0 ? styles.positive : styles.negative]}>
                    {formatSignedCurrency(entry.pnl, user.baseCurrency, 0)} · {formatPercent(entry.pnlRate)}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
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
  headerEyebrow: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.accent,
  },
  headerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    color: colors.text,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  heroDescription: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.78)',
  },
  heroValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    color: colors.white,
    letterSpacing: -0.6,
  },
  metricGrid: {
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
    color: 'rgba(255,255,255,0.72)',
  },
  metricValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.white,
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
  accountList: {
    gap: spacing.sm,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  accountMain: {
    flex: 1,
    gap: spacing.xs,
  },
  accountName: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  accountMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  accountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  accountValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.text,
  },
  entryList: {
    gap: spacing.sm,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowPressed: {
    opacity: 0.9,
  },
  entryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  entryAvatarText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
    color: colors.primary,
  },
  entryMain: {
    flex: 1,
    gap: spacing.xs,
  },
  entryName: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  entryMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  entryFootnote: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  entryRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  entryValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.text,
  },
  entryPnl: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  entryNeutral: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
