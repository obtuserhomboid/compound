import type { Habit, HabitLog, BranchPoint, CompoundProjection } from './types';
import { format, differenceInDays, addDays, parseISO, startOfDay } from 'date-fns';

/**
 * Calculate compounded future value of a habit decision.
 * For money habits, uses real compound interest.
 * For other habits, uses linear accumulation with consistency multiplier.
 */
export function calculateCompoundValue(
  habit: Habit,
  dailyAmount: number,
  days: number
): number {
  if (habit.category === 'money') {
    // Real compound interest: FV = PMT × (((1 + r)^n - 1) / r)
    const dailyRate = 0.06 / 365; // 6% annual return
    if (dailyRate === 0) return dailyAmount * days;
    return dailyAmount * ((Math.pow(1 + dailyRate, days) - 1) / dailyRate);
  }

  // For non-money habits, straight accumulation
  return dailyAmount * days;
}

/**
 * Convert raw accumulated value to the habit's compounding metric.
 */
export function toCompoundingMetric(habit: Habit, totalValue: number): string {
  const { unit, compoundingMetric } = habit;

  if (unit === 'pages') {
    const books = totalValue / 250; // ~250 pages per book
    return `${books.toFixed(1)} books`;
  }
  if (unit === 'minutes' && compoundingMetric.includes('hours')) {
    return `${(totalValue / 60).toFixed(1)} hours`;
  }
  if (unit === 'steps') {
    const miles = totalValue / 2000; // ~2000 steps per mile
    return `${miles.toFixed(0)} miles`;
  }
  if (unit === 'dollars') {
    return `$${totalValue.toFixed(2)}`;
  }
  if (unit === 'entries') {
    return `${totalValue.toFixed(0)} entries`;
  }
  if (unit === 'grams') {
    return `${totalValue.toFixed(0)}g total`;
  }
  if (unit === 'oz') {
    const gallons = totalValue / 128;
    return `${gallons.toFixed(0)} gallons`;
  }
  if (unit === 'hours') {
    return `${totalValue.toFixed(0)} hours`;
  }
  if (unit === 'days') {
    return `${totalValue.toFixed(0)} days`;
  }

  return `${totalValue.toFixed(1)} ${unit}`;
}

/**
 * Generate the branching timeline data points.
 */
export function generateBranchData(
  habit: Habit,
  logs: HabitLog[],
  startDate: string,
  endDate: string
): BranchPoint[] {
  const points: BranchPoint[] = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = differenceInDays(end, start) + 1;

  const logMap = new Map<string, HabitLog>();
  logs.forEach(log => logMap.set(log.date, log));

  let optimalCumulative = 0;
  let actualCumulative = 0;

  for (let i = 0; i < totalDays; i++) {
    const currentDate = addDays(start, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const log = logMap.get(dateStr);

    optimalCumulative += habit.dailyGoal;

    const todayIsInFuture = currentDate > startOfDay(new Date());
    if (todayIsInFuture) {
      // For future dates, project based on current consistency rate
      const completedDays = logs.filter(l => l.completed).length;
      const totalLoggedDays = logs.length || 1;
      const consistencyRate = completedDays / totalLoggedDays;
      actualCumulative += habit.dailyGoal * consistencyRate;
    } else if (log) {
      actualCumulative += log.completed ? log.value : 0;
    }

    points.push({
      date: dateStr,
      optimal: habit.category === 'money'
        ? calculateCompoundValue(habit, habit.dailyGoal, i + 1)
        : optimalCumulative,
      actual: habit.category === 'money'
        ? calculateCompoundValue(habit, actualCumulative / (i + 1), i + 1)
        : actualCumulative,
      gap: 0,
      skipped: log ? log.skipped : false,
    });

    points[points.length - 1].gap = points[points.length - 1].optimal - points[points.length - 1].actual;
  }

  return points;
}

/**
 * Calculate projections at different time horizons.
 */
export function calculateProjections(
  habit: Habit,
  logs: HabitLog[]
): CompoundProjection {
  const completedLogs = logs.filter(l => l.completed);
  const totalDays = logs.length || 1;
  const avgDaily = completedLogs.reduce((sum, l) => sum + l.value, 0) / totalDays;

  const calc = (days: number) => ({
    optimal: calculateCompoundValue(habit, habit.dailyGoal, days),
    actual: calculateCompoundValue(habit, avgDaily, days),
    gap: calculateCompoundValue(habit, habit.dailyGoal, days) - calculateCompoundValue(habit, avgDaily, days),
  });

  return {
    days30: calc(30),
    days90: calc(90),
    year1: calc(365),
    year5: calc(365 * 5),
  };
}

/**
 * Calculate the daily average needed to catch up to the optimal line
 * by a target date (default: end of year).
 *
 * Also calculates what happens if you skip one more day.
 */
export function calculateCatchUp(
  habit: Habit,
  logs: HabitLog[]
): { dailyToRecover: number; dailyIfSkipTomorrow: number; daysRemaining: number; deficit: number } {
  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31);
  const daysSoFar = logs.length || 1;
  const daysRemaining = differenceInDays(yearEnd, now);

  if (daysRemaining <= 0) {
    return { dailyToRecover: habit.dailyGoal, dailyIfSkipTomorrow: habit.dailyGoal, daysRemaining: 0, deficit: 0 };
  }

  // What the optimal total should be by year end
  const optimalTotal = habit.dailyGoal * (daysSoFar + daysRemaining);

  // What's actually been logged so far
  const actualTotal = logs.filter(l => l.completed).reduce((sum, l) => sum + l.value, 0);

  // Deficit
  const deficit = optimalTotal - actualTotal;

  // Daily avg needed over remaining days to close the gap
  const dailyToRecover = Math.max(0, deficit / daysRemaining);

  // If tomorrow is also skipped, one fewer day and same deficit + another day's goal missed
  const deficitIfSkip = deficit + habit.dailyGoal;
  const dailyIfSkipTomorrow = Math.max(0, deficitIfSkip / Math.max(1, daysRemaining - 1));

  return { dailyToRecover, dailyIfSkipTomorrow, daysRemaining, deficit };
}

/**
 * Generate a skip cost message.
 */
export function getSkipCost(habit: Habit): string {
  const daily = habit.dailyGoal;
  const metricToday = toCompoundingMetric(habit, daily);
  const metricYear = toCompoundingMetric(habit, calculateCompoundValue(habit, daily, 365));
  const metric5Year = toCompoundingMetric(habit, calculateCompoundValue(habit, daily, 365 * 5));

  return `Skipping today's ${daily} ${habit.unit} means you're ${metricToday} behind. Over a year, that gap grows to ${metricYear}. Over 5 years: ${metric5Year}.`;
}

/**
 * Get today as YYYY-MM-DD.
 */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
