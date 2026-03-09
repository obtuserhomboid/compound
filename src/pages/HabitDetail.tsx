import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { useHabitStore } from '../store/habitStore';
import { generateBranchData, calculateProjections, toCompoundingMetric } from '../lib/compound';
import { HABIT_TEMPLATES } from '../lib/types';
import BranchingTimeline from '../components/BranchingTimeline';
import ProjectionTable from '../components/ProjectionTable';
import ShareCard from '../components/ShareCard';
import LogModal from '../components/LogModal';

type TimeRange = '30d' | '90d' | '1y' | '5y';

const RANGE_DAYS: Record<TimeRange, number> = {
  '30d': 30,
  '90d': 90,
  '1y': 365,
  '5y': 365 * 5,
};

export default function HabitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits, logs, removeHabit, updateHabit, getTodayLog } = useHabitStore();
  const [range, setRange] = useState<TimeRange>('30d');
  const [showShare, setShowShare] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [editing, setEditing] = useState(false);

  const habit = habits.find(h => h.id === id);
  if (!habit) return <div style={{ padding: 40, color: '#6B7280' }}>Habit not found.</div>;

  const [editName, setEditName] = useState(habit.name);
  const [editGoal, setEditGoal] = useState(habit.dailyGoal.toString());
  const [editUnit, setEditUnit] = useState(habit.unit);

  const habitLogs = logs.filter(l => l.habitId === habit.id);
  const template = HABIT_TEMPLATES.find(t => t.name === habit.name);
  const icon = template?.icon || '📌';
  const todayLog = getTodayLog(habit.id);

  const branchData = useMemo(() => {
    const endDate = format(addDays(new Date(), RANGE_DAYS[range]), 'yyyy-MM-dd');
    return generateBranchData(habit, habitLogs, habit.createdAt, endDate);
  }, [habit, habitLogs, range]);

  const projections = useMemo(() => calculateProjections(habit, habitLogs), [habit, habitLogs]);

  const completedDays = habitLogs.filter(l => l.completed).length;
  const totalDays = habitLogs.length || 1;
  const consistency = Math.round((completedDays / totalDays) * 100);
  const currentStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...habitLogs].sort((a, b) => b.date.localeCompare(a.date));
    for (const log of sorted) {
      if (log.completed) streak++;
      else break;
    }
    return streak;
  }, [habitLogs]);

  const handleSaveEdit = () => {
    const goal = parseFloat(editGoal);
    if (!editName.trim() || !goal || goal <= 0) return;
    updateHabit(habit.id, {
      name: editName.trim(),
      dailyGoal: goal,
      unit: editUnit.trim() || habit.unit,
    });
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(habit.name);
    setEditGoal(habit.dailyGoal.toString());
    setEditUnit(habit.unit);
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${habit.name}"? This cannot be undone.`)) {
      removeHabit(habit.id);
      navigate('/');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{icon}</span>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>{habit.name}</h2>
          </div>
          <p className="mono" style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
            {habit.dailyGoal} {habit.unit}/day · {habit.compoundingMetric}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!todayLog && (
            <button className="btn btn-primary" onClick={() => setShowLog(true)}>Log Today</button>
          )}
          <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowShare(!showShare)}>
            {showShare ? 'Hide Card' : 'Share'}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="card"
            style={{ marginBottom: 24 }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Edit Habit</h3>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
              Changing your daily goal redraws the optimal line. Past logs stay the same.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Daily Goal</label>
                <input
                  type="number"
                  value={editGoal}
                  onChange={e => setEditGoal(e.target.value)}
                  min="1"
                  step="any"
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Unit</label>
                <input value={editUnit} onChange={e => setEditUnit(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>
                Save — Redraw Line
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-label">Consistency</div>
          <div className="stat-value optimal">{consistency}%</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Current Streak</div>
          <div className="stat-value" style={{ color: '#F9FAFB' }}>{currentStreak} days</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Year Gap</div>
          <div className="stat-value skip">{toCompoundingMetric(habit, projections.year1.gap)}</div>
        </div>
      </div>

      {/* Branching Timeline */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Branching Timeline</h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['30d', '90d', '1y', '5y'] as TimeRange[]).map(r => (
              <button
                key={r}
                className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, background: '#00FF88', borderRadius: 2 }} />
            <span style={{ color: '#9CA3AF' }}>Optimal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, background: '#FFB830', borderRadius: 2 }} />
            <span style={{ color: '#9CA3AF' }}>Your Path</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, background: '#FF4444', borderRadius: '50%' }} />
            <span style={{ color: '#9CA3AF' }}>Skip</span>
          </div>
        </div>
        <BranchingTimeline data={branchData} habit={habit} height={350} />
      </div>

      {/* Projections */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Compound Projections</h3>
        <ProjectionTable habit={habit} projections={projections} />
      </div>

      {/* Share Card */}
      {showShare && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Snapshot Card</h3>
          <ShareCard habit={habit} logs={habitLogs} />
        </div>
      )}

      {/* Danger zone */}
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>
          Delete Habit
        </button>
      </div>

      <AnimatePresence>
        {showLog && (
          <LogModal habit={habit} onClose={() => setShowLog(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
