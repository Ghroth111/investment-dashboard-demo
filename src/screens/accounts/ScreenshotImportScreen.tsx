import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/layout/AppScreen';
import { Button } from '../../components/ui/Button';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { RootStackScreenProps } from '../../navigation/types';
import type { ScreenshotImportResult } from '../../types/models';

interface SelectedScreenshot {
  fileName: string;
  mimeType: string;
  imageBase64: string;
  previewUri: string;
  sizeInBytes: number;
}

const MAX_FILE_BYTES = 7 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

async function pickScreenshotFromBrowser(): Promise<SelectedScreenshot | null> {
  const browserDocument = (globalThis as { document?: any }).document;
  const BrowserFileReader = (globalThis as { FileReader?: any }).FileReader;

  if (!browserDocument || !BrowserFileReader) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const input = browserDocument.createElement('input');
    input.type = 'file';
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
      const file = input.files?.[0];
      if (!file) {
        cleanup();
        resolve(null);
        return;
      }

      if (!ACCEPTED_MIME_TYPES.has(file.type)) {
        cleanup();
        reject(new Error('仅支持 PNG、JPG、JPEG 和 WEBP 截图。'));
        return;
      }

      if (file.size > MAX_FILE_BYTES) {
        cleanup();
        reject(new Error('截图文件不能超过 7MB，请压缩后再试。'));
        return;
      }

      const reader = new BrowserFileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const base64Marker = 'base64,';
        const markerIndex = result.indexOf(base64Marker);
        if (markerIndex === -1) {
          cleanup();
          reject(new Error('无法读取截图内容，请重试。'));
          return;
        }

        cleanup();
        resolve({
          fileName: file.name,
          mimeType: file.type,
          imageBase64: result.slice(markerIndex + base64Marker.length),
          previewUri: result,
          sizeInBytes: file.size,
        });
      };
      reader.onerror = () => {
        cleanup();
        reject(new Error('读取截图失败，请重试。'));
      };
      reader.readAsDataURL(file);
    };

    browserDocument.body?.appendChild?.(input);
    input.click();
  });
}

export function ScreenshotImportScreen({
  navigation,
}: RootStackScreenProps<'ScreenshotImport'>) {
  const addScreenshotAccount = useDemoStore((state) => state.addScreenshotAccount);
  const [selectedScreenshot, setSelectedScreenshot] = useState<SelectedScreenshot | null>(null);
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [importResult, setImportResult] = useState<ScreenshotImportResult | null>(null);

  async function handlePickScreenshot() {
    try {
      setStatusMessage('正在准备截图...');
      const pickedScreenshot = await pickScreenshotFromBrowser();
      if (!pickedScreenshot) {
        setStatusMessage('');
        Alert.alert('当前环境不支持', '当前端没有可用的文件选择能力，请先使用手动录入。');
        return;
      }

      setSelectedScreenshot(pickedScreenshot);
      setImportResult(null);
      setStatusMessage('截图已就绪，可以开始导入。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '选择截图失败，请重试。';
      setStatusMessage(message);
      Alert.alert('选择失败', message);
    }
  }

  async function handleImport() {
    if (!selectedScreenshot || importing) {
      return;
    }

    try {
      setImporting(true);
      setStatusMessage('正在调用千问识别截图并生成手动录入草稿...');
      const result = await addScreenshotAccount({
        imageBase64: selectedScreenshot.imageBase64,
        mimeType: selectedScreenshot.mimeType,
        fileName: selectedScreenshot.fileName,
      });
      setImportResult(result);
      setStatusMessage('识别完成，准备跳转到手动录入页。');
      navigation.navigate('ManualEntry', { prefill: result.draft });
    } catch (error) {
      const message = error instanceof Error ? error.message : '截图导入失败，请检查后端服务。';
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
          <Text style={styles.description}>上传账户截图后，由后端调用千问视觉理解接口识别并直接写入账户。</Text>
        </View>
      </View>

      <SurfaceCard style={styles.card}>
        <View style={styles.uploadZone}>
          <Ionicons name="images-outline" size={32} color={colors.primary} />
          <Text style={styles.uploadTitle}>上传券商持仓截图</Text>
          <Text style={styles.uploadDescription}>当前支持 PNG / JPG / WEBP。建议截图不超过 7MB，优先上传完整账户页。</Text>
        </View>
        <Button label="选择截图" onPress={() => void handlePickScreenshot()} icon="cloud-upload-outline" />
        <Button
          label={importing ? '导入中...' : '识别并保存账户'}
          onPress={() => {
            void handleImport();
          }}
          icon="sparkles-outline"
          disabled={!selectedScreenshot || importing}
        />
        {statusMessage ? <Text style={styles.noteLine}>{statusMessage}</Text> : null}
      </SurfaceCard>

      {selectedScreenshot ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>待导入截图</Text>
          <Image source={{ uri: selectedScreenshot.previewUri }} style={styles.previewImage} resizeMode="contain" />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>文件名</Text>
            <Text style={styles.resultValue}>{selectedScreenshot.fileName}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>大小</Text>
            <Text style={styles.resultValue}>{(selectedScreenshot.sizeInBytes / 1024 / 1024).toFixed(2)} MB</Text>
          </View>
        </SurfaceCard>
      ) : null}

      {importResult ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>导入结果</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>平台</Text>
            <Text style={styles.resultValue}>{importResult.draft.platform || '-'}</Text>
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
            <Text style={styles.resultLabel}>写入持仓</Text>
            <Text style={styles.resultValue}>
              {importResult.normalized.accepted_positions} 条
            </Text>
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
            label="前往手动录入页"
            onPress={() => navigation.navigate('ManualEntry', { prefill: importResult.draft })}
            icon="open-outline"
          />
          <Text style={styles.sectionTitle}>识别 JSON</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.codeBlock}>{JSON.stringify(importResult.extracted, null, 2)}</Text>
          </ScrollView>
        </SurfaceCard>
      ) : null}

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>说明</Text>
        <Text style={styles.noteLine}>后端会把截图转给千问 `qwen3.6-plus` 进行图像理解。</Text>
        <Text style={styles.noteLine}>识别完成后会自动跳转到手动录入页，方便你继续删改。</Text>
        <Text style={styles.noteLine}>持仓成本价来自截图，现价会在导入草稿时通过 Twelve Data 拉取。</Text>
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
  codeBlock: {
    minWidth: '100%',
    borderRadius: radius.lg,
    backgroundColor: '#0E1A2B',
    color: '#E5EEF9',
    padding: spacing.md,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
});
