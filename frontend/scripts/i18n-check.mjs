#!/usr/bin/env node
/**
 * Checks that en.json and ru.json have identical key sets and matching string shapes
 * (placeholders, plural branch counts, non-empty strings).
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const localesDir = join(__dirname, '../src/infrastructure/i18n/locales')

const en = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'))
const ru = JSON.parse(readFileSync(join(localesDir, 'ru.json'), 'utf8'))

const PLACEHOLDER_RE = /\{[^}]+\}/g

/** Flatten nested object into Map of dot-separated key -> leaf value. */
function flattenEntries(obj, prefix = '') {
  const map = new Map()
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nested = flattenEntries(value, full)
      for (const [k, v] of nested) map.set(k, v)
    } else {
      map.set(full, value)
    }
  }
  return map
}

/** @param {string} s */
function placeholderSetSorted(s) {
  const m = s.match(PLACEHOLDER_RE)
  return [...new Set(m ?? [])].sort()
}

/** Plural-style messages use `|`; locales may use different branch counts (en vs ru). */
function hasPluralPipe(s) {
  return s.includes('|')
}

const enMap = flattenEntries(en)
const ruMap = flattenEntries(ru)

const enKeys = new Set(enMap.keys())
const ruKeys = new Set(ruMap.keys())

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
}

const commonKeys = [...enKeys].filter((k) => ruKeys.has(k)).sort()

const nonString = []
const empty = []
const placeholderMismatch = []
const pluralPipeMismatch = []

for (const key of commonKeys) {
  const ev = enMap.get(key)
  const rv = ruMap.get(key)

  if (typeof ev !== 'string' || typeof rv !== 'string') {
    nonString.push(
      key +
        ` (en: ${typeof ev}, ru: ${typeof rv})`,
    )
    continue
  }

  if (ev.trim() === '' || rv.trim() === '') {
    empty.push(key)
    continue
  }

  const ep = placeholderSetSorted(ev)
  const rp = placeholderSetSorted(rv)
  if (ep.length !== rp.length || ep.some((x, i) => x !== rp[i])) {
    placeholderMismatch.push(
      `${key} — en: [${ep.join(', ')}] vs ru: [${rp.join(', ')}]`,
    )
  }

  const enPipe = hasPluralPipe(ev)
  const ruPipe = hasPluralPipe(rv)
  if (enPipe !== ruPipe) {
    pluralPipeMismatch.push(
      `${key} — plural pipes (|) in ${enPipe ? 'en' : 'ru'} only`,
    )
  }
}

if (nonString.length) {
  console.error('\n❌  Non-string leaf values:')
  nonString.forEach((k) => console.error(`   ${k}`))
  failed = true
}

if (empty.length) {
  console.error('\n❌  Empty string values:')
  empty.forEach((k) => console.error(`   ${k}`))
  failed = true
}

if (placeholderMismatch.length) {
  console.error('\n❌  Placeholder set mismatch {…}:')
  placeholderMismatch.forEach((k) => console.error(`   ${k}`))
  failed = true
}

if (pluralPipeMismatch.length) {
  console.error(
    '\n❌  Plural pipe (|) mismatch (one locale uses | branches, the other does not):',
  )
  pluralPipeMismatch.forEach((k) => console.error(`   ${k}`))
  failed = true
}

if (failed) {
  console.error('\ni18n shape check FAILED.\n')
  process.exit(1)
}

console.log(
  `✅  i18n OK — ${enKeys.size} keys · placeholders & plural-pipe presence in sync.`,
)
