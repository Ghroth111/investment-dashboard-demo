import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { AccountDetailScreen } from '../screens/accounts/AccountDetailScreen';
import { AccountsScreen } from '../screens/accounts/AccountsScreen';
import { AddAccountScreen } from '../screens/accounts/AddAccountScreen';
import { ApiConnectScreen } from '../screens/accounts/ApiConnectScreen';
import { ManualEntryScreen } from '../screens/accounts/ManualEntryScreen';
import { ScreenshotImportScreen } from '../screens/accounts/ScreenshotImportScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AddTransactionScreen } from '../screens/transactions/AddTransactionScreen';
import { TransactionsScreen } from '../screens/transactions/TransactionsScreen';
import { useDemoStore } from '../store/demoStore';
import { colors, fontFamilies } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabel: ({ focused }) => (
          <Text style={[styles.tabLabel, focused ? styles.tabLabelFocused : null]}>
            {tabLabels[route.name]}
          </Text>
        ),
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? activeIcons[route.name] : inactiveIcons[route.name]}
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
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
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

const tabLabels: Record<keyof TabParamList, string> = {
  Dashboard: '首页',
  Accounts: '账户',
  Transactions: '交易',
  Settings: '我的',
};

const activeIcons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'grid',
  Accounts: 'wallet',
  Transactions: 'receipt',
  Settings: 'person-circle',
};

const inactiveIcons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'grid-outline',
  Accounts: 'wallet-outline',
  Transactions: 'receipt-outline',
  Settings: 'person-circle-outline',
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    height: 72,
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
});
