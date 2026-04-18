import type { TrendPoint, TrendRange } from '../types/models';

export const mockPortfolioHistory: Record<TrendRange, TrendPoint[]> = {
  '1D': [
    { label: '09:30', valueUsd: 90740 },
    { label: '10:30', valueUsd: 91110 },
    { label: '11:30', valueUsd: 90895 },
    { label: '13:30', valueUsd: 91380 },
    { label: '15:00', valueUsd: 91890 },
    { label: 'Now', valueUsd: 92101 },
  ],
  '7D': [
    { label: 'Mon', valueUsd: 87620 },
    { label: 'Tue', valueUsd: 88210 },
    { label: 'Wed', valueUsd: 89050 },
    { label: 'Thu', valueUsd: 90120 },
    { label: 'Fri', valueUsd: 91080 },
    { label: 'Sat', valueUsd: 91840 },
    { label: 'Now', valueUsd: 92101 },
  ],
  '30D': [
    { label: 'W1', valueUsd: 80410 },
    { label: 'W2', valueUsd: 81240 },
    { label: 'W3', valueUsd: 82990 },
    { label: 'W4', valueUsd: 84650 },
    { label: 'W5', valueUsd: 87110 },
    { label: 'W6', valueUsd: 88880 },
    { label: 'W7', valueUsd: 90540 },
    { label: 'Now', valueUsd: 92101 },
  ],
  ALL: [
    { label: '2024Q1', valueUsd: 61200 },
    { label: '2024Q2', valueUsd: 64880 },
    { label: '2024Q3', valueUsd: 67020 },
    { label: '2024Q4', valueUsd: 70240 },
    { label: '2025Q1', valueUsd: 74110 },
    { label: '2025Q2', valueUsd: 78630 },
    { label: '2025Q3', valueUsd: 82210 },
    { label: '2025Q4', valueUsd: 86140 },
    { label: '2026Q1', valueUsd: 89600 },
    { label: 'Now', valueUsd: 92101 },
  ],
};
