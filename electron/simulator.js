import { EventEmitter } from 'node:events'

const HISTORY_LIMIT = 300 // 5 minutos a 1 amostra/segundo

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

export class EnergySimulator extends EventEmitter {
  constructor({ intervalMs = 1000 } = {}) {
    super()
    this.intervalMs = intervalMs
    this.voltage = 220
    this.current = 2.1
    this.powerFactor = 0.95
    this.power = this.calcPower()
    this.history = []
    this.timer = null
  }

  calcPower() {
    return this.voltage * this.current * this.powerFactor
  }

  start() {
    if (this.timer) return
    this.pushSample()
    this.timer = setInterval(() => this.pushSample(), this.intervalMs)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  restart() {
    this.stop()
    this.start()
  }

  pushSample() {
    // Tensão estabiliza em ~220V com pequenas variações
    this.voltage = 220 + randomBetween(-3, 3)
    // Corrente segue um perfil residencial com rampas e picos
    const target = randomBetween(this.current - 1.2, this.current + 1.2)
    this.current = Math.max(
      0.3,
      Math.min(25, this.current + (target - this.current) * randomBetween(0.05, 0.6)),
    )
    this.powerFactor = randomBetween(0.88, 0.99)
    this.power = this.calcPower()

    const sample = {
      ts: Date.now(),
      voltage: +this.voltage.toFixed(1),
      current: +this.current.toFixed(2),
      powerFactor: +this.powerFactor.toFixed(2),
      power: +this.power.toFixed(1),
    }

    this.history.push(sample)
    if (this.history.length > HISTORY_LIMIT) {
      this.history.shift()
    }

    this.emit('sample', sample)
  }

  getSnapshot() {
    return {
      ...this.history[this.history.length - 1],
      history: this.history.slice(),
    }
  }
}