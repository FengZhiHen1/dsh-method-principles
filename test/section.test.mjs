// Section contract tests: name, order, absence of `complete`, the text function
// shape, and the empty-config off switch. The mock ctx records exactly what
// apply hands to ctx.systemPrompt.section().
//
// Tests that assert the BASE block alone pass `routes: []` explicitly, because
// the schema default now carries the shipped engineering route.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, Config, DEFAULT_PRINCIPLES_TEXT, SECTION_NAME, SECTION_ORDER } from '../index.js'
import { makeCtx } from './mock-ctx.mjs'

test('registers exactly one section', () => {
  const { ctx, sections } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ routes: [] }))
  assert.equal(sections.length, 1)
})

test('section name is the reserved unique name', () => {
  const { ctx, sections } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ routes: [] }))
  assert.equal(sections[0].name, SECTION_NAME)
  assert.equal(SECTION_NAME, 'deployment:method-principles')
})

test('section order places it after the persona and before plan policy', () => {
  const { ctx, sections } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ routes: [] }))
  assert.equal(sections[0].order, SECTION_ORDER)
  assert.equal(SECTION_ORDER, 200)
  assert.ok(SECTION_ORDER > 0, 'after deployment:persona (0)')
  assert.ok(SECTION_ORDER < 500, 'before plan:policy (500)')
})

test('section never declares complete', () => {
  const { ctx, sections } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ routes: [] }))
  assert.equal(sections[0].complete, undefined)
})

test('section text is a function of the assembly context', () => {
  const { ctx, sections } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ routes: [] }))
  assert.equal(typeof sections[0].text, 'function')
})

test('custom text reaches the section verbatim', () => {
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ text: 'custom', routes: [] }))
  assert.equal(sections[0].text(agentContext()), 'custom')
})

test('default text reaches the section verbatim when no route matches', () => {
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'minimal' })
  apply(ctx, Config({}))
  assert.equal(sections[0].text(agentContext()), DEFAULT_PRINCIPLES_TEXT)
})

test('empty text with no routes registers nothing', () => {
  const { ctx, sections } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ text: '', routes: [] }))
  assert.equal(sections.length, 0)
})

test('empty text with a route still registers (the route may supply text)', () => {
  const { ctx, sections } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ text: '', routes: [{ id: 'r', presets: ['standard'], text: 'R' }] }))
  assert.equal(sections.length, 1)
})

test('apply tolerates a config object without text or routes', () => {
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'minimal' })
  apply(ctx, {})
  assert.equal(sections.length, 1)
  assert.equal(sections[0].text(agentContext()), DEFAULT_PRINCIPLES_TEXT)
})

test('registration is wrapped in exactly one effect', () => {
  let effects = 0
  const ctx = {
    effect: () => { effects += 1 },
    systemPrompt: { section: () => () => {} },
    agentPresets: { composedPreset: () => 'standard' },
  }
  apply(ctx, Config({ routes: [] }))
  assert.equal(effects, 1)
})
