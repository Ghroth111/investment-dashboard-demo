import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PieBreakdownChart } from '../../components/chart/PieBreakdownChart';
import { AppScreen } from '../../components/layout/AppScreen';
import { EmptyState } from '../../components/states/EmptyState';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import {
  getAnalysisDistribution,
  getAnalysisSliceDefaultKey,
  getAssetsForAnalysisSlice,
  getAssetClassLabel,
  type AnalysisMode,
} from '../../features/assets/selectors';
import type { AppTabScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { formatCurrency, formatPercent, formatSignedCurrency } from '../../utils/formatters';

const modeOptions: Array<{ label: string; value: AnalysisMode }> = [
  { label: 'By Type', value: 'assetClass' },
  { label: 'By Platform', value: 'platform' },
];

export function AccountsScreen({ navigation }: AppTabScreenProps<'Accounts'>) {
  const user = useDemoStore((state) => state.user);
  const accounts = useDemoStore((state) => state.accounts);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const [mode, setMode] = useState<AnalysisMode>('assetClass');
  const distributionItems = useMemo(
    () => getAnalysisDistribution(accounts, user.baseCurrency, exchangeRates, mode),
    [accounts, exchangeRates, mode, user.baseCurrency],
  );
  const [selectedKey, setSelectedKey] = useState(() => getAnalysisSliceDefaultKey(distributionItems));

  useEffect(() => {
    setSelectedKey(getAnalysisSliceDefaultKey(distributionItems));
  }, [distributionItems, mode]);

  const sliceAssets = useMemo(
    () =>
      selectedKey
        ? getAssetsForAnalysisSlice(
            accounts,
            user.baseCurrency,
            exchangeRates,
            mode,
            selectedKey,
          )
        : [],
    [accounts, exchangeRates, mode, selectedKey, user.baseCurrency],
  );

  if (accounts.length === 0) {
    return (
      <AppScreen>
        <EmptyState
          title="No analytics yet"
          description="Add your first account and the analytics workspace will show allocation, platforms, and merged holdings."
          actionLabel="Add Account"
          onAction={() => navigation.navigate('AddAccount')}
        />
      </AppScreen>
    );
  }

  const selectedSlice = distributionItems.find((item) => item.key === selectedKey) ?? distributionItems[0];

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.description}>Portfolio mix, platform exposure, and drill-down assets live here now.</Text>
      </View>

      <SurfaceCard style={styles.modeCard}>
        <View style={styles.modeRow}>
          {modeOptions.map((option) => {
            const active = option.value === mode;

            return (
              <Pressable
                key={option.value}
                onPress={() => setMode(option.value)}
                style={[styles.modeChip, active ? styles.modeChipActive : null]}
              >
                <Text style={[styles.modeChipText, active ? styles.modeChipTextActive : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {distributionItems.length > 0 ? (
          <PieBreakdownChart
            items={distributionItems}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            currency={user.baseCurrency}
          />
        ) : null}
      </SurfaceCard>

      <SurfaceCard style={styles.detailCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {mode === 'assetClass'
              ? `${selectedSlice?.label ?? 'Asset'} Holdings`
              : `${selectedSlice?.label ?? 'Platform'} Assets`}
          </Text>
          {selectedSlice ? (
            <Text style={styles.sectionHint}>
              {formatCurrency(selectedSlice.value, user.baseCurrency, 0)} ·{' '}
              {formatPercent(selectedSlice.percentage)}
            </Text>
          ) : null}
        </View>

        {sliceAssets.length === 0 ? (
          <Text style={styles.emptyText}>No positions match this slice yet.</Text>
        ) : (
          <View style={styles.assetList}>
            {sliceAssets.map((asset) => (
              <Pressable
                key={asset.assetKey}
                onPress={() => navigation.navigate('AssetDetail', { assetKey: asset.assetKey })}
                style={({ pressed }) => [styles.assetRow, pressed ? styles.assetRowPressed : null]}
              >
                <View style={styles.assetAvatar}>
                  <Text style={styles.assetAvatarText}>{asset.symbol.slice(0, 4)}</Text>
                </View>

                <View style={styles.assetMain}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={styles.assetMeta}>
                    {asset.symbol} · {getAssetClassLabel(asset.assetClass)} · {asset.accountCount} account
                    {asset.accountCount > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.assetMeta}>{asset.platforms.join(' · ')}</Text>
                </View>

                <View style={styles.assetRight}>
                  <Text style={styles.assetValue}>
                    {formatCurrency(asset.marketValue, user.baseCurrency, 0)}
                  </Text>
                  <Text style={[styles.assetPnl, asset.pnl >= 0 ? styles.positive : styles.negative]}>
                    {formatSignedCurrency(asset.pnl, user.baseCurrency, 0)} · {formatPercent(asset.pnlRate)}
                  </Text>
                </View>
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
  modeCard: {
    gap: spacing.lg,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  modeChip: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  modeChipActive: {
    backgroundColor: colors.infoSoft,
  },
  modeChipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  modeChipTextActive: {
    color: colors.info,
  },
  detailCard: {
    gap: spacing.md,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  sectionHint: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  assetList: {
    gap: spacing.sm,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  assetRowPressed: {
    opacity: 0.9,
  },
  assetAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  assetAvatarText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
    color: colors.primary,
  },
  assetMain: {
    flex: 1,
    gap: spacing.xs,
  },
  assetName: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.text,
  },
  assetMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  assetRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  assetValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.text,
  },
  assetPnl: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  positive: {
    color: colors.positive,
  },
  negative: {
    color: colors.negative,
  },
});
