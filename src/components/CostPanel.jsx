import { TARIFFS, CAPITALS, normalizeCity } from '../tariffs.js'
import StatCard from './StatCard.jsx'

const MoneyIcon = (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M12 8.5v7m0-7a1.5 1.5 0 0 1 0-2.5m0 12a1.5 1.5 0 0 1 0-2.5" strokeLinecap="round" />
    <path d="M6 10h.01M18 14h.01" strokeLinecap="round" strokeWidth="2.2" />
  </svg>
)

const TagIcon = (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 7V5a2 2 0 0 1 2-2h2m14 6v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m8.5-9.5L3.6 13.4a2 2 0 0 0 0 2.8l4.2 4.2a2 2 0 0 0 2.8 0l9.9-9.9a2 2 0 0 0 .5-.8V7a2 2 0 0 0-2-2h-3.4a2 2 0 0 0-1.1-.5z" strokeLinejoin="round" />
  </svg>
)

const BoltIcon = (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" />
  </svg>
)

function formatBRL(value, decimals = 2) {
  if (value === null || value === undefined) return '--'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export default function CostPanel({ uf, city, onUf, onCity, kWh }) {
  const info = TARIFFS[uf]
  const tariff = info.tariff
  const cost = (kWh ?? 0) * tariff

  const handleCityInput = (value) => {
    onCity(value)
    const key = normalizeCity(value)
    if (key && CAPITALS[key]) onUf(CAPITALS[key])
  }

  const sorted = Object.entries(TARIFFS).sort((a, b) => a[1].tariff - b[1].tariff)

  return (
    <section className="cost-panel">
      <div className="cost-locator">
        <div className="cost-field">
          <label htmlFor="cost-city">Cidade</label>
          <input
            id="cost-city"
            type="text"
            list="city-suggestions"
            placeholder="Digite sua cidade (capitais reconhecidas)"
            value={city}
            onChange={(e) => handleCityInput(e.target.value)}
          />
          <datalist id="city-suggestions">
            {Object.entries(CAPITALS).map(([c]) => (
              <option key={c} value={c.replace(/\b\w/g, (l) => l.toUpperCase())} />
            ))}
          </datalist>
        </div>
        <div className="cost-field">
          <label htmlFor="cost-uf">Estado</label>
          <select id="cost-uf" value={uf} onChange={(e) => onUf(e.target.value)}>
            {Object.entries(TARIFFS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name} ({k}) — R$ {v.tariff.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={TagIcon}
          label="Tarifa"
          value={tariff}
          unit="R$/kWh"
          decimals={3}
          accent="#fbbf24"
          hint={info.distributor}
        />
        <StatCard
          icon={BoltIcon}
          label="Consumo acumulado"
          value={kWh}
          unit="kWh"
          decimals={3}
          accent="#38bdf8"
        />
        <StatCard
          icon={MoneyIcon}
          label="Custo estimado"
          value={cost}
          unit="R$"
          decimals={2}
          accent="#4ade80"
        />
      </div>

      <p className="cost-note">
        Valor residencial B1 homologado pela ANEEL (TUSD + TE, base 09/2026). Não inclui
        impostos (ICMS, PIS/COFINS) nem a bandeira tarifária do mês — a conta real costuma
        ser 20–30% maior.
      </p>

      <div className="tariff-table-card">
        <h2>
          Tarifas por estado <span className="sensor-count">referência ANEEL 2026</span>
        </h2>
        <div className="tariff-table">
          {sorted.map(([key, t]) => (
            <div key={key} className={`tariff-row ${key === uf ? 'sel' : ''}`}>
              <span className="tariff-uf">{key}</span>
              <span className="tariff-dist">{t.distributor}</span>
              <span className="tariff-val">
                R$ {t.tariff.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}