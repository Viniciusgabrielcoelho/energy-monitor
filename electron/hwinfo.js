import { EventEmitter } from 'node:events'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const HISTORY_LIMIT = 300
const TICK_MS = 1000

const PRIORITY_CPU = [/CPU.*Package Power/i, /CPU.*Total.*Power/i, /^CPU Power$/i, /^CPU \[OC\].*Power/i]
const PRIORITY_GPU = [/Total.*Power/i, /^GPU Power$/i, /GPU.*Package.*Power/i, /GPU.*Board.*Power/i, /GPU.*Chip.*Power/i]
const PRIORITY_SYSTEM = [/Total System Power/i, /System Power Total/i, /System Power/i]

function pollScriptPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'hwinfo-poll.ps1')
  }
  return path.join(__dirname, 'hwinfo-poll.ps1')
}

function runPs() {
  return new Promise((resolve) => {
    const script = pollScriptPath()
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script],
      { timeout: 6000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return resolve(null)
        try {
          const data = JSON.parse(stdout)
          resolve(Array.isArray(data.readings) ? data : null)
        } catch {
          resolve(null)
        }
      },
    )
  })
}

function isPower(r, unitIsW = true) {
  return r.t === 5 && r.unit.trim().toUpperCase() === 'W' && Number.isFinite(r.value)
}

function pickPower(readings, patterns, restrict) {
  let best = null
  let bestP = Infinity
  for (const r of readings) {
    if (!isPower(r) || !restrict(r)) continue
    const p = patterns.findIndex((re) => re.test(r.label))
    if (p >= 0 && p < bestP) {
      bestP = p
      best = r
    }
  }
  return best ? best.value : 0
}

function findVoltage(readings) {
  const pool = readings.filter(
    (r) =>
      (r.t === 2 || /^V$/i.test(r.unit.trim())) &&
      /CPU.*(Core|VCore|Vcore|VDD).*Voltage|Core Voltage|VCore/i.test(r.label) &&
      Number.isFinite(r.value),
  )
  return pool.length ? pool[0].value : 220
}

function findTemp(readings, restrict) {
  const pool = readings.filter(
    (r) => r.t === 1 && /°C|C/i.test(r.unit) && restrict(r) && Number.isFinite(r.value),
  )
  if (!pool.length) return null
  return pool.reduce((a, b) => (b.value > a.value ? b : a)).value
}

export class HwinfoReader extends EventEmitter {
  constructor() {
    super()
    this.history = []
    this.latest = null
    this.timer = null
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(() => this.tick(), TICK_MS)
    this.tick()
  }

  stop() {
    clearInterval(this.timer)
    this.timer = null
  }

  async tick() {
    const data = await runPs()
    let sample
    if (!data || !data.live) {
      sample = {
        ts: Date.now(),
        voltage: 220,
        current: 0,
        powerFactor: 0.95,
        power: 0,
        cpuW: 0,
        gpuW: 0,
        cpuTemp: null,
        gpuTemp: null,
        hwinfoOk: false,
      }
    } else {
      const readings = data.readings
      const cpuWatts = pickPower(readings, PRIORITY_CPU, (r) => /^CPU/.test(r.sensor))
      const gpuWatts = pickPower(readings, PRIORITY_GPU, (r) => /GPU/.test(r.sensor))
      const sysWatts = pickPower(readings, PRIORITY_SYSTEM, (r) => /System/.test(r.sensor) || /Total System/.test(r.label))
      const power = sysWatts > 0 ? sysWatts : cpuWatts + gpuWatts
      const voltage = findVoltage(readings)
      const cpuTemp = findTemp(readings, (r) => /^CPU/.test(r.sensor))
      const gpuTemp = findTemp(readings, (r) => /GPU/i.test(r.sensor))
      const sensors = readings.map((r) => ({
        t: r.t,
        sensor: r.sensor || '',
        label: r.label || '',
        unit: r.unit || '',
        value: r.value,
      }))
      sample = {
        ts: Date.now(),
        voltage: +voltage.toFixed(1),
        current:
          power > 0 ? +(power / (voltage * 0.95)).toFixed(2) : 0,
        powerFactor: 0.95,
        power: +power.toFixed(1),
        cpuW: +cpuWatts.toFixed(1),
        gpuW: +gpuWatts.toFixed(1),
        cpuTemp,
        gpuTemp,
        hwinfoOk: true,
        poll: data.poll,
        ver: data.ver,
        sensors,
      }
    }

    this.latest = sample
    const { sensors, ...compact } = sample
    this.history.push(compact)
    if (this.history.length > HISTORY_LIMIT) this.history.shift()
    this.emit('sample', sample)
  }

  getSnapshot() {
    return {
      ...(this.latest ?? { ts: Date.now(), hwinfoOk: false }),
      history: this.history.slice(),
    }
  }
}