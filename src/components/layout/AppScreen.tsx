import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamilies, spacing } from '../../theme';

interface AppScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function AppScreen({
  children,
  scrollable = true,
  contentStyle,
  refreshing,
  onRefresh,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [
    styles.content,
    {
      paddingTop: insets.top + spacing.lg,
      paddingBottom: insets.bottom + spacing.xxxl,
    },
    contentStyle,
  ];

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={containerStyle}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={true}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
            ) : undefined
          }
        >
          {refreshing ? (
            <View style={styles.refreshBanner}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.refreshText}>正在刷新…</Text>
            </View>
          ) : null}
          {children}
        </ScrollView>
      ) : (
        <View style={containerStyle}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  glowTop: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: 'rgba(13, 122, 107, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(33, 94, 160, 0.08)',
  },
  refreshBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  refreshText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.accent,
  },
});
