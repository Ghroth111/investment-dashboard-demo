import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import type { RootStackScreenProps } from '../../navigation/types';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { ScreenshotImportResult } from '../../types/models';

interface SelectedScreenshot {
  fileName: string;
  mimeType: string;
  imageBase64: string;
  previewUri: string;
  sizeInBytes: number;
}

const MAX_FILE_BYTES = 7 * 1024 * 1024;
const MAX_SCREENSHOT_COUNT = 4;
const ACCEPTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

async function pickScreenshotFromBrowser(): Promise<SelectedScreenshot[]> {
  const browserDocument = (globalThis as { document?: any }).document;
  const BrowserFileReader = (globalThis as { FileReader?: any }).FileReader;

  if (!browserDocument || !BrowserFileReader) {
    return [];
  }

  return new Promise((resolve, reject) => {
    const input = browserDocument.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/png,image/jpeg,image/jpg,image/webp';
    input.style.display = 'none';

    const cleanup = () => {
      try {
        browserDocument.body?.removeChild?.(input);
      } catch {
        // Best-effort cleanup for browser-created input nodes.
      }
    };

    input.onchange = () => {
      const files = Array.from(input.files || []) as File[];
      if (files.length === 0) {
        cleanup();
        resolve([]);
        return;
      }

      if (files.length > MAX_SCREENSHOT_COUNT) {
        cleanup();
        reject(new Error(`最多可同时上传 ${MAX_SCREENSHOT_COUNT} 张截图。`));
        return;
      }

      Promise.all(
        files.map(
          (file) =>
            new Promise<SelectedScreenshot>((resolveFile, rejectFile) => {
              if (!ACCEPTED_MIME_TYPES.has(file.type)) {
                rejectFile(new Error('仅支持 PNG、JPG、JPEG 和 WEBP 图片格式。'));
                return;
              }

              if (file.size > MAX_FILE_BYTES) {
                rejectFile(new Error(`截图 ${file.name} 不能超过 7MB，请压缩后再试。`));
                return;
              }

              const reader = new BrowserFileReader();
              reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : '';
                const base64Marker = 'base64,';
                const markerIndex = result.indexOf(base64Marker);
                if (markerIndex === -1) {
                  rejectFile(new Error(`无法读取截图 ${file.name} 的内容，请重新选择文件。`));
                  return;
                }

                resolveFile({
                  fileName: file.name,
                  mimeType: file.type,
                  imageBase64: result.slice(markerIndex + base64Marker.length),
                  previewUri: result,
                  sizeInBytes: file.size,
                });
              };
              reader.onerror = () => {
                rejectFile(new Error(`读取截图 ${file.name} 失败，请稍后重试。`));
              };
              reader.readAsDataURL(file);
            }),
        ),
      )
        .then((screenshots) => {
          cleanup();
          resolve(screenshots);
        })
        .catch((error) => {
          cleanup();
          reject(error);
        });
    };

    browserDocument.body?.appendChild?.(input);
    input.click();
  });
}

