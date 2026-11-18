// Keeps the agent codemap honest: every file under src/ and scripts/ must be named in docs/agent/codemap.md,
// and every src/ or scripts/ path the codemap names must still exist.
// Run: npm run docs:check
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const MAP = 'docs/agent/codemap.md'
const map = readFileSync(MAP, 'utf8')

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name).replaceAll('\\', '/')
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const files = [...walk('src'), ...walk('scripts')]
const missing = files.filter((f) => !map.includes('`' + f + '`'))
const listed = [...map.matchAll(/`((?:src|scripts)\/[^`\s]+\.[a-z]+)`/g)].map((m) => m[1])
const stale = [...new Set(listed)].filter((f) => !existsSync(f))

for (const f of missing) console.error(`not in ${MAP}: ${f}`)
for (const f of stale) console.error(`listed in ${MAP} but missing on disk: ${f}`)
if (missing.length || stale.length) process.exit(1)
console.log(`codemap ok: ${files.length} files`)
