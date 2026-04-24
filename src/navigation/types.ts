import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ManualEntryPrefill } from '../types/models';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainTabs: undefined;
  AccountDetail: { accountId: string };
  AssetDetail:
    | { assetKey: string; accountId?: string; holdingId?: string }
    | { accountId: string; holdingId: string; assetKey?: string };
  EditHoldingTrade: { tradeId: string };
  DistributionDetail: {
    kind: 'assetClass' | 'platform';
    label: string;
    tone: string;
  };
  AddAccount: undefined;
  AddTransaction: undefined;
  ApiConnect: undefined;
  ScreenshotImport: undefined;
  ManualEntry: { prefill?: ManualEntryPrefill } | undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Accounts: undefined;
  Add: undefined;
  Transactions: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AppTabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
