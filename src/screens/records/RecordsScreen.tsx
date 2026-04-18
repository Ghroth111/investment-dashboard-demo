import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { EmptyState } from '../../components/states/EmptyState';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { convertAmount } from '../../features/dashboard/selectors';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, spacing } from '../../theme';
import {
  formatCurrency,
  formatShortDate,
  formatSignedCurrency,
} from '../../utils/formatters';
import type { AppTabScreenProps } from '../../navigation/types';

type RecordsMode = 'cashflow' | 'bookkeeping';
type PreviewState = 'normal' | 'empty';

const recordOptions = [
  { label: '资金流', value: 'cashflow' },
  { label: '记账', value: 'bookkeeping' },
];

const previewOptions = [
  { label: '正常', value: 'normal' },
  { label: '空状态', value: 'empty' },
];

export function RecordsScreen({ navigation }: AppTabScreenProps<'Records'>) {
  const records = useDemoStore((state) => state.records);
  const user = useDemoStore((state) => state.user);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const [mode, setMode] = useState<RecordsMode>('cashflow');
  const [previewState, setPreviewState] = useState<PreviewState>('normal');

  const inflow = records
    .filter((record) => record.amount > 0)
    .reduce(
      (sum, record) =>
        sum + convertAmount(record.amount, record.currency, user.baseCurrency, exchangeRates),
      0,
    );
  const outflow = records
    .filter((record) => record.amount < 0)
    .reduce(
      (sum, record) =>
        sum + convertAmount(record.amount, record.currency, user.baseCurrency, exchangeRates),
      0,
    );

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>记录</Text>
        <Text style={styles.description}>
          当前以资金流为主，记账模块仅做首发范围与未来能力占位。
        </Text>
      </View>

      <SurfaceCard style={styles.card}>
        <SegmentedControl options={recordOptions} value={mode} onChange={(next) => setMode(next as RecordsMode)} compact />
        {mode === 'cashflow' ? (
          <SegmentedControl
            options={previewOptions}
            value={previewState}
            onChange={(next) => setPreviewState(next as PreviewState)}
            compact
          />
        ) : null}
      </SurfaceCard>

      {mode === 'cashflow' ? (
        previewState === 'empty' || records.length === 0 ? (
          <EmptyState
            title="还没有任何资金流记录"
            description="正式版会把入金、出金、分红、手续费和账户间划转统一归档在这里。"
          />
        ) : (
          <>
            <SurfaceCard style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>本期流入</Text>
                <Text style={[styles.summaryValue, styles.positive]}>
                  {formatCurrency(inflow, user.baseCurrency, 0)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>本期流出</Text>
                <Text style={[styles.summaryValue, styles.negative]}>
                  {formatCurrency(Math.abs(outflow), user.baseCurrency, 0)}
                </Text>
              </View>
            </SurfaceCard>

            {records.map((record) => {
              const convertedAmount = convertAmount(
                record.amount,
                record.currency,
                user.baseCurrency,
                exchangeRates,
              );

              return (
                <SurfaceCard key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordCopy}>
                      <Text style={styles.recordTitle}>{record.title}</Text>
                      <Text style={styles.recordMeta}>
                        {record.accountName} · {formatShortDate(record.createdAt)}
                      </Text>
                    </View>
                    <Text style={[styles.recordAmount, convertedAmount >= 0 ? styles.positive : styles.negative]}>
                      {formatSignedCurrency(convertedAmount, user.baseCurrency, 0)}
                    </Text>
                  </View>
                  <Text style={styles.recordNote}>{record.note}</Text>
                </SurfaceCard>
              );
            })}
          </>
        )
      ) : (
        <>
          <SurfaceCard style={styles.card}>
            <Text style={styles.sectionTitle}>记账模块即将上线</Text>
            <Text style={styles.noteLine}>日常支出管理：统一汇总投资与生活账本。</Text>
            <Text style={styles.noteLine}>预算与目标：围绕资产增长与现金流目标提供可视化追踪。</Text>
            <Text style={styles.noteLine}>多场景联动：后续可把投资账户和生活账户放入同一张时间线。</Text>
          </SurfaceCard>
          <SurfaceCard style={styles.card}>
            <Text style={styles.sectionTitle}>为什么现在先占位</Text>
            <Text style={styles.noteLine}>帮助团队判断首发版是否要直接露出“记录”入口。</Text>
            <Text style={styles.noteLine}>让用户从 Demo 就理解产品未来不只是资产看板。</Text>
          </SurfaceCard>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    color: colors.text,
  },
  description: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  card: {
    gap: spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
  },
  recordCard: {
    gap: spacing.sm,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  recordCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  recordTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    color: colors.text,
  },
  recordMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  recordAmount: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
  },
  recordNote: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  noteLine: {
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
