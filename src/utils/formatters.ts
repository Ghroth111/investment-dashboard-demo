import type { CurrencyCode } from '../types/models';

export function formatCurrency(amount: number, currency: CurrencyCode, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(amount);
}

export function formatSignedCurrency(amount: number, currency: CurrencyCode, digits = 0) {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}${formatCurrency(Math.abs(amount), currency, digits)}`;
}

export function formatPercent(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value * 100).toFixed(2)}%`;
}

export function formatDateTime(dateLike: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateLike));
}

export function formatShortDate(dateLike: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateLike));
}
