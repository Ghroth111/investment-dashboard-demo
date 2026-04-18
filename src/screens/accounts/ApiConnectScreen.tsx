import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { colors, fontFamilies, spacing } from '../../theme';
import type { RootStackScreenProps } from '../../navigation/types';

type ConnectState = 'idle' | 'submitting' | 'error';

const platformOptions = [
  { label: 'IBKR', value: 'Interactive Brokers' },
  { label: 'Futu', value: 'Futu' },
  { label: 'Binance', value: 'Binance' },
  { label: 'Tiger', value: 'Tiger' },
];

export function ApiConnectScreen({ navigation }: RootStackScreenProps<'ApiConnect'>) {
  const [platform, setPlatform] = useState('Interactive Brokers');
  const [apiKey, setApiKey] = useState('');
  const [secret, setSecret] = useState('');
  const [state, setState] = useState<ConnectState>('idle');

  function handleConnect() {
    setState('submitting');
    setTimeout(() => {
      setState('error');
    }, 900);
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>API 接入</Text>
          <Text style={styles.description}>本页只验证未来真实接入时的表单结构与状态反馈。</Text>
        </View>
      </View>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>选择平台</Text>
        <SegmentedControl options={platformOptions} value={platform} onChange={setPlatform} compact />
        <InputField
          label="API Key"
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="请输入访问密钥"
        />
        <InputField
          label="Secret"
          value={secret}
          onChangeText={setSecret}
          placeholder="请输入密钥"
          secureTextEntry
        />
        <Button
          label={state === 'submitting' ? '模拟连接中...' : `连接 ${platform}`}
          onPress={handleConnect}
          disabled={state === 'submitting'}
        />

        {state === 'error' ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color={colors.negative} />
            <Text style={styles.errorText}>当前 Demo 不做真实 API 联调，这里只展示连接失败状态。</Text>
          </View>
        ) : null}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>正式版能力说明</Text>
        <Text style={styles.noteLine}>支持券商或交易所平台选择。</Text>
        <Text style={styles.noteLine}>后续会补充权限范围说明、只读权限提醒与连接成功后的同步状态。</Text>
        <Text style={styles.noteLine}>当前阶段仅保留表单、按钮与错误占位，不存储任何真实凭证。</Text>
      </SurfaceCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
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
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.negativeSoft,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  noteLine: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});
