import { format, subDays } from 'date-fns';
import type { Habit, HabitLog } from './types';

function id(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateLogs(
  habitId: string,
  days: number,
  dailyGoal: number,
  config: {
    skipRate: number;
    varianceMin: number;
    varianceMax: number;
    weekendSkipBoost: number;
    slumpStart?: number;
    slumpEnd?: number;
    slumpSkipRate?: number;
  }
): HabitLog[] {
  const logs: HabitLog[] = [];

  for (let i = days; i >= 1; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const dayOfWeek = subDays(new Date(), i).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const rand = seededRandom(i * 7 + habitId.charCodeAt(0));

    let skipChance = config.skipRate;
    if (isWeekend) skipChance += config.weekendSkipBoost;
    if (config.slumpStart && config.slumpEnd && i <= days - config.slumpStart && i >= days - config.slumpEnd) {
      skipChance = config.slumpSkipRate ?? 0.6;
    }

    const skipped = rand < skipChance;

    if (skipped) {
      logs.push({
        id: id(),
        habitId,
        date,
        completed: false,
        value: 0,
        skipped: true,
      });
    } else {
      const valueRand = seededRandom(i * 13 + habitId.charCodeAt(1));
      const range = config.varianceMax - config.varianceMin;
      const value = Math.round(dailyGoal * (config.varianceMin + valueRand * range));

      logs.push({
        id: id(),
        habitId,
        date,
        completed: true,
        value,
        skipped: false,
      });
    }
  }

  return logs;
}

export function getSeedData(): { habits: Habit[]; logs: HabitLog[] } {
  // 1. Reading — consistent reader, slump mid-month
  const readingHabit: Habit = {
    id: 'seed-reading',
    name: 'Daily Reading',
    category: 'mind',
    unit: 'pages',
    dailyGoal: 10,
    compoundingMetric: 'books/year',
    createdAt: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
  };
  const readingLogs = generateLogs('seed-reading', 60, 10, {
    skipRate: 0.12,
    varianceMin: 0.6,
    varianceMax: 1.8,
    weekendSkipBoost: 0.1,
    slumpStart: 20,
    slumpEnd: 27,
    slumpSkipRate: 0.55,
  });

  // 2. Steps — aiming for 10k, pretty active but inconsistent on weekends
  const stepsHabit: Habit = {
    id: 'seed-steps',
    name: 'Daily Steps',
    category: 'body',
    unit: 'steps',
    dailyGoal: 10000,
    compoundingMetric: 'miles/year',
    createdAt: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
  };
  const stepsLogs = generateLogs('seed-steps', 60, 10000, {
    skipRate: 0.08,
    varianceMin: 0.4,       // lazy 4k day
    varianceMax: 1.4,       // big 14k day
    weekendSkipBoost: 0.15,
    slumpStart: 30,
    slumpEnd: 36,
    slumpSkipRate: 0.45,
  });

  // 3. Protein — harder to stay consistent, weekends are rough
  const proteinHabit: Habit = {
    id: 'seed-protein',
    name: 'Protein Intake',
    category: 'body',
    unit: 'grams',
    dailyGoal: 150,
    compoundingMetric: '% days on target',
    createdAt: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
  };
  const proteinLogs = generateLogs('seed-protein', 60, 150, {
    skipRate: 0.18,
    varianceMin: 0.5,
    varianceMax: 1.15,
    weekendSkipBoost: 0.2,
    slumpStart: 35,
    slumpEnd: 42,
    slumpSkipRate: 0.5,
  });

  // 4. Workouts — rest days happen, had a rough stretch
  const workoutHabit: Habit = {
    id: 'seed-workout',
    name: 'Workouts',
    category: 'body',
    unit: 'minutes',
    dailyGoal: 30,
    compoundingMetric: 'sessions/year',
    createdAt: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
  };
  const workoutLogs = generateLogs('seed-workout', 60, 30, {
    skipRate: 0.25,
    varianceMin: 0.7,
    varianceMax: 1.6,
    weekendSkipBoost: 0.05,
    slumpStart: 40,
    slumpEnd: 48,
    slumpSkipRate: 0.65,
  });

  return {
    habits: [readingHabit, stepsHabit, proteinHabit, workoutHabit],
    logs: [...readingLogs, ...stepsLogs, ...proteinLogs, ...workoutLogs],
  };
}
