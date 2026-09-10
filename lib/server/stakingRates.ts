const MONTHLY_RATES = [0.09, 0.10, 0.08, 0.07, 0.08, 0.06, 0.06, 0.07, 0.06];
const ALTERNATING = [0.06, 0.07];

export const getMonthlyRate = (month: number) => {
  const m = Math.max(1, Math.floor(month));
  if (m <= MONTHLY_RATES.length) return MONTHLY_RATES[m - 1];
  return ALTERNATING[(m - MONTHLY_RATES.length - 1) % ALTERNATING.length];
};

export const getDailyRate = (month: number) => getMonthlyRate(month) / 30;

export const getCurrentStakingMonth = (start: string | Date) => {
  const diffMs = Date.now() - new Date(start).getTime();
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
    const m = getCurrentStakingMonth(stakingStartDate);
    return { reward: 0, currentMonth: m, currentRate: getMonthlyRate(m) };
  }
  let reward = 0;
  const MS_DAY = 86400000;
  let cursor = new Date(calcStart);
  while (cursor < calcEnd) {
    const days = Math.floor((cursor.getTime() - start.getTime()) / MS_DAY);
    const month = Math.floor(days / 30) + 1;
    reward += stakedAmount * getDailyRate(month);
    cursor = new Date(cursor.getTime() + MS_DAY);
  }
  const currentMonth = getCurrentStakingMonth(stakingStartDate);
  return { reward: Math.round(reward * 1e8) / 1e8, currentMonth, currentRate: getMonthlyRate(currentMonth) };
};
