import { useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { useHabitStore } from '../store/habitStore';
import { calculateProjections, toCompoundingMetric } from '../lib/compound';
import { HABIT_TEMPLATES } from '../lib/types';

export default function Insights() {
  const { habits, logs } = useHabitStore();
  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    );

    return habits.map(habit => {
      const weekLogs = logs.filter(
        l => l.habitId === habit.id && last7Days.includes(l.date)
      );
      const completed = weekLogs.filter(l => l.completed).length;
      const skipped = weekLogs.filter(l => l.skipped).length;
      const template = HABIT_TEMPLATES.find(t => t.name === habit.name);

      return {
        habit,
        icon: template?.icon || '📌',
        completed,
        skipped,
        missed: 7 - completed - skipped,
        consistency: Math.round((completed / 7) * 100),
        totalValue: weekLogs.filter(l => l.completed).reduce((sum, l) => sum + l.value, 0),
      };
    });
  }, [habits, logs]);

  const overallConsistency = useMemo(() => {
    if (weeklyData.length === 0) return 0;
    return Math.round(
      weeklyData.reduce((sum, d) => sum + d.consistency, 0) / weeklyData.length
    );
  }, [weeklyData]);

  const bestHabit = useMemo(() => {
    if (weeklyData.length === 0) return null;
    return [...weeklyData].sort((a, b) => b.consistency - a.consistency)[0];
  }, [weeklyData]);

  const worstHabit = useMemo(() => {
    if (weeklyData.length === 0) return null;
    return [...weeklyData].sort((a, b) => a.consistency - b.consistency)[0];
  }, [weeklyData]);

  if (habits.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h2>Insights</h2>
          <p>Add some habits first to see your weekly insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Weekly Insights</h2>
        <p>Here's what your week of decisions really means.</p>
      </div>

      {/* Overall */}
      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-label">Weekly Consistency</div>
          <div className="stat-value" style={{
            color: overallConsistency >= 80 ? '#00FF88' : overallConsistency >= 50 ? '#FFB830' : '#FF4444'
          }}>
            {overallConsistency}%
          </div>
        </div>
        {bestHabit && (
          <div className="stat-box">
            <div className="stat-label">Best Habit</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {bestHabit.icon} {bestHabit.habit.name}
            </div>
            <div style={{ fontSize: 13, color: '#00FF88', fontFamily: 'DM Mono, monospace' }}>
              {bestHabit.consistency}%
            </div>
          </div>
        )}
        {worstHabit && (
          <div className="stat-box">
            <div className="stat-label">Needs Attention</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {worstHabit.icon} {worstHabit.habit.name}
            </div>
            <div style={{ fontSize: 13, color: '#FF4444', fontFamily: 'DM Mono, monospace' }}>
              {worstHabit.consistency}%
            </div>
          </div>
        )}
      </div>

      {/* Per-habit breakdown */}
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, marginTop: 32 }}>Habit Breakdown</h3>
      {weeklyData.map(({ habit, icon, completed, consistency, totalValue }) => {
        const allLogs = logs.filter(l => l.habitId === habit.id);
        const projections = calculateProjections(habit, allLogs);

        return (
          <div key={habit.id} className="insight-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontWeight: 600 }}>{habit.name}</span>
                </div>

                {/* 7-day dots */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
                    const log = logs.find(l => l.habitId === habit.id && l.date === date);
                    const color = log?.completed ? '#00FF88' : log?.skipped ? '#FF4444' : '#374151';
                    return (
                      <div
                        key={i}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: color,
                          opacity: log ? 1 : 0.3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontFamily: 'DM Mono, monospace',
                          color: '#0A0F1E',
                        }}
                        title={date}
                      >
                        {format(subDays(new Date(), 6 - i), 'EEE').charAt(0)}
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                  {completed}/7 days · {totalValue} {habit.unit} this week
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: consistency >= 80 ? '#00FF88' : consistency >= 50 ? '#FFB830' : '#FF4444',
                }}>
                  {consistency}%
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Mono, monospace' }}>
                  this week
                </div>
              </div>
            </div>

            {/* Year projection at current pace */}
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 8,
              fontSize: 13,
              color: '#9CA3AF',
              fontFamily: 'DM Mono, monospace',
            }}>
              At this pace: <span style={{ color: '#FFB830' }}>{toCompoundingMetric(habit, projections.year1.actual)}</span> / yr
              {' · '}
              Optimal: <span style={{ color: '#00FF88' }}>{toCompoundingMetric(habit, projections.year1.optimal)}</span> / yr
              {' · '}
              Gap: <span style={{ color: '#FF4444' }}>{toCompoundingMetric(habit, projections.year1.gap)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
