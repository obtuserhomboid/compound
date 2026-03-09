import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Habit } from '../lib/types';
import { useHabitStore } from '../store/habitStore';
import { getSkipCost, toCompoundingMetric, calculateCompoundValue } from '../lib/compound';

interface Props {
  habit: Habit;
  onClose: () => void;
}

export default function LogModal({ habit, onClose }: Props) {
  const [value, setValue] = useState(habit.dailyGoal.toString());
  const [logged, setLogged] = useState<'done' | 'skipped' | null>(null);
  const logHabit = useHabitStore(s => s.logHabit);

  const handleDone = () => {
    const numValue = parseFloat(value) || 0;
    logHabit(habit.id, numValue, true);
    setLogged('done');
  };

  const handleSkip = () => {
    logHabit(habit.id, 0, false);
    setLogged('skipped');
  };

  const numValue = parseFloat(value) || 0;
  const impact30 = toCompoundingMetric(habit, calculateCompoundValue(habit, numValue, 30));
  const impact1y = toCompoundingMetric(habit, calculateCompoundValue(habit, numValue, 365));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {logged === null && (
            <motion.div key="input" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3>Log: {habit.name}</h3>
              <p>Goal: {habit.dailyGoal} {habit.unit} / day</p>

              <div className="input-group">
                <label>How much today?</label>
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  autoFocus
                  min="0"
                  step="any"
                />
              </div>

              {numValue > 0 && (
                <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(0,255,136,0.05)', borderRadius: 8, border: '1px solid rgba(0,255,136,0.2)' }}>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'DM Mono, monospace', marginBottom: 4 }}>
                    IMPACT OF TODAY'S {numValue} {habit.unit.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, color: '#00FF88', fontFamily: 'DM Mono, monospace' }}>
                    30 days: {impact30} &middot; 1 year: {impact1y}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleDone}>
                  I did it
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleSkip}>
                  I skipped
                </button>
              </div>
            </motion.div>
          )}

          {logged === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2705;</div>
              <h3 style={{ color: '#00FF88' }}>Logged!</h3>
              <p style={{ marginBottom: 8 }}>
                {numValue} {habit.unit} recorded. Keep compounding.
              </p>
              <div style={{ fontSize: 13, color: '#00FF88', fontFamily: 'DM Mono, monospace', marginBottom: 24 }}>
                30-day projection: {impact30}
              </div>
              <button className="btn btn-secondary" onClick={onClose}>Done</button>
            </motion.div>
          )}

          {logged === 'skipped' && (
            <motion.div
              key="skipped"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>&#x26A0;&#xFE0F;</div>
              <h3 style={{ color: '#FF4444' }}>The Real Cost</h3>
              <p style={{
                fontSize: 14,
                color: '#FFB830',
                lineHeight: 1.6,
                marginBottom: 24,
                fontFamily: 'DM Mono, monospace',
              }}>
                {getSkipCost(habit)}
              </p>
              <button className="btn btn-secondary" onClick={onClose}>Got it</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
