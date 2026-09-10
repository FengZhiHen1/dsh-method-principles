// Config boundary tests: the exported Schemastery schema is what the DSH loader
// validates and fills BEFORE apply, so its defaults and rejections are part of
// the plugin contract. Bare node, no DSH boot.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  apply,
  Config,
  DEFAULT_ENGINEERING_RIGOR_TEXT,
  DEFAULT_PRINCIPLES_TEXT,
  DEFAULT_ROUTES,
} from '../index.js'
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
  assert.deepEqual(Config({ text: 'X', extra: true }).extra, true)
})

test('schema defaults routes to the shipped engineering route', () => {
  assert.deepEqual(Config({}).routes, DEFAULT_ROUTES)
  assert.deepEqual(Config({}).routes[0].presets, ['standard', 'ptc'])
  assert.equal(Config({}).routes[0].mainAgentOnly, true)
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

test('engineering block is trigger-shaped: five moments, no proportionality escape', () => {
  assert.equal(DEFAULT_ENGINEERING_RIGOR_TEXT.split('\n')[0], 'Working method')
  for (const trigger of [
    'Before changing behavior:',
    'Before you claim a fix works:',
    'When you state a cause, a fix, or a conclusion that matters:',
    'Before any destructive or irreversible operation (delete, overwrite, truncate, force-push, drop, recursive cleanup):',
    'Before reporting a task complete:',
  ]) {
    assert.ok(DEFAULT_ENGINEERING_RIGOR_TEXT.includes(trigger), trigger)
  }
  // The proportionality meta-rule was rejected: it hands the decision back to
  // the model that under-estimates its own process cost.
  assert.equal(/proportional|when relevant|risk and uncertainty/i.test(DEFAULT_ENGINEERING_RIGOR_TEXT), false)
  assert.equal(DEFAULT_ENGINEERING_RIGOR_TEXT.includes('{{'), false)
})

test('engineering block makes the root cause a conditional requirement, not a ban', () => {
  assert.ok(DEFAULT_ENGINEERING_RIGOR_TEXT.includes('root cause with its evidence'))
  assert.ok(DEFAULT_ENGINEERING_RIGOR_TEXT.includes('still unconfirmed and how you will test it'))
})

test('destructive gate states the failure-mode self-check and the ordering rule', () => {
  assert.ok(DEFAULT_ENGINEERING_RIGOR_TEXT.includes('Treat it as high-risk by default, however routine it looks.'))
  assert.ok(DEFAULT_ENGINEERING_RIGOR_TEXT.includes('if the step before this had silently done nothing, what would this destroy?'))
  assert.ok(DEFAULT_ENGINEERING_RIGOR_TEXT.includes('a check after it is an autopsy, not a gate'))
})

test('only-copy rule carries an explicit exception with a named authority', () => {
  const line = DEFAULT_ENGINEERING_RIGOR_TEXT.split('\n').find(candidate => candidate.includes('only copy of anything'))
  assert.ok(line !== undefined)
  // The escape hatch names who may establish it, so the model cannot self-authorize.
  assert.ok(line.includes('unless it has been established as no longer needed'))
  assert.ok(line.includes('not your own confidence'))
  assert.ok(line.includes('When unsure, treat it as the only copy.'))
})

test('engineering block excludes adversarial review', () => {
  assert.equal(/adversarial|reviewer|subagent/i.test(DEFAULT_ENGINEERING_RIGOR_TEXT), false)
})

test('apply forwards the schema-filled config text to the section', () => {
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({}))
  assert.equal(sections.length, 1)
  assert.equal(sections[0].text(agentContext()), `${DEFAULT_PRINCIPLES_TEXT}\n\n${DEFAULT_ENGINEERING_RIGOR_TEXT}`)
})
