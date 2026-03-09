import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Habit, HabitLog, HabitTemplate } from '../lib/types';
import { today } from '../lib/compound';
import { getSeedData } from '../lib/seed';

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  onboarded: boolean;

  // Actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  addHabitFromTemplate: (template: HabitTemplate, goal?: number) => void;
  updateHabit: (id: string, updates: Partial<Pick<Habit, 'name' | 'dailyGoal' | 'unit' | 'compoundingMetric'>>) => void;
  removeHabit: (id: string) => void;
  logHabit: (habitId: string, value: number, completed: boolean) => void;
  getLogsForHabit: (habitId: string) => HabitLog[];
  getTodayLog: (habitId: string) => HabitLog | undefined;
  setOnboarded: (value: boolean) => void;
  resetToSeed: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      onboarded: false,

      addHabit: (habit) => {
        const newHabit: Habit = {
          ...habit,
          id: generateId(),
          createdAt: today(),
        };
        set(state => ({ habits: [...state.habits, newHabit] }));
      },

      addHabitFromTemplate: (template, goal) => {
        const newHabit: Habit = {
          id: generateId(),
          name: template.name,
          category: template.category,
          unit: template.unit,
          dailyGoal: goal ?? template.defaultGoal,
          compoundingMetric: template.compoundingMetric,
          createdAt: today(),
        };
        set(state => ({ habits: [...state.habits, newHabit] }));
      },

      updateHabit: (id, updates) => {
        set(state => ({
          habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h),
        }));
      },

      removeHabit: (id) => {
        set(state => ({
          habits: state.habits.filter(h => h.id !== id),
          logs: state.logs.filter(l => l.habitId !== id),
        }));
      },

      logHabit: (habitId, value, completed) => {
        const dateStr = today();
        const existingIndex = get().logs.findIndex(
          l => l.habitId === habitId && l.date === dateStr
        );

        const newLog: HabitLog = {
          id: generateId(),
          habitId,
          date: dateStr,
          completed,
          value: completed ? value : 0,
          skipped: !completed,
        };

        if (existingIndex >= 0) {
          set(state => ({
            logs: state.logs.map((l, i) => i === existingIndex ? { ...newLog, id: l.id } : l),
          }));
        } else {
          set(state => ({ logs: [...state.logs, newLog] }));
        }
      },

      getLogsForHabit: (habitId) => {
        return get().logs.filter(l => l.habitId === habitId);
      },

      getTodayLog: (habitId) => {
        return get().logs.find(l => l.habitId === habitId && l.date === today());
      },

      setOnboarded: (value) => set({ onboarded: value }),

      resetToSeed: () => {
        const seed = getSeedData();
        set({ habits: seed.habits, logs: seed.logs, onboarded: true });
      },
    }),
    {
      name: 'compound-habits',
      onRehydrateStorage: () => (state) => {
        // Auto-seed if no seed habits exist
        if (state && !state.habits.some(h => h.id.startsWith('seed-'))) {
          state.resetToSeed();
        }
      },
    }
  )
);
