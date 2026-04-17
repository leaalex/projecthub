#!/usr/bin/env node
/**
 * Checks that en.json and ru.json have identical key sets.
 * Exits with code 1 and prints missing keys if there is any mismatch.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const localesDir = join(__dirname, '../src/i18n/locales')

const en = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'))
const ru = JSON.parse(readFileSync(join(localesDir, 'ru.json'), 'utf8'))

/** Flatten a nested object into dot-separated keys. */
function flatten(obj, prefix = '') {
  const result = []
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result.push(...flatten(value, full))
    } else {
      result.push(full)
    }
  }
  return result
}

const enKeys = new Set(flatten(en))
const ruKeys = new Set(flatten(ru))

const missingInRu = [...enKeys].filter((k) => !ruKeys.has(k))
const missingInEn = [...ruKeys].filter((k) => !enKeys.has(k))

let failed = false

if (missingInRu.length) {
  console.error('\n❌  Keys present in en.json but MISSING in ru.json:')
  missingInRu.forEach((k) => console.error(`   ${k}`))
  failed = true
}

if (missingInEn.length) {
  console.error('\n❌  Keys present in ru.json but MISSING in en.json:')
  missingInEn.forEach((k) => console.error(`   ${k}`))
  failed = true
}

if (failed) {
  console.error('\ni18n key parity check FAILED.\n')
  process.exit(1)
} else {
  console.log(`✅  i18n key parity OK — ${enKeys.size} keys in both en.json and ru.json.`)
}
