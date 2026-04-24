import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountDetailScreen } from '../screens/accounts/AccountDetailScreen';
import { AccountsScreen } from '../screens/accounts/AccountsScreen';
import { AddAccountScreen } from '../screens/accounts/AddAccountScreen';
import { ApiConnectScreen } from '../screens/accounts/ApiConnectScreen';
import { AssetDetailScreen } from '../screens/accounts/AssetDetailScreen';
import { DistributionDetailScreen } from '../screens/accounts/DistributionDetailScreen';
import { EditHoldingTradeScreen } from '../screens/accounts/EditHoldingTradeScreen';
import { ManualEntryScreen } from '../screens/accounts/ManualEntryScreen';
import { ScreenshotImportScreen } from '../screens/accounts/ScreenshotImportScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AddTransactionScreen } from '../screens/transactions/AddTransactionScreen';
import { TransactionsScreen } from '../screens/transactions/TransactionsScreen';
import { useDemoStore } from '../store/demoStore';
import { colors, fontFamilies, radius, spacing } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/** Placeholder component for the Add tab – never actually rendered */
function AddPlaceholder() {
  return null;
}

function AddActionModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: (action?: 'manual' | 'screenshot') => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onClose()}
    >
      <TouchableWithoutFeedback onPress={() => onClose()}>
        <View style={modalStyles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[modalStyles.sheet, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              <View style={modalStyles.handle} />

              <Text style={modalStyles.sheetTitle}>添加账户</Text>
              <Text style={modalStyles.sheetSubtitle}>选择导入方式</Text>

              <Pressable
                style={({ pressed }) => [
                  modalStyles.optionCard,
                  pressed && modalStyles.optionPressed,
                ]}
                onPress={() => onClose('manual')}
              >
                <View style={[modalStyles.optionIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="create-outline" size={22} color={colors.white} />
                </View>
                <View style={modalStyles.optionContent}>
                  <Text style={modalStyles.optionLabel}>手动录入</Text>
                  <Text style={modalStyles.optionDesc}>手动输入持仓和账户信息</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  modalStyles.optionCard,
                  pressed && modalStyles.optionPressed,
                ]}
                onPress={() => onClose('screenshot')}
              >
                <View style={[modalStyles.optionIcon, { backgroundColor: colors.accent }]}>
                  <Ionicons name="scan-outline" size={22} color={colors.white} />
                </View>
                <View style={modalStyles.optionContent}>
                  <Text style={modalStyles.optionLabel}>截图导入</Text>
                  <Text style={modalStyles.optionDesc}>上传券商截图自动识别</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>

              <Pressable style={modalStyles.cancelBtn} onPress={() => onClose()}>
                <Text style={modalStyles.cancelText}>取消</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function MainTabs() {
  const [addActionVisible, setAddActionVisible] = useState(false);
  const navigation = useNavigation();

  const handleAddClose = useCallback(
    (action?: 'manual' | 'screenshot') => {
      setAddActionVisible(false);
      if (action === 'manual') {
        navigation.navigate('ManualEntry');
      } else if (action === 'screenshot') {
        navigation.navigate('ScreenshotImport');
      }
    },
    [navigation],
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.tabLabel, focused ? styles.tabLabelFocused : null]}>
              {tabLabels[route.name as keyof typeof tabLabels] ?? ''}
            </Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={
                focused
                  ? activeIcons[route.name as keyof typeof activeIcons]
                  : inactiveIcons[route.name as keyof typeof inactiveIcons]
              }
              size={size}
              color={color}
            />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Accounts" component={AccountsScreen} />
        <Tab.Screen
          name="Add"
          component={AddPlaceholder}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: () => (
              <View style={styles.addButton}>
                <Ionicons name="add" size={28} color={colors.white} />
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setAddActionVisible(true);
            },
          }}
        />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>

      <AddActionModal visible={addActionVisible} onClose={handleAddClose} />
    </>
  );
}

export function AppNavigator() {
  const phase = useDemoStore((state) => state.phase);

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.canvas,
        },
      }}
    >
      {phase === 'splash' ? <RootStack.Screen name="Splash" component={SplashScreen} /> : null}
      {phase === 'login' ? <RootStack.Screen name="Login" component={LoginScreen} /> : null}
      {phase === 'app' ? (
        <>
          <RootStack.Screen name="MainTabs" component={MainTabs} />
          <RootStack.Screen name="AccountDetail" component={AccountDetailScreen} />
          <RootStack.Screen name="AssetDetail" component={AssetDetailScreen} />
          <RootStack.Screen name="EditHoldingTrade" component={EditHoldingTradeScreen} />
          <RootStack.Screen name="DistributionDetail" component={DistributionDetailScreen} />
          <RootStack.Screen name="AddAccount" component={AddAccountScreen} />
          <RootStack.Screen name="AddTransaction" component={AddTransactionScreen} />
          <RootStack.Screen name="ApiConnect" component={ApiConnectScreen} />
          <RootStack.Screen name="ScreenshotImport" component={ScreenshotImportScreen} />
          <RootStack.Screen name="ManualEntry" component={ManualEntryScreen} />
        </>
      ) : null}
    </RootStack.Navigator>
  );
}

const tabLabels: Record<string, string> = {
  Dashboard: '首页',
  Accounts: '分析',
  Add: '',
  Transactions: '流水',
  Settings: '我的',
};

const activeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'grid',
  Accounts: 'pie-chart',
  Transactions: 'receipt',
  Settings: 'person-circle',
};

const inactiveIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'grid-outline',
  Accounts: 'pie-chart-outline',
  Transactions: 'receipt-outline',
  Settings: 'person-circle-outline',
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    height: 74,
    paddingTop: 10,
    paddingBottom: 10,
  },
  tabLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  tabLabelFocused: {
    color: colors.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 20,
    color: colors.text,
    lineHeight: 26,
  },
  sheetSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  optionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    color: colors.text,
  },
  optionDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  cancelText: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    color: colors.textMuted,
  },
});
