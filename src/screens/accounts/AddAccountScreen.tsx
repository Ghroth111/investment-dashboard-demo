import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddAccountMethodCard } from '../../components/accounts/AddAccountMethodCard';
import { AppScreen } from '../../components/layout/AppScreen';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { colors, fontFamilies, spacing } from '../../theme';
import type { RootStackScreenProps } from '../../navigation/types';

export function AddAccountScreen({ navigation }: RootStackScreenProps<'AddAccount'>) {
  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>添加账户</Text>
          <Text style={styles.description}>验证首发版本的接入入口、流程顺序与字段边界。</Text>
        </View>
      </View>

      <AddAccountMethodCard
        icon="key-outline"
        title="API 接入"
        description="展示平台选择、API Key、Secret 等连接入口，但当前阶段不做真实连通。"
        badge="占位流程"
        onPress={() => navigation.navigate('ApiConnect')}
      />
      <AddAccountMethodCard
        icon="scan-outline"
        title="截图导入"
        description="保留 AI 识别导入路径，展示上传区、识别示意与正式版能力边界。"
        badge="即将支持"
        onPress={() => navigation.navigate('ScreenshotImport')}
      />
      <AddAccountMethodCard
        icon="create-outline"
        title="手动录入"
        description="完整填写账户和持仓后，直接写入前端本地状态，形成真实新增反馈。"
        badge="可交互"
        onPress={() => navigation.navigate('ManualEntry')}
      />

      <SurfaceCard style={styles.timelineCard}>
        <Text style={styles.sectionTitle}>接入路径说明</Text>
        <Text style={styles.noteLine}>1. 先选择接入方式，再决定是否需要输入平台信息或上传材料。</Text>
        <Text style={styles.noteLine}>2. API 与截图入口当前只展示未来首发版本的入口形态。</Text>
        <Text style={styles.noteLine}>3. 手动录入是本轮唯一会真正更新前端状态的新增路径。</Text>
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
  timelineCard: {
    gap: spacing.sm,
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
});
