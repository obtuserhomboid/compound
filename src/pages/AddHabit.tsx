import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHabitStore } from '../store/habitStore';
import { HABIT_TEMPLATES, CATEGORY_LABELS } from '../lib/types';
import type { HabitTemplate, HabitCategory } from '../lib/types';

export default function AddHabit() {
  const navigate = useNavigate();
  const { addHabitFromTemplate, addHabit } = useHabitStore();
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [selected, setSelected] = useState<HabitTemplate | null>(null);
  const [goal, setGoal] = useState('');

  // Custom habit fields
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<HabitCategory>('body');
  const [customUnit, setCustomUnit] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [customMetric, setCustomMetric] = useState('');

  const handleAddTemplate = () => {
    if (!selected) return;
    addHabitFromTemplate(selected, parseFloat(goal) || selected.defaultGoal);
    navigate('/');
  };

  const handleAddCustom = () => {
    if (!customName || !customUnit || !customGoal) return;
    addHabit({
      name: customName,
      category: customCategory,
      unit: customUnit,
      dailyGoal: parseFloat(customGoal) || 1,
      compoundingMetric: customMetric || `${customUnit}/year`,
    });
    navigate('/');
  };

  const categories = ['mind', 'body', 'money'] as HabitCategory[];

  return (
    <div>
      <div className="page-header">
        <h2>Add Habit</h2>
        <p>Choose from the library or create your own.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <button
          className={`btn ${mode === 'template' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('template')}
        >
          From Library
        </button>
        <button
          className={`btn ${mode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('custom')}
        >
          Custom
        </button>
      </div>

      {mode === 'template' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {categories.map(cat => {
            const templates = HABIT_TEMPLATES.filter(t => t.category === cat);
            return (
              <div key={cat} className="category-section">
                <h3>{CATEGORY_LABELS[cat]}</h3>
                <div className="template-grid">
                  {templates.map(template => (
                    <div
                      key={template.name}
                      className={`template-card ${selected?.name === template.name ? 'selected' : ''}`}
                      onClick={() => {
                        setSelected(template);
                        setGoal(template.defaultGoal.toString());
                      }}
                    >
                      <div className="template-icon">{template.icon}</div>
                      <div className="template-name">{template.name}</div>
                      <div className="template-meta">
                        {template.defaultGoal} {template.unit}/day
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: 400, marginTop: 24 }}
            >
              <div className="input-group">
                <label>Daily Goal ({selected.unit})</label>
                <input
                  type="number"
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  min="1"
                  step="any"
                />
              </div>
              <button className="btn btn-primary" onClick={handleAddTemplate}>
                Add {selected.name}
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {mode === 'custom' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 400 }}>
          <div className="input-group">
            <label>Habit Name</label>
            <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g., Cold Showers" />
          </div>
          <div className="input-group">
            <label>Category</label>
            <select value={customCategory} onChange={e => setCustomCategory(e.target.value as HabitCategory)}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Unit</label>
            <input value={customUnit} onChange={e => setCustomUnit(e.target.value)} placeholder="e.g., minutes, pages, reps" />
          </div>
          <div className="input-group">
            <label>Daily Goal</label>
            <input type="number" value={customGoal} onChange={e => setCustomGoal(e.target.value)} min="1" step="any" />
          </div>
          <div className="input-group">
            <label>Compounding Metric (optional)</label>
            <input value={customMetric} onChange={e => setCustomMetric(e.target.value)} placeholder="e.g., hours/year" />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAddCustom}
            disabled={!customName || !customUnit || !customGoal}
            style={{ opacity: (!customName || !customUnit || !customGoal) ? 0.4 : 1 }}
          >
            Create Habit
          </button>
        </motion.div>
      )}
    </div>
  );
}
