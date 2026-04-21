import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { baseCurrencyOptions } from '../../mock';
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
        <Text style={styles.description}>管理显示币种、界面偏好和账户安全设置。</Text>
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
        <Text style={styles.noteLine}>切换后，首页、账户、详情和流水页会同步更新展示币种。</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>界面偏好</Text>
        <SegmentedControl
          options={[
            { label: '浅色', value: 'light' },
            { label: '跟随系统', value: 'system' },
          ]}
          value={themeMode}
          onChange={setThemeMode}
          compact
        />
        <Text style={styles.noteLine}>当前版本优先针对手机端浅色界面做了阅读和触控优化。</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>汇率参考</Text>
        {Object.entries(exchangeRates).map(([currency, rate]) => (
          <View key={currency} style={styles.rateRow}>
            <Text style={styles.rateLabel}>{currency}</Text>
            <Text style={styles.rateValue}>1 {currency} = {rate.toFixed(3)} USD</Text>
          </View>
        ))}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>账户与数据</Text>
        <Text style={styles.noteLine}>账户、持仓和流水会按照当前登录用户隔离展示。</Text>
        <Text style={styles.noteLine}>建议优先接入只读权限，避免在资产同步场景中暴露高风险操作。</Text>
        <Text style={styles.noteLine}>如更换设备，请先确认 API 权限、截图草稿和手动录入内容已经同步完成。</Text>
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
});