export function ScreenshotImportScreen({
  navigation,
}: RootStackScreenProps<'ScreenshotImport'>) {
  const addScreenshotAccount = useDemoStore((state) => state.addScreenshotAccount);
  const [selectedScreenshots, setSelectedScreenshots] = useState<SelectedScreenshot[]>([]);
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [importResult, setImportResult] = useState<ScreenshotImportResult | null>(null);

  async function handlePickScreenshot() {
    try {
      setStatusMessage('正在准备截图...');
      const pickedScreenshots = await pickScreenshotFromBrowser();
      if (pickedScreenshots.length === 0) {
        setStatusMessage('');
        Alert.alert('当前环境不支持', '当前设备暂不支持直接选择文件，请改用手动录入。');
        return;
      }

      setSelectedScreenshots(pickedScreenshots);
      setImportResult(null);
      setStatusMessage(`已选择 ${pickedScreenshots.length} 张截图，可以开始识别。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '选择截图失败，请稍后重试。';
      setStatusMessage(message);
      Alert.alert('选择失败', message);
    }
  }

  async function handleImport() {
    if (selectedScreenshots.length === 0 || importing) {
      return;
    }

    try {
      setImporting(true);
      setStatusMessage('正在识别截图并生成账户草稿...');
      const result = await addScreenshotAccount({
        screenshots: selectedScreenshots.map((screenshot) => ({
          imageBase64: screenshot.imageBase64,
          mimeType: screenshot.mimeType,
          fileName: screenshot.fileName,
        })),
      });
      setImportResult(result);
      setStatusMessage('识别完成，正在跳转到手动校对页面。');
      navigation.navigate('ManualEntry', { prefill: result.draft });
    } catch (error) {
      const message = error instanceof Error ? error.message : '截图导入失败，请检查网络或稍后重试。';
      setStatusMessage(message);
      Alert.alert('导入失败', message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>截图导入</Text>
          <Text style={styles.description}>上传账户截图后，系统会识别持仓并生成可编辑的账户草稿。</Text>
        </View>
      </View>

      <SurfaceCard style={styles.card}>
        <View style={styles.uploadZone}>
          <Ionicons name="images-outline" size={32} color={colors.primary} />
          <Text style={styles.uploadTitle}>上传账户截图</Text>
          <Text style={styles.uploadDescription}>
            支持 PNG / JPG / WEBP。可一次上传多张截图，建议每张都控制在 7MB 以内。
          </Text>
        </View>
        <Button label="选择截图" onPress={() => void handlePickScreenshot()} icon="cloud-upload-outline" />
        <Button
          label={importing ? '识别中...' : '识别并生成草稿'}
          onPress={() => {
            void handleImport();
          }}
          icon="sparkles-outline"
          disabled={selectedScreenshots.length === 0 || importing}
        />
        {statusMessage ? <Text style={styles.noteLine}>{statusMessage}</Text> : null}
      </SurfaceCard>

      {selectedScreenshots.length > 0 ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>待导入截图</Text>
          {selectedScreenshots.map((selectedScreenshot, index) => (
            <View key={`${selectedScreenshot.fileName}-${index}`} style={styles.previewCard}>
              <Image
                source={{ uri: selectedScreenshot.previewUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>文件名</Text>
                <Text style={styles.resultValue}>{selectedScreenshot.fileName}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>大小</Text>
                <Text style={styles.resultValue}>
                  {(selectedScreenshot.sizeInBytes / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
            </View>
          ))}
        </SurfaceCard>
      ) : null}

      {importResult ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>识别摘要</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>平台</Text>
            <Text style={styles.resultValue}>{importResult.draft.name || importResult.draft.platform || '-'}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>账户类型</Text>
            <Text style={styles.resultValue}>{importResult.normalized.account_type}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>币种</Text>
            <Text style={styles.resultValue}>{importResult.normalized.currency}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>识别持仓</Text>
            <Text style={styles.resultValue}>{importResult.normalized.accepted_positions} 项</Text>
          </View>
          {importResult.warnings.length > 0 ? (
            <View style={styles.warningBox}>
              {importResult.warnings.map((warning) => (
                <Text key={warning} style={styles.warningText}>
                  {warning}
                </Text>
              ))}
            </View>
          ) : null}
          <Button
            label="前往校对草稿"
            onPress={() => navigation.navigate('ManualEntry', { prefill: importResult.draft })}
            icon="open-outline"
          />
        </SurfaceCard>
      ) : null}

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>导入建议</Text>
        <Text style={styles.noteLine}>优先上传完整的账户总览页，识别结果会更稳定。</Text>
        <Text style={styles.noteLine}>如果单张图放不下，可一次选择 2-4 张截图，后端会一起发送给识图接口。</Text>
        <Text style={styles.noteLine}>识别完成后会进入手动录入页，你可以继续校对名称、数量和成本价。</Text>
        <Text style={styles.noteLine}>如果截图不完整或信息过多，建议拆分多张上传，或直接改用手动录入。</Text>
        <Button label="改用手动录入" onPress={() => navigation.navigate('ManualEntry')} variant="secondary" />
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
    flexShrink: 1,
    textAlign: 'right',
  },
  noteLine: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  previewCard: {
    gap: spacing.sm,
  },
  warningBox: {
    borderRadius: radius.lg,
    backgroundColor: '#FFF4E5',
    padding: spacing.md,
    gap: spacing.xs,
  },
  warningText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
    color: '#8A4B08',
  },
});
