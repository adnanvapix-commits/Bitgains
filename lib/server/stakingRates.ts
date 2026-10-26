// Staking rates by package type
// 6-month: dynamic up to 12% per month
// 12-month: dynamic up to 15% per month

// 6-month package monthly rates (6 months)
const SIX_MONTH_RATES = [0.08, 0.09, 0.10, 0.11, 0.12, 0.12];

// 12-month package monthly rates (12 months)
const TWELVE_MONTH_RATES = [0.09, 0.10, 0.11, 0.12, 0.12, 0.13, 0.13, 0.14, 0.14, 0.15, 0.15, 0.15];

// Legacy rates (kept for backward compatibility with old 90-day stakes)
const LEGACY_MONTHLY_RATES = [0.09, 0.10, 0.11, 0.10, 0.12, 0.11, 0.13, 0.12, 0.15];
const LEGACY_ALTERNATING  = [0.12, 0.13, 0.14, 0.15];

export type PackageType = '6-month' | '12-month' | '90-day';

/**
 * Get the monthly rate for a given month index within a package.
 * month is 1-based.
 */
export const getMonthlyRate = (month: number, packageType: PackageType = '12-month') => {
  const m = Math.max(1, Math.floor(month));

  if (packageType === '6-month') {
    return SIX_MONTH_RATES[Math.min(m - 1, SIX_MONTH_RATES.length - 1)];
  }

  if (packageType === '12-month') {
    return TWELVE_MONTH_RATES[Math.min(m - 1, TWELVE_MONTH_RATES.length - 1)];
  }

  // Legacy 90-day
  if (m <= LEGACY_MONTHLY_RATES.length) return LEGACY_MONTHLY_RATES[m - 1];
  return LEGACY_ALTERNATING[(m - LEGACY_MONTHLY_RATES.length - 1) % LEGACY_ALTERNATING.length];
};

export const getDailyRate = (month: number, packageType: PackageType = '12-month') =>
  getMonthlyRate(month, packageType) / 30;

export const getCurrentStakingMonth = (start: string | Date) => {
  const diffMs = Date.now() - new Date(start).getTime();
  if (diffMs < 0) return 1;
  return Math.floor(diffMs / (30 * 24 * 60 * 60 * 1000)) + 1;
};

/**
 * Get the total number of months for a package type.
 */
export const getPackageDurationMonths = (packageType: PackageType): number => {
  if (packageType === '6-month') return 6;
  if (packageType === '12-month') return 12;
  return 3; // legacy 90-day = 3 months
};

export const calculateVariableReward = (
  stakedAmount: number,
  stakingStartDate: string | Date,
  periodStart?: string | Date | null,
  periodEnd?: string | Date | null,
  packageType: PackageType = '12-month'
) => {
  if (!stakedAmount || stakedAmount <= 0 || !stakingStartDate) {
    return { reward: 0, currentMonth: 1, currentRate: getMonthlyRate(1, packageType) };
  }
  const start = new Date(stakingStartDate);
  const calcStart = periodStart ? new Date(periodStart) : start;
  const calcEnd = periodEnd ? new Date(periodEnd) : new Date();
  if (calcEnd <= calcStart) {
    const m = getCurrentStakingMonth(stakingStartDate);
    return { reward: 0, currentMonth: m, currentRate: getMonthlyRate(m, packageType) };
  }
  let reward = 0;
  const MS_DAY = 86400000;
  let cursor = new Date(calcStart);
  while (cursor < calcEnd) {
    const days = Math.floor((cursor.getTime() - start.getTime()) / MS_DAY);
    const month = Math.floor(days / 30) + 1;
    reward += stakedAmount * getDailyRate(month, packageType);
    cursor = new Date(cursor.getTime() + MS_DAY);
  }
  const currentMonth = getCurrentStakingMonth(stakingStartDate);
  return { reward: Math.round(reward * 1e8) / 1e8, currentMonth, currentRate: getMonthlyRate(currentMonth, packageType) };
};
