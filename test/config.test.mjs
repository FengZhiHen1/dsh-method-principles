// Config boundary tests: the exported Schemastery schema is what the DSH loader
// validates and fills BEFORE apply, so its defaults and rejections are part of
// the plugin contract. Bare node, no DSH boot.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, Config, DEFAULT_PRINCIPLES_TEXT } from '../index.js'

const HEADING = 'Working principles:'

function makeCtx() {
  const sections = []
  const disposers = []
  const ctx = {
    effect: (fn) => {
      const result = fn()
      if (typeof result === 'function') disposers.push(result)
    },
    systemPrompt: {
      section: (section) => {
        sections.push(section)
        return () => {
          const index = sections.indexOf(section)
          if (index >= 0) sections.splice(index, 1)
        }
      },
    },
  }
  return { ctx, sections, dispose: () => disposers.splice(0).forEach((fn) => fn()) }
}

test('schema fills the distilled default text when config omits it', () => {
  const config = Config({})
  assert.equal(config.text, DEFAULT_PRINCIPLES_TEXT)
})

test('schema keeps a provided text verbatim', () => {
  assert.equal(Config({ text: 'X' }).text, 'X')
})

test('schema accepts the empty string as the explicit off switch', () => {
  assert.equal(Config({ text: '' }).text, '')
})

test('schema rejects a non-string text', () => {
  assert.throws(() => Config({ text: 42 }))
})

test('schema passes unknown keys through in its default non-strict mode', () => {
  // Schemastery merges unknown keys unless resolved in strict mode, which the
  // plugin never sees. Extra keys therefore cannot fail the mount; this plugin
  // ignores them (it reads `text` only) instead of hand-rolling key rejection.
  assert.deepEqual(Config({ text: 'X', extra: true }), { text: 'X', extra: true })
})

test('default text matches the documented shape: heading plus eight lines', () => {
  const lines = DEFAULT_PRINCIPLES_TEXT.split('\n')
  assert.equal(lines[0], HEADING)
  assert.equal(lines.length, 9)
  for (const line of lines.slice(1)) assert.match(line, /^- /)
  assert.equal(new Set(lines.slice(1)).size, 8)
})

test('default text contains no prompt variable references', () => {
  assert.equal(DEFAULT_PRINCIPLES_TEXT.includes('{{'), false)
})

test('apply forwards the schema-filled config text to the section', () => {
  const { ctx, sections } = makeCtx()
  apply(ctx, Config({}))
  assert.equal(sections.length, 1)
  assert.equal(sections[0].text, DEFAULT_PRINCIPLES_TEXT)
})
