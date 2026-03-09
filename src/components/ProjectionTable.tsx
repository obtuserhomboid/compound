import type { Habit, CompoundProjection } from '../lib/types';
import { toCompoundingMetric } from '../lib/compound';

interface Props {
  habit: Habit;
  projections: CompoundProjection;
}

export default function ProjectionTable({ habit, projections }: Props) {
  const rows = [
    { label: '30 days', data: projections.days30 },
    { label: '90 days', data: projections.days90 },
    { label: '1 year', data: projections.year1 },
    { label: '5 years', data: projections.year5 },
  ];

  return (
    <table className="projection-table">
      <thead>
        <tr>
          <th>Horizon</th>
          <th>Optimal</th>
          <th>Your Pace</th>
          <th>Gap</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.label}>
            <td style={{ color: '#9CA3AF' }}>{row.label}</td>
            <td style={{ color: '#00FF88' }}>{toCompoundingMetric(habit, row.data.optimal)}</td>
            <td style={{ color: '#FFB830' }}>{toCompoundingMetric(habit, row.data.actual)}</td>
            <td style={{ color: '#FF4444' }}>{toCompoundingMetric(habit, row.data.gap)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
