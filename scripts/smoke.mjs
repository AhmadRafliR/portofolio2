// Smoke test of the production build (implementasi.md Fase 5), using the system Chrome/Edge via playwright-core.
// Run: npm run build && npm run smoke        (add --og to also write public/og.jpg)
import { spawn } from 'node:child_process'
import { chromium } from 'playwright-core'
import sharp from 'sharp'

const PORT = 4179
const BASE = `http://localhost:${PORT}`
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' })
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview server did not start')), 20000)
  server.stdout.on('data', (d) => String(d).includes(String(PORT)) && (clearTimeout(t), resolve()))
})

let browser
for (const channel of ['chrome', 'msedge']) {
  try {
    browser = await chromium.launch({ channel, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] })
    break
  } catch {
    // next browser
  }
}
if (!browser) throw new Error('No Chrome or Edge found')

async function session(viewport, isMobile) {
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, deviceScaleFactor: isMobile ? 2 : 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && !/camera|getUserMedia|Permission/i.test(m.text()) && errors.push(m.text()))
  return { ctx, page, errors }
}

try {
  // ---------- desktop ----------
  {
    const { ctx, page, errors } = await session({ width: 1440, height: 900 }, false)
    await page.goto(`${BASE}/?intro`)
    await page.waitForSelector('.intro-copy', { timeout: 15000 })
    check('intro overlay renders', true)
    const trace = []
    for (let i = 0; i < 11; i++) {
      await page.waitForTimeout(500)
      trace.push(await page.evaluate(() => `${document.documentElement.dataset.phase}:${getComputedStyle(document.documentElement).getPropertyValue('--launch')}`))
    }
    check('intro rests on the portrait (no auto-advance)', trace.at(-1).startsWith('intro'), trace.join(' '))
    await page.mouse.move(700, 400)
    await page.mouse.wheel(0, 300)
    await page.waitForFunction(() => document.documentElement.dataset.phase === 'landing', null, { timeout: 120000 }) // headless software GL runs ~3 fps
    check('scroll launches the landing', true)
    check('mission panel shows 4 missions', (await page.locator('.mission-row').count()) === 4)

    await page.locator('.mission-row').nth(1).click()
    await page.waitForSelector('.detail.open', { timeout: 5000 })
    check('mission brief opens', (await page.locator('.detail-title').innerText()) === 'CarbonCapex')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
    check('Esc closes the brief', (await page.locator('.detail.open').count()) === 0)

    await page.keyboard.press('/')
    await page.waitForSelector('.term-overlay input', { timeout: 3000 })
    await page.locator('.term-overlay input').fill('whoami')
    await page.keyboard.press('Enter')
    check('terminal answers whoami', (await page.locator('.term-overlay .term-screen').innerText()).includes('frontend developer'))
    await page.keyboard.press('Escape')

    await page.locator('.pilot button', { hasText: 'AR view' }).click()
    await page.waitForSelector('.ar-hud', { timeout: 10000 })
    check('AR view opens (camera blocked → stars fallback)', true)
    await page.locator('.ar button', { hasText: 'Exit' }).click()
    check('AR view closes', (await page.locator('.ar').count()) === 0)

    await page.locator('.back-btn').click()
    await page.waitForFunction(() => document.documentElement.dataset.phase === 'intro', null, { timeout: 5000 })
    check('◂ Pilot returns to the portrait', true)

    check('desktop: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
    await ctx.close()
  }

  // ---------- phone ----------
  {
    const { ctx, page, errors } = await session({ width: 390, height: 844 }, true)
    await page.addInitScript(() => sessionStorage.setItem('rafli.intro.seen', '1'))
    await page.goto(BASE)
    await page.waitForSelector('.pilot', { timeout: 15000 })
    await page.waitForTimeout(2500)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    check('phone: no horizontal overflow', overflow <= 1, `${overflow}px`)
    await page.locator('#mission-m-06 .card-actions button').click()
    await page.waitForSelector('.detail.open', { timeout: 5000 })
    check('phone: landed mission brief opens', (await page.locator('.landing-note').innerText()).includes('Valles Marineris'))
    check('phone: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
    await ctx.close()
  }

  // ---------- OG image ----------
  if (process.argv.includes('--og')) {
    const { ctx, page } = await session({ width: 1200, height: 630 }, false)
    await page.addInitScript(() => sessionStorage.setItem('rafli.intro.seen', '1'))
    await page.goto(BASE)
    await page.waitForTimeout(6000)
    await sharp(await page.screenshot({ type: 'png' })).jpeg({ quality: 82 }).toFile('public/og.jpg')
    console.log('wrote public/og.jpg')
    await ctx.close()
  }
} catch (e) {
  check('smoke run', false, e.message)
} finally {
  await browser.close()
  server.kill()
}

const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
