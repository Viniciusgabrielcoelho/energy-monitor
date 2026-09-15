import { ipcMain } from 'electron'
import { EnergySimulator } from './simulator.js'
import { HwinfoReader } from './hwinfo.js'

let energyKwh = 0
let lastTs = null
let intervalMs = 1000
let source = 'sim'
let active = null
let getWindow = null

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

  ipcMain.handle('energy:set-source', (_evt, s) => {
    source = s === 'hwinfo' ? 'hwinfo' : 'sim'
    stopSource()
    startSource()
    return source
  })
}