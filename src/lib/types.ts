export type HabitCategory = 'mind' | 'body' | 'money' | 'skills' | 'wellbeing';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  unit: string;
  dailyGoal: number;
  compoundingMetric: string;
  createdAt: string;
  color?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value: number; // actual amount logged
  skipped: boolean;
}

export interface BranchPoint {
  date: string;
  optimal: number;
  actual: number;
  gap: number;
  skipped: boolean;
}

export interface CompoundProjection {
  days30: { optimal: number; actual: number; gap: number };
  days90: { optimal: number; actual: number; gap: number };
  year1: { optimal: number; actual: number; gap: number };
  year5: { optimal: number; actual: number; gap: number };
}

export interface HabitTemplate {
  name: string;
  category: HabitCategory;
  unit: string;
  defaultGoal: number;
  compoundingMetric: string;
  icon: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Mind
  { name: 'Daily Reading', category: 'mind', unit: 'pages', defaultGoal: 10, compoundingMetric: 'books/year', icon: '📖' },
  { name: 'Meditation', category: 'mind', unit: 'minutes', defaultGoal: 10, compoundingMetric: 'total hours', icon: '🧘' },
  { name: 'Journaling', category: 'mind', unit: 'entries', defaultGoal: 1, compoundingMetric: 'entries/year', icon: '📝' },
  { name: 'Language Learning', category: 'mind', unit: 'minutes', defaultGoal: 15, compoundingMetric: 'fluency hours', icon: '🌍' },
  { name: 'Studying', category: 'mind', unit: 'minutes', defaultGoal: 30, compoundingMetric: 'study hours/year', icon: '📚' },
  // Body
  { name: 'Daily Steps', category: 'body', unit: 'steps', defaultGoal: 8000, compoundingMetric: 'miles/year', icon: '🚶' },
  { name: 'Workouts', category: 'body', unit: 'minutes', defaultGoal: 30, compoundingMetric: 'sessions/year', icon: '💪' },
  { name: 'Protein Intake', category: 'body', unit: 'grams', defaultGoal: 100, compoundingMetric: '% days on target', icon: '🥩' },
  { name: 'Water Intake', category: 'body', unit: 'oz', defaultGoal: 64, compoundingMetric: 'hydration score', icon: '💧' },
  { name: 'Sleep', category: 'body', unit: 'hours', defaultGoal: 8, compoundingMetric: 'sleep debt hours', icon: '😴' },
  // Money
  { name: 'Daily Savings', category: 'money', unit: 'dollars', defaultGoal: 10, compoundingMetric: 'projected savings (6% APR)', icon: '💰' },
  { name: 'No-Spend Days', category: 'money', unit: 'days', defaultGoal: 1, compoundingMetric: 'money saved/year', icon: '🚫' },
  { name: 'Investment Contributions', category: 'money', unit: 'dollars', defaultGoal: 25, compoundingMetric: 'portfolio projection', icon: '📈' },
];

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  mind: '🧠 Mind',
  body: '💪 Body',
  money: '💰 Money',
  skills: '🎯 Skills',
  wellbeing: '🌱 Wellbeing',
};

export const CATEGORY_COLORS: Record<HabitCategory, string> = {
  mind: '#A78BFA',
  body: '#00FF88',
  money: '#FFB830',
  skills: '#38BDF8',
  wellbeing: '#34D399',
};
