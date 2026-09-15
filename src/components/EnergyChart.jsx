import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

function timeLabel(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('pt-BR', { hour12: false })
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="tt-label">{label}</div>
      {payload.map((p) => (
        <div className="tt-row" key={p.dataKey}>
          <span className="tt-dot" style={{ background: p.color }} />
          <span>
            {p.name}:{' '}
            {p.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} W
          </span>
        </div>
      ))}
    </div>
  )
}

export default function EnergyChart({ history }) {
  const data = history.map((h) => ({ ...h, time: timeLabel(h.ts) }))

  return (
    <div className="chart-card">
      <h2>Potência ativa (W)</h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="powerFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2b48" />
          <XAxis
            dataKey="time"
            stroke="#51688a"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#22304a' }}
            minTickGap={40}
          />
          <YAxis
            stroke="#51688a"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={46}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#51688a', strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="power"
            name="Potência"
            stroke="#38bdf8"
            strokeWidth={2.2}
            fill="url(#powerFill)"
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}