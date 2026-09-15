import React, { useEffect, useRef, useState, useCallback } from 'react'
import EnergyChart from './components/EnergyChart.jsx'
import StatCard from './components/StatCard.jsx'

const SPEEDS = [
  { label: '1x', ms: 1000 },
  { label: '2x', ms: 500 },
  { label: '5x', ms: 200 },
  { label: '10x', ms: 100 },
]

const TYPE_NAMES = {
  1: 'Temp',
  2: 'Voltagem',
  3: 'FAN',
  4: 'Corrente',
  5: 'Potência',
  6: 'Clock',
  7: 'Uso',
  8: 'Outro',
}

const CardIcon = {
  power: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" />
    </svg>
  ),
  energy: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" />
    </svg>
  ),
  voltage: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 2 6 14h5l-1 8 8-12h-5l1-8z" strokeLinejoin="round" />
    </svg>
  ),
  current: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2v3m0 14v3M5 12H2m20 0h-3M6.34 6.34 4.22 4.22m13.44 13.44 2.12 2.12M17.66 6.34l2.12-2.12M6.34 17.66l-2.12 2.12" strokeLinecap="round" />
    </svg>
  ),
  pf: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
      <path d="M18 12a6 6 0 1 1-6-6" strokeLinecap="round" />
    </svg>
  ),
  cpu: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" strokeLinecap="round" />
    </svg>
  ),
  gpu: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M6 11v2m4-2v2m6-2h2m1 0h1" strokeLinecap="round" />
    </svg>
  ),
}

