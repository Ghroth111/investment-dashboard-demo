import type {
  BaseExpenseCategory,
  BaseIncomeCategory,
  Transaction,
  TransactionCategory,
  TransactionFilter,
  TransactionType,
} from '../../types/models';

export const expenseCategories: BaseExpenseCategory[] = [
  'Housing',
  'Rent',
  'Mortgage',
  'Groceries',
  'Dining',
  'Coffee',
  'Transportation',
  'Fuel',
  'Parking',
  'Shopping',
  'Healthcare',
  'Fitness',
  'Education',
  'Entertainment',
  'Travel',
  'Utilities',
  'Insurance',
  'Subscriptions',
  'Family',
  'Gifts',
  'Taxes',
  'Other',
];

export const incomeCategories: BaseIncomeCategory[] = [
  'Salary',
  'Bonus',
  'Freelance',
  'Business',
  'Stocks',
  'Crypto',
  'Interest',
  'Dividends',
  'Funds',
  'Refund',
  'Rental',
  'Gift',
  'Other',
];

export const transferCategories = ['Transfer'] as const;
export const customCategoryLabel = 'Custom' as const;

export const transactionFilters: { label: string; value: TransactionFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Expenses', value: 'expense' },
  { label: 'Investments', value: 'investment' },
];

export const transactionTypeOptions = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
] as const;

const investmentCategories = new Set<BaseIncomeCategory>([
  'Stocks',
  'Crypto',
  'Interest',
  'Dividends',
  'Funds',
]);

const categoryIconMap: Record<string, string> = {
  Housing: 'home-outline',
  Rent: 'bed-outline',
  Mortgage: 'business-outline',
  Groceries: 'basket-outline',
  Dining: 'restaurant-outline',
  Coffee: 'cafe-outline',
  Transportation: 'car-outline',
  Fuel: 'speedometer-outline',
  Parking: 'navigate-outline',
  Shopping: 'bag-handle-outline',
  Healthcare: 'medkit-outline',
  Fitness: 'barbell-outline',
  Education: 'school-outline',
  Entertainment: 'game-controller-outline',
  Travel: 'airplane-outline',
  Utilities: 'flash-outline',
  Insurance: 'shield-checkmark-outline',
  Subscriptions: 'repeat-outline',
  Family: 'people-outline',
  Gifts: 'gift-outline',
  Taxes: 'document-text-outline',
  Other: 'apps-outline',
  Salary: 'cash-outline',
  Bonus: 'ribbon-outline',
  Freelance: 'laptop-outline',
  Business: 'briefcase-outline',
  Stocks: 'trending-up-outline',
  Crypto: 'logo-bitcoin',
  Interest: 'pie-chart-outline',
  Dividends: 'wallet-outline',
  Funds: 'bar-chart-outline',
  Refund: 'refresh-outline',
  Rental: 'key-outline',
  Gift: 'gift-outline',
  Transfer: 'swap-horizontal-outline',
  Custom: 'add-circle-outline',
};

export function getTransactionCategories(
  type: TransactionType,
  customCategories: string[] = [],
) {
  const baseCategories =
    type === 'expense'
      ? [...expenseCategories]
      : type === 'income'
        ? [...incomeCategories]
        : [...transferCategories];

  return [...baseCategories, ...customCategories, customCategoryLabel];
}

export function getTransactionCategoryIcon(category: TransactionCategory) {
  return (categoryIconMap[category] ?? 'ellipse-outline') as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
}

export function isInvestmentTransaction(transaction: Transaction) {
  return (
    Boolean(transaction.tradeId) ||
    (transaction.type === 'income' &&
      investmentCategories.has(transaction.category as BaseIncomeCategory))
  );
}

export function getTransactionsByFilter(
  transactions: Transaction[],
  filter: TransactionFilter,
) {
  switch (filter) {
    case 'income':
      return transactions.filter((transaction) => transaction.type === 'income');
    case 'expense':
      return transactions.filter((transaction) => transaction.type === 'expense');
    case 'investment':
      return transactions.filter(isInvestmentTransaction);
    default:
      return transactions;
  }
}
