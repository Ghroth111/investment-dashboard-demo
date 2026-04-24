import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InteractivePerformanceChart } from '../../components/chart/InteractivePerformanceChart';
import { AppScreen } from '../../components/layout/AppScreen';
import { ErrorState } from '../../components/states/ErrorState';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { getAssetSnapshot, getAssetClassLabel, getHoldingAssetKey } from '../../features/assets/selectors';
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

export function AssetDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'AssetDetail'>) {
  const user = useDemoStore((state) => state.user);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const accounts = useDemoStore((state) => state.accounts);
  const holdingTrades = useDemoStore((state) => state.holdingTrades);
  const accountFromRoute = 'accountId' in route.params ? route.params.accountId : undefined;
  const holdingIdFromRoute = 'holdingId' in route.params ? route.params.holdingId : undefined;

  const routeHolding =
    accountFromRoute && holdingIdFromRoute
      ? accounts
          .find((item) => item.id === accountFromRoute)
          ?.holdings.find((item) => item.id === holdingIdFromRoute)
      : undefined;
  const assetKey =
    route.params.assetKey ??
    (routeHolding ? getHoldingAssetKey(routeHolding) : undefined);
  const asset = assetKey
    ? getAssetSnapshot(accounts, user.baseCurrency, exchangeRates, assetKey)
    : undefined;

  if (!asset || !assetKey) {
    return (
      <AppScreen>
        <ErrorState
          title="Asset not found"
          description="The requested asset may have been removed or replaced by a newer import."
          actionLabel="Go Back"
          onAction={() => navigation.goBack()}
        />
      </AppScreen>
    );
  }

  const primaryPosition = asset.positions[0];
  const account = primaryPosition
    ? accounts.find((item) => item.id === primaryPosition.accountId)
    : undefined;
  const holding =
    account && primaryPosition
      ? account.holdings.find((item) => item.id === primaryPosition.holdingId)
      : undefined;
  const performanceSeries = useMemo(() => createEmptyPerformanceSeries(), []);

  const assetTrades = holdingTrades
    .filter((trade) => trade.assetKey === assetKey)
    .sort((left, right) => new Date(right.executedAt).getTime() - new Date(left.executedAt).getTime());

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.platform}>
            {asset.positions.length > 1 ? 'Merged Asset' : 'Single Account Position'}
          </Text>
          <Text style={styles.title}>{asset.name}</Text>
          <Text style={styles.subtitle}>
            {asset.symbol} · {getAssetClassLabel(asset.assetClass)}
          </Text>
        </View>
      </View>

      <InteractivePerformanceChart
        title="Holding Performance"
        subtitle={`${asset.symbol} · ${asset.quantity} units`}
        currency={user.baseCurrency}
        series={performanceSeries}
        defaultRange="YTD"
        emptyMessage="持仓详情页当前不再编造收益曲线；等后端记录到持仓级真实历史后，这里会显示真实走势。"
      />

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Asset Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Market Value</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(asset.marketValue, user.baseCurrency, 0)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Return</Text>
            <Text style={[styles.metricValue, asset.pnl >= 0 ? styles.positive : styles.negative]}>
              {formatSignedCurrency(asset.pnl, user.baseCurrency, 0)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Today P/L</Text>
            <Text
              style={[
                styles.metricValue,
                asset.todayChange >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {formatSignedCurrency(asset.todayChange, user.baseCurrency, 0)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Return Rate</Text>
            <Text style={styles.metricValue}>{formatPercent(asset.pnlRate)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Quantity</Text>
            <Text style={styles.metricValue}>{asset.quantity}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Average Price</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(asset.currentPrice, user.baseCurrency, 2)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Average Cost</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(asset.costBasis, user.baseCurrency, 2)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Updated</Text>
            <Text style={styles.metricValue}>{formatDateTime(asset.lastUpdated)}</Text>
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Linked Positions</Text>
        <View style={styles.positionList}>
          {asset.positions.map((position) => (
            <Pressable
              key={`${position.accountId}-${position.holdingId}`}
              onPress={() => navigation.navigate('AccountDetail', { accountId: position.accountId })}
              style={({ pressed }) => [styles.positionRow, pressed ? styles.rowPressed : null]}
            >
              <View style={styles.positionMain}>
                <Text style={styles.positionName}>{position.accountName}</Text>
                <Text style={styles.positionMeta}>
                  Qty {position.quantity} · Updated {formatDateTime(position.updatedAt)}
                </Text>
              </View>
              <View style={styles.positionRight}>
                <Text style={styles.positionValue}>
                  {formatCurrency(position.value, user.baseCurrency, 0)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Pressable>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Trade History</Text>
        <Text style={styles.sectionDescription}>
          Tap any record to edit the imported price, quantity, date, or trade change rate.
        </Text>
        {assetTrades.length === 0 ? (
          <Text style={styles.emptyText}>No trade history has been synced for this asset yet.</Text>
        ) : (
          <View style={styles.tradeList}>
            {assetTrades.map((trade) => (
              <Pressable
                key={trade.id}
                onPress={() => navigation.navigate('EditHoldingTrade', { tradeId: trade.id })}
                style={({ pressed }) => [styles.tradeRow, pressed ? styles.rowPressed : null]}
              >
                <View style={styles.tradeMain}>
                  <View style={styles.tradeTopRow}>
                    <View
                      style={[
                        styles.tradeTypeTag,
                        trade.tradeType === 'buy' ? styles.buyTag : styles.sellTag,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tradeTypeText,
                          trade.tradeType === 'buy' ? styles.buyText : styles.sellText,
                        ]}
                      >
                        {trade.tradeType.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.tradeDate}>{formatDateTime(trade.executedAt)}</Text>
                  </View>
                  <Text style={styles.tradeMeta}>
                    Price {formatCurrency(trade.price, trade.currency, 2)} · Qty {trade.quantity}
                  </Text>
                  <Text style={styles.tradeMeta}>Trade change {formatPercent(trade.changeRate)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
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
  positionList: {
    gap: spacing.sm,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  positionMain: {
    flex: 1,
    gap: spacing.xs,
  },
  positionName: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  positionMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  positionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  positionValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.text,
  },
  tradeList: {
    gap: spacing.sm,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowPressed: {
    opacity: 0.9,
  },
  tradeMain: {
    flex: 1,
    gap: spacing.xs,
  },
  tradeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tradeTypeTag: {
    minHeight: 22,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyTag: {
    backgroundColor: colors.positiveSoft,
  },
  sellTag: {
    backgroundColor: colors.negativeSoft,
  },
  tradeTypeText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 11,
  },
  buyText: {
    color: colors.positive,
  },
  sellText: {
    color: colors.negative,
  },
  tradeDate: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  tradeMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
