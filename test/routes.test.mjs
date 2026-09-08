// Routing tests: the pure resolver decides which agents get which text. These
// cover the mechanism the live probe validated — preset match by id, subagent
// exclusion by delegation depth, and first-match ordering.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, Config, depthOf, resolveRouteText, routeMatches } from '../index.js'
import { makeCtx } from './mock-ctx.mjs'

const route = (over = {}) => ({ id: 'r', presets: ['standard'], text: 'R', mainAgentOnly: true, ...over })
const agent = (over = {}) => ({ presetId: 'standard', depth: 0, ...over })

test('matches the named preset', () => {
  assert.equal(routeMatches(route(), agent()), true)
})

test('does not match another preset', () => {
  assert.equal(routeMatches(route(), agent({ presetId: 'ptc' })), false)
})

test('does not match an unknown preset', () => {
  assert.equal(routeMatches(route(), agent({ presetId: undefined })), false)
})

test('mainAgentOnly (default) excludes subagents', () => {
  assert.equal(routeMatches(route(), agent({ depth: 1 })), false)
  assert.equal(routeMatches(route({ mainAgentOnly: true }), agent({ depth: 3 })), false)
})

test('mainAgentOnly: false lets subagents inherit', () => {
  assert.equal(routeMatches(route({ mainAgentOnly: false }), agent({ depth: 1 })), true)
})

test('resolves the first matching route in order', () => {
  const routes = [
    route({ id: 'a', presets: ['ptc'], text: 'A' }),
    route({ id: 'b', presets: ['standard'], text: 'B' }),
    route({ id: 'c', presets: ['standard'], text: 'C' }),
  ]
  assert.equal(resolveRouteText(routes, agent()), 'B')
  assert.equal(resolveRouteText(routes, agent({ presetId: 'ptc' })), 'A')
})

test('returns empty string when nothing matches or routes are absent', () => {
  assert.equal(resolveRouteText(undefined, agent()), '')
  assert.equal(resolveRouteText([], agent()), '')
  assert.equal(resolveRouteText([route({ presets: ['ptc'] })], agent()), '')
})

test('one route can cover several presets', () => {
  const routes = [route({ presets: ['standard', 'ptc'], text: 'both' })]
  assert.equal(resolveRouteText(routes, agent()), 'both')
  assert.equal(resolveRouteText(routes, agent({ presetId: 'ptc' })), 'both')
})

test('depthOf reads the persisted header and the runtime option, taking the deeper', () => {
  assert.equal(depthOf(undefined), 0)
  assert.equal(depthOf({}), 0)
  assert.equal(depthOf({ session: { header: { delegationDepth: 2 } } }), 2)
  assert.equal(depthOf({ options: { subagentDepth: 1 } }), 1)
  assert.equal(depthOf({ session: { header: { delegationDepth: 1 } }, options: { subagentDepth: 3 } }), 3)
})

test('depthOf ignores malformed values instead of throwing', () => {
  assert.equal(depthOf({ session: { header: { delegationDepth: -1 } } }), 0)
  assert.equal(depthOf({ session: { header: { delegationDepth: 1.5 } } }), 0)
  assert.equal(depthOf({ options: { subagentDepth: 'x' } }), 0)
})

test('assembly text: base block plus the route block for a matching main agent', () => {
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ text: 'BASE', routes: [route({ text: 'ENG' })] }))
  assert.equal(sections[0].text(agentContext()), 'BASE\n\nENG')
})

test('assembly text: a subagent gets only the base block', () => {
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'standard', depth: 1 })
  apply(ctx, Config({ text: 'BASE', routes: [route({ text: 'ENG' })] }))
  assert.equal(sections[0].text(agentContext()), 'BASE')
})

test('assembly text: a non-matching preset gets only the base block', () => {
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'minimal' })
  apply(ctx, Config({ text: 'BASE', routes: [route({ text: 'ENG' })] }))
  assert.equal(sections[0].text(agentContext()), 'BASE')
})

test('assembly text: empty base leaves the route text alone', () => {
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ text: '', routes: [route({ text: 'ENG' })] }))
  assert.equal(sections[0].text(agentContext()), 'ENG')
})

test('assembly text: no agent in context yields the base block', () => {
  const { ctx, sections } = makeCtx({ presetId: 'standard' })
  apply(ctx, Config({ text: 'BASE', routes: [route({ text: 'ENG' })] }))
  assert.equal(sections[0].text({}), 'BASE')
})

test('assembly text: a missing roster yields the base block, never a throw', () => {
  const { ctx, sections, agentContext } = makeCtx({ presetId: 'standard', withPresets: false })
  apply(ctx, Config({ text: 'BASE', routes: [route({ text: 'ENG' })] }))
  assert.equal(sections[0].text(agentContext()), 'BASE')
})
