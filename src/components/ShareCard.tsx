import { useRef, useCallback } from 'react';
import type { Habit, HabitLog } from '../lib/types';
import { calculateProjections, toCompoundingMetric } from '../lib/compound';

interface Props {
  habit: Habit;
  logs: HabitLog[];
}

export default function ShareCard({ habit, logs }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const projections = calculateProjections(habit, logs);
  const completedDays = logs.filter(l => l.completed).length;
  const totalDays = logs.length || 1;
  const consistency = Math.round((completedDays / totalDays) * 100);

  const handleCopy = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#0A0F1E',
        pixelRatio: 2,
      });
      // Create download link
      const link = document.createElement('a');
      link.download = `compound-${habit.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Fallback: copy text
      const text = `${habit.name}: ${consistency}% consistent. On track for ${toCompoundingMetric(habit, projections.year1.actual)} this year (optimal: ${toCompoundingMetric(habit, projections.year1.optimal)}). #Compound`;
      navigator.clipboard.writeText(text);
    }
  }, [habit, logs, consistency, projections]);

  return (
    <div>
      <div ref={cardRef} className="share-card">
        <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#6B7280', marginBottom: 20, letterSpacing: 1 }}>
          COMPOUND
        </div>
        <div style={{ fontSize: 36, marginBottom: 8 }}>
          {consistency}%
        </div>
        <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 24 }}>
          consistency on <span style={{ color: '#F9FAFB', fontWeight: 600 }}>{habit.name}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
          <div>
            <div className="mono" style={{ color: '#00FF88', fontSize: 16, fontWeight: 500 }}>
              {toCompoundingMetric(habit, projections.year1.optimal)}
            </div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>optimal / yr</div>
          </div>
          <div>
            <div className="mono" style={{ color: '#FFB830', fontSize: 16, fontWeight: 500 }}>
              {toCompoundingMetric(habit, projections.year1.actual)}
            </div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>on track / yr</div>
          </div>
        </div>

        <div style={{
          padding: '8px 16px',
          background: 'rgba(255, 68, 68, 0.1)',
          borderRadius: 8,
          fontSize: 13,
          color: '#FF4444',
          fontFamily: 'DM Mono, monospace',
          display: 'inline-block',
        }}>
          gap: {toCompoundingMetric(habit, projections.year1.gap)}
        </div>

        <div className="share-brand">compound.app</div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={handleCopy}>
          Download Card
        </button>
      </div>
    </div>
  );
}
