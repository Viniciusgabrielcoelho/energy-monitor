const http = require('node:http')
const fs = require('node:fs')

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => {
      let d = ''
      r.on('data', (c) => (d += c))
      r.on('end', () => res(JSON.parse(d)))
    }).on('error', rej)
  })
}

async function main() {
  const targets = await getJSON('http://127.0.0.1:9222/json')
  const page = targets.find((t) => t.type === 'page' && t.url.includes('index.html'))
  if (!page) throw new Error('no page target: ' + JSON.stringify(targets.map((t) => t.url)))

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString())
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id
      pending.set(mid, resolve)
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  await new Promise((r) => (ws.onopen = r))

  const evalJs = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true })
    return r.result
  }
  const shot = async (file) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    if (r.result && r.result.data) {
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'))
      console.log('salvo', file)
    } else {
      console.log('erro screenshot', JSON.stringify(r).slice(0, 200))
    }
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
  await new Promise((r) => setTimeout(r, 2500))

  await shot('docs/dashboard.png')

  await evalJs(
    `[...document.querySelectorAll('.source-btn')].find(b => b.textContent.includes('Custo da energia'))?.click(); true`,
  )
  await new Promise((r) => setTimeout(r, 1500))
  await shot('docs/cost.png')

  ws.close()
  process.exit(0)
}

main().catch((e) => {
  console.error('FALHA:', e.message)
  process.exit(1)
})