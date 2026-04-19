import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { baseCurrencyOptions, upcomingFeatures } from '../../mock';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';

export function SettingsScreen() {
  const user = useDemoStore((state) => state.user);
  const exchangeRates = useDemoStore((state) => state.exchangeRates);
  const setBaseCurrency = useDemoStore((state) => state.setBaseCurrency);
  const logout = useDemoStore((state) => state.logout);
  const [themeMode, setThemeMode] = useState('light');

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>我的</Text>
        <Text style={styles.description}>基础货币切换、数据来源说明和路线图都集中在这里。</Text>
      </View>

      <SurfaceCard style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.slice(0, 1)}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileMeta}>{user.email}</Text>
          <Text style={styles.profileMeta}>基础货币：{user.baseCurrency}</Text>
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>基础货币</Text>
        <SegmentedControl
          options={baseCurrencyOptions.map((currency) => ({ label: currency, value: currency }))}
          value={user.baseCurrency}
          onChange={(next) => setBaseCurrency(next as typeof user.baseCurrency)}
          compact
        />
        <Text style={styles.noteLine}>切换后首页、账户列表、详情页和记录页都会同步改成对应展示币种。</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>主题预览</Text>
        <SegmentedControl
          options={[
            { label: '浅色', value: 'light' },
            { label: '系统', value: 'system' },
          ]}
          value={themeMode}
          onChange={setThemeMode}
          compact
        />
        <Text style={styles.noteLine}>本轮主要验证浅色金融工具风格，深色主题先只保留占位。</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>汇率说明</Text>
        {Object.entries(exchangeRates).map(([currency, rate]) => (
          <View key={currency} style={styles.rateRow}>
            <Text style={styles.rateLabel}>{currency}</Text>
            <Text style={styles.rateValue}>1 {currency} = {rate.toFixed(3)} USD</Text>
          </View>
        ))}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>数据来源与边界</Text>
        <Text style={styles.noteLine}>账户和持仓已接入按用户隔离的 SQLite 数据。</Text>
        <Text style={styles.noteLine}>手动录入页已接入 Twelve Data，用于搜索美股标的并带入实时现价。</Text>
        <Text style={styles.noteLine}>最小账号注册和登录已接入 SQLite + JWT。</Text>
        <Text style={styles.noteLine}>交易、截图识别、通知和 AI 建议仍未接入真实后端能力。</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>即将上线</Text>
        {upcomingFeatures.map((item) => (
          <View key={item} style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </SurfaceCard>

      <Button label="退出登录" onPress={logout} variant="danger" icon="log-out-outline" />
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    color: colors.white,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  profileMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
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
  noteLine: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rateLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.text,
  },
  rateValue: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  featureText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});
