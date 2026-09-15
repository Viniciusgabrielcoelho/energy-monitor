import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

function timeLabel(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('pt-BR', { hour12: false })
}

export default function EnergyChart({ history }) {
  const data = history.map((h) => ({ ...h, time: timeLabel(h.ts) }))

  return (
    <div className="chart-card">
      <h2>Potência ativa (W)</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="time"
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            minTickGap={40}
          />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} width={45} />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="power"
            name="Potência (W)"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="current"
            name="Corrente (A)"
            stroke="#a78bfa"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            hide
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}