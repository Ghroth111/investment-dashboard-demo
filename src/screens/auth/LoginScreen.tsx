import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { demoAuth } from '../../config/demo';
import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { loginWithEmail, registerWithEmail } from '../../services/auth';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';

type AuthMode = 'login' | 'register';

export function LoginScreen() {
  const authenticate = useDemoStore((state) => state.authenticate);
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState(demoAuth.name);
  const [email, setEmail] = useState(demoAuth.email);
  const [password, setPassword] = useState(demoAuth.password);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isRegisterMode = mode === 'register';

  async function handleSubmit() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const result = isRegisterMode
        ? await registerWithEmail({ name, email, password })
        : await loginWithEmail({ email, password });

      await authenticate({
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '认证失败，请检查后端服务或输入内容。';
      setErrorMessage(message);
      Alert.alert(isRegisterMode ? '注册失败' : '登录失败', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen scrollable={false} contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="analytics-outline" size={28} color={colors.white} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.brand}>衡策资产</Text>
          <Text style={styles.heroTitle}>真实账号入口已接入</Text>
          <Text style={styles.heroDescription}>
            现在可以通过后端完成最小注册和登录，再进入投资看板 Demo。
          </Text>
        </View>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>SQLite 用户库</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>JWT 会话</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Demo 资产已预置</Text>
          </View>
        </View>
      </View>

      <SurfaceCard style={styles.formCard}>
        <Text style={styles.formTitle}>{isRegisterMode ? '创建账号' : '登录账号'}</Text>
        <Text style={styles.formDescription}>
          {isRegisterMode
            ? '新注册账号默认没有任何资产数据，方便从空白状态开始。'
            : '默认已填入内置演示账号。登录后会看到现有的 mock 资产和交易数据。'}
        </Text>

        {isRegisterMode ? (
          <InputField
            label="姓名"
            value={name}
            onChangeText={setName}
            placeholder="请输入姓名"
          />
        ) : null}

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
          placeholder="至少 8 位"
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Button
          label={
            submitting
              ? isRegisterMode
                ? '注册中...'
                : '登录中...'
              : isRegisterMode
                ? '注册并进入'
                : '登录'
          }
          onPress={() => {
            void handleSubmit();
          }}
          icon="arrow-forward"
          disabled={submitting}
        />
        <Button
          label={isRegisterMode ? '已有账号，去登录' : '没有账号，去注册'}
          onPress={() => {
            setMode(isRegisterMode ? 'login' : 'register');
            setErrorMessage('');
          }}
          variant="secondary"
          disabled={submitting}
        />
        <Text style={styles.registerHint}>
          Demo 账号：{demoAuth.email} / {demoAuth.password}
        </Text>
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
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    lineHeight: 20,
    color: colors.negative,
  },
  registerHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