export default function App() {
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [speed, setSpeed] = useState(1000)
  const [source, setSource] = useState('sim')
  const [filter, setFilter] = useState('')
  const [now, setNow] = useState(() => new Date())
  const lastSampleRef = useRef(null)

  const applySample = useCallback((sample) => {
    lastSampleRef.current = sample
    setCurrent(sample)
    setHistory((prev) => {
      const { sensors, ...compact } = sample
      const next = [...prev, compact]
      return next.length > 300 ? next.slice(next.length - 300) : next
    })
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const api = window.energyAPI
    if (!api) {
      console.warn('API do Electron não encontrada (rodando no navegador).')
      return
    }
    api.getSnapshot().then((snap) => {
      if (snap) {
        setHistory(snap.history)
        setCurrent(snap)
        setSource(snap.source ?? 'sim')
      }
    })
    const unsubscribe = api.onSample((sample) => {
      if (
        lastSampleRef.current &&
        Math.abs(sample.ts - lastSampleRef.current.ts) < 50
      ) {
        return
      }
      applySample(sample)
    })
    return unsubscribe
  }, [applySample])

  const handleSpeed = (ms) => {
    if (!window.energyAPI) return
    window.energyAPI.setSpeed(ms).then(setSpeed)
  }

  const handleSource = (s) => {
    if (!window.energyAPI) return
    window.energyAPI.setSource(s).then(setSource)
  }

  const hasAPI = Boolean(window.energyAPI)
  const isHwinfo = source === 'hwinfo'

  const filteredSensors = useCallback(() => {
    const sensors = current?.sensors ?? []
    const q = filter.trim().toLowerCase()
    if (!q) return sensors
    return sensors.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.sensor.toLowerCase().includes(q) ||
        s.unit.toLowerCase().includes(q),
    )
  }, [current?.sensors, filter])

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-badge">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1>Energy Monitor</h1>
            <span className="subtitle">Monitoramento de consumo em tempo real</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="source-control" title="Fonte dos dados">
            <button
              className={`source-btn ${!isHwinfo ? 'active' : ''}`}
              onClick={() => handleSource('sim')}
            >
              Simulado
            </button>
            <button
              className={`source-btn ${isHwinfo ? 'active' : ''}`}
              onClick={() => handleSource('hwinfo')}
            >
              HWiNFO64
            </button>
          </div>
          <span className="clock-now">
            {now.toLocaleTimeString('pt-BR', { hour12: false })}
          </span>
          <span className="live-badge">
            <span className="live-dot" /> AO VIVO
          </span>
          <div className="speed-control">
            <span className="speed-label">Velocidade</span>
            {SPEEDS.map((s) => (
              <button
                key={s.ms}
                className={`speed-btn ${speed === s.ms ? 'active' : ''}`}
                onClick={() => handleSpeed(s.ms)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {!hasAPI && (
        <div className="warning">
          Rodando fora do Electron — a API não está disponível. Execute com{' '}
          <code>npm run dev:electron</code>.
        </div>
      )}

      {isHwinfo && hasAPI && current && !current.hwinfoOk && (
        <div className="warning">
          HWiNFO64 não detectado. Abra o <b>HWiNFO64 em modo "Sensors-only"</b> e
          ative <b>Settings → Main → Shared Memory Support</b>, depois selecione
          novamente a fonte HWiNFO64.
        </div>
      )}

      <main>
        <section className="stats-grid">
          <StatCard
            icon={CardIcon.power}
            label="Potência atual"
            value={current?.power}
            unit="W"
            decimals={1}
            accent="#38bdf8"
            hint={isHwinfo ? 'CPU + GPU via HWiNFO' : undefined}
          />
          <StatCard
            icon={CardIcon.energy}
            label="Consumo acumulado"
            value={current?.energyKwh}
            unit="kWh"
            decimals={3}
            accent="#4ade80"
          />
          <StatCard
            icon={CardIcon.voltage}
            label="Tensão"
            value={current?.voltage}
            unit="V"
            decimals={1}
            accent="#fbbf24"
            hint={isHwinfo ? 'CPU Core Voltage' : undefined}
          />
          <StatCard
            icon={CardIcon.current}
            label="Corrente"
            value={current?.current}
            unit="A"
            decimals={2}
            accent="#a78bfa"
          />
          <StatCard
            icon={CardIcon.pf}
            label="Fator de potência"
            value={current?.powerFactor}
            decimals={2}
            accent="#f472b6"
          />
          {isHwinfo && (
            <>
              <StatCard
                icon={CardIcon.cpu}
                label="CPU"
                value={current?.cpuW}
                unit="W"
                decimals={1}
                accent="#60a5fa"
                hint={
                  current?.cpuTemp != null
                    ? `${current.cpuTemp.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} °C`
                    : undefined
                }
              />
              <StatCard
                icon={CardIcon.gpu}
                label="GPU"
                value={current?.gpuW}
                unit="W"
                decimals={1}
                accent="#34d399"
                hint={
                  current?.gpuTemp != null
                    ? `${current.gpuTemp.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} °C`
                    : undefined
                }
              />
            </>
          )}
        </section>

        <EnergyChart history={history} />

        {isHwinfo && (
          <section className="sensor-card">
            <div className="sensor-head">
              <h2>
                Sensores HWiNFO{' '}
                <span className="sensor-count">
                  {filteredSensors().length}
                  {isHwinfo && current?.ver ? ` · SM ver ${current.ver}` : ''}
                </span>
              </h2>
              <input
                className="sensor-search"
                type="search"
                placeholder="Filtrar sensores..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="sensor-table">
              {filteredSensors().length === 0 ? (
                <div className="sensor-empty">
                  {current && !current.hwinfoOk
                    ? 'Aguardando HWiNFO64 (verifique o Shared Memory Support).'
                    : 'Nenhum sensor corresponde ao filtro.'}
                </div>
              ) : (
                filteredSensors().map((s, i) => (
                  <div className="sensor-row" key={i}>
                    <span className={`sensor-type type-${s.t}`}>
                      {TYPE_NAMES[s.t] ?? '?'}
                    </span>
                    <span className="sensor-name">
                      {s.sensor ? `${s.sensor} — ` : ''}
                      {s.label}
                    </span>
                    <span className="sensor-unit">{s.unit}</span>
                    <span className="sensor-value">
                      {s.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        {isHwinfo && current ? (
          <>
            Dados reais via HWiNFO64 (CPU + GPU) · energia acumulada{' '}
            {current.energyKwh.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} kWh
          </>
        ) : (
          <>
            Energia ~{current?.voltage?.toFixed(0) ?? '--'}V ·
            {current
              ? ` estimativa ${(current.power * 0.001).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kW`
              : ' aguardando dados...'}
          </>
        )}
      </footer>
    </div>
  )
}