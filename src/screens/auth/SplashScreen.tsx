import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDemoStore } from '../../store/demoStore';
import { colors, fontFamilies, spacing } from '../../theme';

export function SplashScreen() {
  const restoreSession = useDemoStore((state) => state.restoreSession);

  useEffect(() => {
    const timer = setTimeout(() => {
      void restoreSession();
    }, 800);

    return () => clearTimeout(timer);
  }, [restoreSession]);

  return (
    <LinearGradient
      colors={['#0B1830', '#16385A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoWrap}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>衡</Text>
        </View>
      </View>
      <Text style={styles.title}>衡策资产</Text>
      <Text style={styles.subtitle}>统一查看你的全部投资资产</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  logoWrap: {
    marginBottom: spacing.md,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    color: colors.white,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    color: colors.white,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
});
