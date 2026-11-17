// Screenshots of every live mission site (implementasi.md §7.3) → public/shots/<id>-desktop.webp / -mobile.webp.
// Uses the system's Chrome or Edge through playwright-core, so no browser download is needed.
// Run: npm run assets:shots   (optionally: node scripts/capture-shots.mjs m-02 m-04 to redo some)
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import { mkdirSync, readFileSync } from 'node:fs'

// mission ids + urls are read from src/data/missions.ts so the list never drifts
const src = readFileSync('src/data/missions.ts', 'utf8')
const missions = [...src.matchAll(/id: '(m-\d\d)'[\s\S]*?(?:url: '([^']+)'|orbit:)/g)]
  .map((m) => ({ id: m[1], url: m[2] }))
  .filter((m) => m.url)
const only = process.argv.slice(2)
const todo = only.length ? missions.filter((m) => only.includes(m.id)) : missions

const VIEWS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, width: 1200 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, width: 390 },
}

mkdirSync('public/shots', { recursive: true })
let browser
for (const channel of ['chrome', 'msedge']) {
  try {
    browser = await chromium.launch({ channel })
    break
  } catch {
    // try the next installed browser
  }
}
if (!browser) throw new Error('No Chrome or Edge found for playwright-core')

for (const m of todo) {
  for (const [name, v] of Object.entries(VIEWS)) {
    const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: v.deviceScaleFactor, isMobile: v.isMobile, hasTouch: v.hasTouch, colorScheme: 'dark' })
    const page = await ctx.newPage()
    try {
      await page.goto(m.url, { waitUntil: 'networkidle', timeout: 45000 })
    } catch {
      // some sites keep long-polling; whatever has rendered by now is fine
    }
    await page.waitForTimeout(2500) // let intro animations settle
    const png = await page.screenshot({ type: 'png' })
    const out = `public/shots/${m.id}-${name}.webp`
    await sharp(png).resize({ width: v.width }).webp({ quality: 78 }).toFile(out)
    console.log(`${out}  ←  ${m.url}`)
    await ctx.close()
  }
}
await browser.close()
