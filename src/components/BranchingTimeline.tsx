import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { BranchPoint, Habit } from '../lib/types';
import { toCompoundingMetric } from '../lib/compound';

interface Props {
  data: BranchPoint[];
  habit: Habit;
  height?: number;
}

function CustomTooltip({ active, payload, habit }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as BranchPoint;
  if (!point) return null;

  return (
    <div style={{
      background: '#1A2035',
      border: '1px solid #374151',
      borderRadius: 8,
      padding: '12px 16px',
      fontSize: 13,
    }}>
      <div style={{ color: '#9CA3AF', fontFamily: 'DM Mono, monospace', fontSize: 11, marginBottom: 8 }}>
        {format(parseISO(point.date), 'MMM d, yyyy')}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ color: '#00FF88', fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>
            {toCompoundingMetric(habit, point.optimal)}
          </div>
          <div style={{ color: '#6B7280', fontSize: 11 }}>optimal</div>
        </div>
        <div>
          <div style={{ color: '#FFB830', fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>
            {toCompoundingMetric(habit, point.actual)}
          </div>
          <div style={{ color: '#6B7280', fontSize: 11 }}>actual</div>
        </div>
      </div>
      {point.gap > 0 && (
        <div style={{ marginTop: 8, color: '#FF4444', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
          gap: {toCompoundingMetric(habit, point.gap)}
        </div>
      )}
      {point.skipped && (
        <div style={{ marginTop: 4, color: '#FF4444', fontSize: 11 }}>
          skipped
        </div>
      )}
    </div>
  );
}

function TodayLabel(props: any) {
  const { viewBox } = props;
  if (!viewBox) return null;
  return (
    <g>
      <text
        x={viewBox.x}
        y={12}
        textAnchor="middle"
        fill="#F9FAFB"
        fontSize={10}
        fontFamily="DM Mono, monospace"
        fontWeight={500}
      >
        TODAY
      </text>
    </g>
  );
}

export default function BranchingTimeline({ data, habit, height = 300 }: Props) {
  const skipPoints = useMemo(() => data.filter(d => d.skipped), [data]);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const formatTick = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const maxTickCount = 8;
  const tickInterval = Math.max(1, Math.floor(data.length / maxTickCount));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="optimalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00FF88" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FFB830" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#FFB830" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
          interval={tickInterval}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={50}
          tickFormatter={(v) => {
            if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
            return v.toFixed(0);
          }}
        />
        <Tooltip content={<CustomTooltip habit={habit} />} />
        <Area
          type="monotone"
          dataKey="optimal"
          stroke="#00FF88"
          strokeWidth={2}
          fill="url(#optimalGradient)"
          dot={false}
          animationDuration={800}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#FFB830"
          strokeWidth={2}
          fill="url(#actualGradient)"
          dot={false}
          animationDuration={800}
        />
        {skipPoints.map((point) => (
          <ReferenceDot
            key={point.date}
            x={point.date}
            y={point.actual}
            r={4}
            fill="#FF4444"
            stroke="none"
          />
        ))}
        <ReferenceLine
          x={todayStr}
          stroke="#F9FAFB"
          strokeWidth={1}
          strokeDasharray="4 4"
          strokeOpacity={0.5}
          label={<TodayLabel />}
        />
        {/* Dot on the actual line at today */}
        {data.find(d => d.date === todayStr) && (
          <ReferenceDot
            x={todayStr}
            y={data.find(d => d.date === todayStr)!.actual}
            r={5}
            fill="#FFB830"
            stroke="#0A0F1E"
            strokeWidth={2}
          />
        )}
        {/* Dot on the optimal line at today */}
        {data.find(d => d.date === todayStr) && (
          <ReferenceDot
            x={todayStr}
            y={data.find(d => d.date === todayStr)!.optimal}
            r={5}
            fill="#00FF88"
            stroke="#0A0F1E"
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
