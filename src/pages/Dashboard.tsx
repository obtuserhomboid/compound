import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { useHabitStore } from '../store/habitStore';
import { HABIT_TEMPLATES } from '../lib/types';
import { today, calculateProjections, toCompoundingMetric, generateBranchData, calculateCatchUp } from '../lib/compound';
import BranchingTimeline from '../components/BranchingTimeline';
import LogModal from '../components/LogModal';

export default function Dashboard() {
  const { habits, logs, getTodayLog } = useHabitStore();
  const [logModalHabit, setLogModalHabit] = useState<string | null>(null);

  const todayStr = today();

  const stats = useMemo(() => {
    const todaysLogs = logs.filter(l => l.date === todayStr);
    const completed = todaysLogs.filter(l => l.completed).length;
    const skipped = todaysLogs.filter(l => l.skipped).length;
    const remaining = habits.length - completed - skipped;
    return { completed, skipped, remaining };
  }, [habits, logs, todayStr]);

  const habitWithTemplate = (habitName: string) => {
    return HABIT_TEMPLATES.find(t => t.name === habitName);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Today</h2>
        <p className="mono">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-label">Completed</div>
          <div className="stat-value optimal">{stats.completed}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Remaining</div>
          <div className="stat-value" style={{ color: '#F9FAFB' }}>{stats.remaining}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Skipped</div>
          <div className="stat-value skip">{stats.skipped}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {habits.map(habit => {
          const todayLog = getTodayLog(habit.id);
          const template = habitWithTemplate(habit.name);
          const icon = template?.icon || '📌';
          const status = todayLog?.completed ? 'completed' : todayLog?.skipped ? 'skipped' : '';
          const habitLogs = logs.filter(l => l.habitId === habit.id);
          const projections = calculateProjections(habit, habitLogs);
          const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
          const branchData = generateBranchData(habit, habitLogs, habit.createdAt, endDate);

          const completedDays = habitLogs.filter(l => l.completed).length;
          const totalDays = habitLogs.length || 1;
          const consistency = Math.round((completedDays / totalDays) * 100);
          const catchUp = calculateCatchUp(habit, habitLogs);
          const isBehind = catchUp.deficit > 0;

          return (
            <motion.div
              key={habit.id}
              className="card"
              style={{ padding: 0, overflow: 'hidden' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="checkin-icon">{icon}</div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 600 }}>
                      <Link to={`/habit/${habit.id}`} style={{ color: 'inherit' }}>
                        {habit.name}
                      </Link>
                    </h4>
                    <p style={{ fontSize: 12, color: '#6B7280', fontFamily: 'DM Mono, monospace' }}>
                      {status === 'completed' && todayLog
                        ? `${todayLog.value} ${habit.unit} logged today`
                        : status === 'skipped'
                          ? 'Skipped today'
                          : `Goal: ${habit.dailyGoal} ${habit.unit}/day`
                      }
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!status && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setLogModalHabit(habit.id)}
                    >
                      Log
                    </button>
                  )}
                  {status === 'completed' && (
                    <span className="tag" style={{ color: '#00FF88', background: 'rgba(0,255,136,0.1)' }}>Done</span>
                  )}
                  {status === 'skipped' && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setLogModalHabit(habit.id)}
                    >
                      Log instead
                    </button>
                  )}
                </div>
              </div>

              {/* Mini stats row */}
              <div style={{
                display: 'flex',
                gap: 24,
                padding: '12px 20px',
                fontSize: 12,
                fontFamily: 'DM Mono, monospace',
              }}>
                <div>
                  <span style={{ color: '#6B7280' }}>consistency </span>
                  <span style={{ color: consistency >= 75 ? '#00FF88' : consistency >= 50 ? '#FFB830' : '#FF4444' }}>
                    {consistency}%
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6B7280' }}>on track </span>
                  <span style={{ color: '#FFB830' }}>
                    {toCompoundingMetric(habit, projections.year1.actual)}/yr
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6B7280' }}>optimal </span>
                  <span style={{ color: '#00FF88' }}>
                    {toCompoundingMetric(habit, projections.year1.optimal)}/yr
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6B7280' }}>gap </span>
                  <span style={{ color: '#FF4444' }}>
                    {toCompoundingMetric(habit, projections.year1.gap)}
                  </span>
                </div>
              </div>

              {/* Catch-up callout */}
              {isBehind && (
                <div style={{
                  display: 'flex',
                  gap: 16,
                  padding: '0 20px 12px',
                  fontSize: 12,
                  fontFamily: 'DM Mono, monospace',
                }}>
                  <div style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'rgba(255, 184, 48, 0.06)',
                    border: '1px solid rgba(255, 184, 48, 0.15)',
                    borderRadius: 8,
                  }}>
                    <div style={{ color: '#6B7280', marginBottom: 2 }}>TO CATCH UP BY DEC 31</div>
                    <span style={{ color: '#FFB830', fontSize: 15, fontWeight: 600 }}>
                      {Math.ceil(catchUp.dailyToRecover).toLocaleString()} {habit.unit}
                    </span>
                    <span style={{ color: '#6B7280' }}> /day avg</span>
                  </div>
                  <div style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'rgba(255, 68, 68, 0.06)',
                    border: '1px solid rgba(255, 68, 68, 0.15)',
                    borderRadius: 8,
                  }}>
                    <div style={{ color: '#6B7280', marginBottom: 2 }}>IF YOU SKIP TOMORROW</div>
                    <span style={{ color: '#FF4444', fontSize: 15, fontWeight: 600 }}>
                      {Math.ceil(catchUp.dailyIfSkipTomorrow).toLocaleString()} {habit.unit}
                    </span>
                    <span style={{ color: '#6B7280' }}> /day avg</span>
                  </div>
                </div>
              )}

              {/* Branching timeline chart */}
              <div style={{ padding: '0 8px 8px' }}>
                <BranchingTimeline data={branchData} habit={habit} height={200} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {habits.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
          <p style={{ fontSize: 16, marginBottom: 16 }}>No habits yet.</p>
          <Link to="/add" className="btn btn-primary">Add Your First Habit</Link>
        </div>
      )}

      <AnimatePresence>
        {logModalHabit && (
          <LogModal
            habit={habits.find(h => h.id === logModalHabit)!}
            onClose={() => setLogModalHabit(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
