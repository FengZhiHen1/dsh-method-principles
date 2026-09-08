// Lifecycle tests: mount -> dispose -> remount. The mock ctx mirrors Cordis'
// effect semantics (apply registers through ctx.effect, whose callback returns
// the section disposer), so disposal must leave no section behind and a remount
// must not produce a duplicate.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, Config, SECTION_NAME } from '../index.js'

function makeLifecycleCtx() {
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
  return {
    ctx,
    sections,
    dispose: () => {
      while (disposers.length > 0) disposers.pop()()
    },
  }
}

test('dispose removes the section completely', () => {
  const { ctx, sections, dispose } = makeLifecycleCtx()
  apply(ctx, Config({}))
  assert.equal(sections.length, 1)
  dispose()
  assert.equal(sections.length, 0)
})

test('remount after dispose registers exactly one section again', () => {
  const { ctx, sections, dispose } = makeLifecycleCtx()
  apply(ctx, Config({}))
  dispose()
  apply(ctx, Config({}))
  assert.equal(sections.length, 1)
  assert.equal(sections[0].name, SECTION_NAME)
})

test('dispose is idempotent', () => {
  const { ctx, sections, dispose } = makeLifecycleCtx()
  apply(ctx, Config({}))
  dispose()
  dispose()
  assert.equal(sections.length, 0)
})

test('empty-text mount followed by dispose leaves nothing behind', () => {
  const { ctx, sections, dispose } = makeLifecycleCtx()
  apply(ctx, Config({ text: '' }))
  dispose()
  assert.equal(sections.length, 0)
})
