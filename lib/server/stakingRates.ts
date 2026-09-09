const MONTHLY_RATES = [0.09, 0.10, 0.08, 0.07, 0.08, 0.06, 0.06, 0.07, 0.06];
const ALTERNATING_RATES = [0.06, 0.07];

export const getMonthlyRate = (month: number): number => {
  const m = Math.max(1, Math.floor(month));
  if (m <= MONTHLY_RATES.length) return MONTHLY_RATES[m - 1];
  const idx = (m - MONTHLY_RATES.length - 1) % ALTERNATING_RATES.length;
  return ALTERNATING_RATES[idx];
};

export const getDailyRateForMonth = (month: number) => getMonthlyRate(month) / 30;

export const getCurrentStakingMonth = (stakingStartDate: string | Date): number => {
  if (!stakingStartDate) return 1;
  const start = new Date(stakingStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return 1;
  return Math.floor(diffMs / (30 * 24 * 60 * 60 * 1000)) + 1;
};

export const calculateVariableReward = (
  stakedAmount: number,
  stakingStartDate: string | Date,
  periodStart?: string | Date | null,
  periodEnd?: string | Date | null
) => {
  if (!stakedAmount || stakedAmount <= 0 || !stakingStartDate) {
    return { reward: 0, currentMonth: 1, currentRate: getMonthlyRate(1) };
  }
  const start = new Date(stakingStartDate);
  const calcStart = periodStart ? new Date(periodStart) : start;
  const calcEnd = periodEnd ? new Date(periodEnd) : new Date();

  if (calcEnd <= calcStart) {
    const month = getCurrentStakingMonth(stakingStartDate);
    return { reward: 0, currentMonth: month, currentRate: getMonthlyRate(month) };
  }

  let reward = 0;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  let cursor = new Date(calcStart);

  while (cursor < calcEnd) {
    const daysSinceStart = Math.floor((cursor.getTime() - start.getTime()) / MS_PER_DAY);
    const month = Math.floor(daysSinceStart / 30) + 1;
    reward += stakedAmount * getDailyRateForMonth(month);
    cursor = new Date(cursor.getTime() + MS_PER_DAY);
  }

  const currentMonth = getCurrentStakingMonth(stakingStartDate);
  return {
    reward: Math.round(reward * 100000000) / 100000000,
    currentMonth,
    currentRate: getMonthlyRate(currentMonth),
  };
};
