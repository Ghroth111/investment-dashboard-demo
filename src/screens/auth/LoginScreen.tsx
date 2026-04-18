import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';

export function LoginScreen() {
  const enterDemo = useDemoStore((state) => state.enterDemo);
  const [email, setEmail] = useState('zhiyuan.chen@example.com');
  const [password, setPassword] = useState('demo-password');

  return (
    <AppScreen scrollable={false} contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="analytics-outline" size={28} color={colors.white} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.brand}>衡策资产</Text>
          <Text style={styles.heroTitle}>投资整合资产看板</Text>
          <Text style={styles.heroDescription}>
            为首发版本验证页面结构、主要流程与数据边界的高保真前端 Demo。
          </Text>
        </View>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>4 个账户源</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>跨币种统一视图</Text>
          </View>
        </View>
      </View>

      <SurfaceCard style={styles.formCard}>
        <Text style={styles.formTitle}>进入 Demo</Text>
        <Text style={styles.formDescription}>
          当前阶段不接真实鉴权，登录与体验按钮都会直接进入前端演示环境。
        </Text>

        <InputField
          label="邮箱"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
        />
        <InputField
          label="密码"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="请输入密码"
        />

        <Button label="体验 Demo" onPress={enterDemo} icon="arrow-forward" />
        <Button label="登录" onPress={enterDemo} variant="secondary" />
        <Text style={styles.registerHint}>注册入口预留中，正式版将接入真实账号体系。</Text>
      </SurfaceCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroCopy: {
    gap: spacing.sm,
  },
  brand: {
    fontFamily: fontFamilies.medium,
    color: '#A7C8E8',
    fontSize: 13,
  },
  heroTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.white,
    letterSpacing: -0.4,
  },
  heroDescription: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    minHeight: 32,
    borderRadius: radius.pill,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pillText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.white,
  },
  formCard: {
    gap: spacing.md,
  },
  formTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 22,
    color: colors.text,
  },
  formDescription: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  registerHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
