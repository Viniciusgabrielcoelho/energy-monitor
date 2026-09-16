import { app, ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { EnergySimulator } from './simulator.js'
import { HwinfoReader } from './hwinfo.js'

const stateFile = () => path.join(app.getPath('userData'), 'energy-state.json')
const SAVE_INTERVAL_MS = 10000

let energyKwh = 0
let lastTs = null
let intervalMs = 1000
let source = 'hwinfo'
let active = null
let getWindow = null
let saveTimer = null

function loadSavedKwh() {
  try {
    const data = JSON.parse(fs.readFileSync(stateFile(), 'utf8'))
    return Number.isFinite(data.energyKwh) ? data.energyKwh : 0
  } catch {
    return 0
  }
}

function saveStateSync() {
  try {
    fs.mkdirSync(path.dirname(stateFile()), { recursive: true })
    fs.writeFileSync(stateFile(), JSON.stringify({ energyKwh, updatedAt: Date.now() }), 'utf8')
  } catch {}
}

function scheduleSave() {
  saveTimer = setInterval(saveStateSync, SAVE_INTERVAL_MS)
}

energyKwh = loadSavedKwh()

function pushEnergy(sample) {
  const now = sample.ts
  if (lastTs && now > lastTs) {
    energyKwh += (sample.power / 1000) * ((now - lastTs) / 3600000)
  }
  lastTs = now
  const out = { ...sample, energyKwh: +energyKwh.toFixed(4) }
  getWindow()?.webContents.send('energy:sample', out)
}

function makeSimulator() {
  const sim = new EnergySimulator({ intervalMs })
  const onSample = (sample) => pushEnergy(sample)
  sim.on('sample', onSample)
  sim.start()
  return {
    stop() {
      sim.stop()
      sim.removeListener('sample', onSample)
    },
    getSnapshot: () => sim.getSnapshot(),
  }
}

function makeHwinfo() {
  const reader = new HwinfoReader()
  const onSample = (sample) => pushEnergy(sample)
  reader.on('sample', onSample)
  reader.start()
  return {
    stop() {
      reader.stop()
      reader.removeListener('sample', onSample)
    },
    getSnapshot: () => reader.getSnapshot(),
  }
}

function startSource() {
  active = source === 'hwinfo' ? makeHwinfo() : makeSimulator()
}

function stopSource() {
  active?.stop()
  active = null
}

export function setupEnergyIpc(windowGetter) {
  getWindow = windowGetter
  startSource()
  scheduleSave()

  app.on('before-quit', () => {
    clearInterval(saveTimer)
    saveStateSync()
  })

  ipcMain.handle('energy:get-snapshot', () => {
    const snap = active.getSnapshot()
    return { ...snap, energyKwh, source, intervalMs }
  })

  ipcMain.handle('energy:set-speed', (_evt, ms) => {
    intervalMs = Math.max(100, Math.min(10000, Number(ms) || 1000))
    stopSource()
    startSource()
    return intervalMs
  })

  ipcMain.handle('energy:set-source', (_evt, _s) => {
    source = 'hwinfo'
    stopSource()
    startSource()
    return source
  })
}