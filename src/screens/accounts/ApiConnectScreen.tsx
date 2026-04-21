import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import type { RootStackScreenProps } from '../../navigation/types';
import { colors, fontFamilies, spacing } from '../../theme';

type ConnectState = 'idle' | 'submitting' | 'success';

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
      setState('success');
    }, 900);
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>API 直连</Text>
          <Text style={styles.description}>提交只读 API 凭证，用于同步账户余额、持仓和平台更新状态。</Text>
        </View>
      </View>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>选择平台</Text>
        <SegmentedControl options={platformOptions} value={platform} onChange={setPlatform} compact />
        <InputField
          label="API Key"
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="请输入 API Key"
          autoCapitalize="none"
        />
        <InputField
          label="Secret"
          value={secret}
          onChangeText={setSecret}
          placeholder="请输入 Secret"
          secureTextEntry
          autoCapitalize="none"
        />
        <Button
          label={state === 'submitting' ? '验证中...' : `验证并连接 ${platform}`}
          onPress={handleConnect}
          disabled={state === 'submitting'}
        />

        {state === 'success' ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.positive} />
            <Text style={styles.successText}>连接请求已提交，你可以返回账户页查看同步结果。</Text>
          </View>
        ) : null}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>连接须知</Text>
        <Text style={styles.noteLine}>请尽量使用只读权限，避免授予交易和提现能力。</Text>
        <Text style={styles.noteLine}>首次同步可能需要几分钟，完成后账户余额和持仓会自动更新。</Text>
        <Text style={styles.noteLine}>如平台支持 IP 白名单或权限颗粒度，建议在平台侧一并开启。</Text>
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.positiveSoft,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  successText: {
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
