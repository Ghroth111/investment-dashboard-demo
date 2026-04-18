import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { RootStackScreenProps } from '../../navigation/types';

export function ScreenshotImportScreen({
  navigation,
}: RootStackScreenProps<'ScreenshotImport'>) {
  const [hasPreview, setHasPreview] = useState(false);

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>截图导入</Text>
          <Text style={styles.description}>本页只做导入占位，展示未来 AI 识别入口与结果区域。</Text>
        </View>
      </View>

      <SurfaceCard style={styles.card}>
        <View style={styles.uploadZone}>
          <Ionicons name="images-outline" size={32} color={colors.primary} />
          <Text style={styles.uploadTitle}>上传券商持仓截图</Text>
          <Text style={styles.uploadDescription}>支持 PNG / JPG / PDF，正式版将支持自动识别账户与持仓。</Text>
        </View>
        <Button label="模拟上传截图" onPress={() => setHasPreview(true)} icon="cloud-upload-outline" />
      </SurfaceCard>

      {hasPreview ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>识别结果示意</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>平台</Text>
            <Text style={styles.resultValue}>Interactive Brokers</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>账户名</Text>
            <Text style={styles.resultValue}>US Margin 01</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>识别持仓</Text>
            <Text style={styles.resultValue}>AAPL / NVDA / SPY</Text>
          </View>
          <Button
            label="改用手动录入"
            onPress={() => navigation.navigate('ManualEntry')}
            variant="secondary"
          />
        </SurfaceCard>
      ) : null}

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>正式版计划</Text>
        <Text style={styles.noteLine}>自动提取平台名、账户号与持仓字段。</Text>
        <Text style={styles.noteLine}>允许用户确认识别结果后，再落入本地或后端状态。</Text>
        <Text style={styles.noteLine}>当前 Demo 只保留视觉入口和结果占位，不做真实 OCR。</Text>
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
  uploadZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  uploadTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  uploadDescription: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    color: colors.text,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  resultLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  resultValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    color: colors.text,
  },
  noteLine: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});
