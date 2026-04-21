import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddAccountMethodCard } from '../../components/accounts/AddAccountMethodCard';
import { AppScreen } from '../../components/layout/AppScreen';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import type { RootStackScreenProps } from '../../navigation/types';
import { colors, fontFamilies, spacing } from '../../theme';

export function AddAccountScreen({ navigation }: RootStackScreenProps<'AddAccount'>) {
  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>添加账户</Text>
          <Text style={styles.description}>选择最适合你的接入方式，开始同步或录入资产。</Text>
        </View>
      </View>

      <AddAccountMethodCard
        icon="key-outline"
        title="API 直连"
        description="连接券商或交易平台的只读 API，自动同步账户余额、持仓和更新时间。"
        badge="推荐"
        onPress={() => navigation.navigate('ApiConnect')}
      />
      <AddAccountMethodCard
        icon="scan-outline"
        title="截图导入"
        description="上传账户截图，系统会识别持仓并生成可编辑的导入草稿。"
        badge="智能识别"
        onPress={() => navigation.navigate('ScreenshotImport')}
      />
      <AddAccountMethodCard
        icon="create-outline"
        title="手动录入"
        description="适合线下资产、私募份额或暂时无法直连的平台，支持自定义持仓。"
        badge="快速录入"
        onPress={() => navigation.navigate('ManualEntry')}
      />

      <SurfaceCard style={styles.noteCard}>
        <Text style={styles.sectionTitle}>接入建议</Text>
        <Text style={styles.noteLine}>1. 优先选择只读 API 连接，便于持续同步持仓和现金变动。</Text>
        <Text style={styles.noteLine}>2. 如果你只有截图，可以先导入草稿，再在手动录入页补齐细节。</Text>
        <Text style={styles.noteLine}>3. 私募、现金或家庭资产建议使用手动录入，后续也可以继续编辑。</Text>
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
  noteCard: {
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
