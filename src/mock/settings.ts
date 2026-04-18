import type { CurrencyCode, ExchangeRates } from '../types/models';

export const exchangeRates: ExchangeRates = {
  USD: 1,
  CNY: 0.138,
  EUR: 1.09,
  HKD: 0.128,
  USDT: 1,
};

export const baseCurrencyOptions: CurrencyCode[] = ['USD', 'CNY', 'EUR', 'HKD'];

export const upcomingFeatures = [
  'Web 端资产同步',
  '截图识别导入',
  '自动同步券商',
  '投资与生活账本联动',
];
