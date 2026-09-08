// Section contract tests: name, order, absence of `complete`, and the empty
// text off switch. The mock ctx records exactly what apply hands to
// ctx.systemPrompt.section().

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, Config, DEFAULT_PRINCIPLES_TEXT, SECTION_NAME, SECTION_ORDER } from '../index.js'

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

test('registers exactly one section', () => {
  const { ctx, sections } = makeCtx()
  apply(ctx, Config({}))
  assert.equal(sections.length, 1)
})

test('section name is the reserved unique name', () => {
  const { ctx, sections } = makeCtx()
  apply(ctx, Config({}))
  assert.equal(sections[0].name, SECTION_NAME)
  assert.equal(SECTION_NAME, 'deployment:method-principles')
})

test('section order places it after the persona and before plan policy', () => {
  const { ctx, sections } = makeCtx()
  apply(ctx, Config({}))
  assert.equal(sections[0].order, SECTION_ORDER)
  assert.equal(SECTION_ORDER, 200)
  assert.ok(SECTION_ORDER > 0, 'after deployment:persona (0)')
  assert.ok(SECTION_ORDER < 500, 'before plan:policy (500)')
})

test('section never declares complete', () => {
  const { ctx, sections } = makeCtx()
  apply(ctx, Config({}))
  assert.equal(sections[0].complete, undefined)
})

test('custom text reaches the section verbatim', () => {
  const { ctx, sections } = makeCtx()
  apply(ctx, Config({ text: 'custom' }))
  assert.equal(sections[0].text, 'custom')
})

test('default text reaches the section verbatim', () => {
  const { ctx, sections } = makeCtx()
  apply(ctx, Config({}))
  assert.equal(sections[0].text, DEFAULT_PRINCIPLES_TEXT)
})

test('empty text registers nothing', () => {
  const { ctx, sections } = makeCtx()
  apply(ctx, Config({ text: '' }))
  assert.equal(sections.length, 0)
})

test('apply tolerates a config object without text', () => {
  const { ctx, sections } = makeCtx()
  apply(ctx, {})
  assert.equal(sections.length, 1)
  assert.equal(sections[0].text, DEFAULT_PRINCIPLES_TEXT)
})

test('registration is wrapped in exactly one effect', () => {
  let effects = 0
  const ctx = {
    effect: () => { effects += 1 },
    systemPrompt: { section: () => () => {} },
  }
  apply(ctx, Config({}))
  assert.equal(effects, 1)
})
