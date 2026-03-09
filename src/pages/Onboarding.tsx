import { useState } from 'react';
import { motion } from 'framer-motion';
import { useHabitStore } from '../store/habitStore';
import { HABIT_TEMPLATES, CATEGORY_LABELS } from '../lib/types';
import type { HabitTemplate, HabitCategory } from '../lib/types';

export default function Onboarding() {
  const [selected, setSelected] = useState<HabitTemplate[]>([]);
  const [step, setStep] = useState<'pick' | 'goals'>('pick');
  const [goals, setGoals] = useState<Record<string, number>>({});
  const { addHabitFromTemplate, setOnboarded } = useHabitStore();

  const toggleTemplate = (template: HabitTemplate) => {
    setSelected(prev =>
      prev.find(t => t.name === template.name)
        ? prev.filter(t => t.name !== template.name)
        : prev.length < 3 ? [...prev, template] : prev
    );
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    const initialGoals: Record<string, number> = {};
    selected.forEach(t => { initialGoals[t.name] = t.defaultGoal; });
    setGoals(initialGoals);
    setStep('goals');
  };

  const handleFinish = () => {
    selected.forEach(template => {
      addHabitFromTemplate(template, goals[template.name]);
    });
    setOnboarded(true);
  };

  const categories = ['mind', 'body', 'money'] as HabitCategory[];

  return (
    <div className="onboarding">
      <motion.div
        className="onboarding-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {step === 'pick' && (
          <>
            <h1>Compound</h1>
            <p className="subtitle">See what you're really skipping.</p>
            <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 32 }}>
              Pick up to 3 habits to start tracking. You can always add more later.
            </p>

            {categories.map(cat => {
              const templates = HABIT_TEMPLATES.filter(t => t.category === cat);
              return (
                <div key={cat} className="category-section">
                  <h3>{CATEGORY_LABELS[cat]}</h3>
                  <div className="template-grid">
                    {templates.map(template => (
                      <div
                        key={template.name}
                        className={`template-card ${selected.find(s => s.name === template.name) ? 'selected' : ''}`}
                        onClick={() => toggleTemplate(template)}
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

            <button
              className="btn btn-primary btn-lg"
              onClick={handleNext}
              disabled={selected.length === 0}
              style={{ opacity: selected.length === 0 ? 0.4 : 1, width: '100%', maxWidth: 300 }}
            >
              Set Goals ({selected.length}/3)
            </button>
          </>
        )}

        {step === 'goals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 8 }}>Set Your Daily Goals</h2>
            <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 32 }}>
              These are your daily targets. The app will project what consistency looks like over time.
            </p>

            {selected.map(template => (
              <div key={template.name} className="input-group" style={{ maxWidth: 400, margin: '0 auto 20px', textAlign: 'left' }}>
                <label>{template.icon} {template.name}</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    value={goals[template.name] || ''}
                    onChange={e => setGoals(prev => ({ ...prev, [template.name]: parseFloat(e.target.value) || 0 }))}
                    min="1"
                    step="any"
                  />
                  <span style={{ color: '#6B7280', fontSize: 13, fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>
                    {template.unit}/day
                  </span>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
              <button className="btn btn-secondary" onClick={() => setStep('pick')}>Back</button>
              <button className="btn btn-primary btn-lg" onClick={handleFinish}>
                Start Compounding
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
