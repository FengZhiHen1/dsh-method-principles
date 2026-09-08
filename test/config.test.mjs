// Config boundary tests: the exported Schemastery schema is what the DSH loader
// validates and fills BEFORE apply, so its defaults and rejections are part of
// the plugin contract. Bare node, no DSH boot.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, Config, DEFAULT_PRINCIPLES_TEXT } from '../index.js'
import { makeCtx } from './mock-ctx.mjs'

const HEADING = 'Working principles:'

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
  // ignores them (it reads `text` and `routes` only).
  assert.deepEqual(Config({ text: 'X', extra: true }), { text: 'X', routes: [], extra: true })
})

test('schema defaults routes to an empty list', () => {
  assert.deepEqual(Config({}).routes, [])
})

test('schema fills route defaults: mainAgentOnly is true', () => {
  const config = Config({ routes: [{ id: 'r', presets: ['standard'], text: 'T' }] })
  assert.deepEqual(config.routes, [{ id: 'r', presets: ['standard'], text: 'T', mainAgentOnly: true }])
})

test('schema rejects a route without presets or text', () => {
  assert.throws(() => Config({ routes: [{ id: 'r', text: 'T' }] }))
  assert.throws(() => Config({ routes: [{ id: 'r', presets: ['standard'] }] }))
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
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({}))
  assert.equal(sections.length, 1)
  assert.equal(sections[0].text(agentContext()), DEFAULT_PRINCIPLES_TEXT)
})
