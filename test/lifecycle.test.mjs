// Lifecycle tests: mount -> dispose -> remount. The mock ctx mirrors Cordis'
// effect semantics (apply registers through ctx.effect, whose callback returns
// the section disposer), so disposal must leave no section behind and a remount
// must not produce a duplicate.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, Config, SECTION_NAME } from '../index.js'
import { makeCtx } from './mock-ctx.mjs'

test('dispose removes the section completely', () => {
  const { ctx, sections, dispose } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({}))
  assert.equal(sections.length, 1)
  dispose()
  assert.equal(sections.length, 0)
})

test('remount after dispose registers exactly one section again', () => {
  const { ctx, sections, dispose } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({}))
  dispose()
  apply(ctx, Config({}))
  assert.equal(sections.length, 1)
  assert.equal(sections[0].name, SECTION_NAME)
})

test('dispose is idempotent', () => {
  const { ctx, sections, dispose } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({}))
  dispose()
  dispose()
  assert.equal(sections.length, 0)
})

test('empty mount followed by dispose leaves nothing behind', () => {
  const { ctx, sections, dispose } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ text: '' }))
  dispose()
  assert.equal(sections.length, 0)
})

test('remount with different config replaces the previous text', () => {
  const { ctx, sections, dispose, agentContext } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ text: 'first' }))
  dispose()
  apply(ctx, Config({ text: 'second' }))
  assert.equal(sections.length, 1)
  assert.equal(sections[0].text(agentContext()), 'second')
})
