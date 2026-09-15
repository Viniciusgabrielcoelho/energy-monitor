import React from 'react'

function formatValue(value, decimals = 2) {
  if (value === null || value === undefined) return '--'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export default function StatCard({ icon, label, value, unit, decimals = 2, accent, hint }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <div className="stat-value">
          {formatValue(value, decimals)} <span className="stat-unit">{unit}</span>
        </div>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
    </div>
  )
}