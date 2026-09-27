// Real-runtime assembly gate (environment-gated integration test).
//
// Every other test in this suite drives the plugin through a MOCK ctx. That
// leaves one untested seam: whether the plugin's section actually lands in the
// REAL `@deepseek-ai/dsh-system-prompt` registry, in the documented position,
// with the documented text routing. A mock cannot catch an upstream rename or
// a re-ordered order table — which is exactly what happened between the
// v0.1.2-rc.1 and v0.1.7-rc.2 baselines (the deployment persona was SPLIT into
// `deployment:persona-prefix` / `-suffix`).
//
// This test mounts the REAL service from an installed DSH runtime and runs a
// REAL assemble(). It is deliberately ENVIRONMENT-GATED: the runtime lives
// outside this repository, so when it cannot be found the test SKIPS with a
// clear reason instead of failing. Run it wherever a DSH runtime is installed
// (`DSH_RUNTIME_DIR` overrides the discovered path); a skip means "not checked
// here", never "checked and fine".
//
// What it therefore does and does not prove:
//   proven  — section registration, the declared order, sort position between
//             the persona prefix and suffix, per-agent text routing (main vs
//             subagent vs unmatched preset), the empty-text off switch, and
//             disposal removing the section.
//   not     — the loader/patch layer, the preset roster, the peer-version gate,
//             or the browser UI. Those remain deployment-gate items.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { Config, SECTION_NAME, SECTION_ORDER, apply } from '../index.js'

/** Candidate launcher-managed runtime roots, newest first. */
function candidateRoots() {
  const roots = []
  if (process.env.DSH_RUNTIME_DIR) roots.push(process.env.DSH_RUNTIME_DIR)
  const appData = process.env.APPDATA
  if (appData) {
    roots.push(join(appData, 'in.dsh-plug.dsh-launcher', 'versions'))
    roots.push(join(appData, 'dsh-launcher', 'versions'))
  }
  return roots.filter((root) => existsSync(root))
}

/**
 * Find a real DSH package's ESM entry inside a launcher `versions/<v>` tree.
 * pnpm store directory names are truncated and hashed, so the package name is
 * never in the directory name — each entry has to be examined from inside.
 */
function findRuntime() {
  for (const root of candidateRoots()) {
    let versions
    try { versions = readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) } catch { continue }
    // Prefer the newest baseline by descending name order.
    for (const version of versions.sort().reverse()) {
      const pnpm = join(root, version, 'node_modules', '.pnpm')
      if (!existsSync(pnpm)) continue
      let dirs
      try { dirs = readdirSync(pnpm) } catch { continue }
      const locate = (pkg, rel) => {
        for (const dir of dirs) {
          const candidate = join(pnpm, dir, 'node_modules', '@deepseek-ai', pkg, rel)
          if (existsSync(candidate)) return candidate
        }
        return undefined
      }
      const systemPrompt = locate('dsh-system-prompt', 'lib/index.js')
      const cordis = locate('cordis', 'lib/index.js')
      if (systemPrompt !== undefined && cordis !== undefined) {
        return { version, systemPrompt, cordis }
      }
    }
  }
  return undefined
}

const runtime = findRuntime()
const SKIP_REASON = `no installed DSH runtime found (searched DSH_RUNTIME_DIR and the launcher versions directory); set DSH_RUNTIME_DIR to an installed runtime to run this gate`

/** Mount the real SystemPrompt service plus a minimal agentPresets stub. */
async function makeRoot(mods, presetId) {
  const { Context, Service } = mods.cordis
  const ctx = new Context()
  await ctx.plugin(mods.SystemPrompt, {})
  class StubPresets extends Service {
    constructor(inner) { super(inner, 'agentPresets') }
    composedPreset() { return presetId }
  }
  await ctx.plugin(StubPresets)
  return ctx
}

/** Mount the plugin on a context that injects both services it declares. */
function mountPlugin(ctx, config) {
  return ctx.plugin({
    inject: ['systemPrompt', 'agentPresets'],
    apply(c) { apply(c, config ?? Config({})) },
  })
}

/** An agent shape carrying the routing facts the plugin reads. */
const agentAt = (depth, id = `probe-${depth}`) => ({
  id, ctx: {}, session: { header: { delegationDepth: depth } }, options: {},
})

/** Load the real runtime modules once for the whole file. */
async function loadRuntime() {
  if (runtime === undefined) return undefined
  const cordis = await import(pathToFileURL(runtime.cordis).href)
  const spMod = await import(pathToFileURL(runtime.systemPrompt).href)
  return {
    cordis,
    SystemPrompt: spMod.default ?? spMod.SystemPrompt,
  }
}

const mods = await loadRuntime()

test('section lands in the REAL registry between the persona prefix and suffix', { skip: runtime === undefined ? SKIP_REASON : false }, async () => {
  const ctx = await makeRoot(mods, 'standard')
  await mountPlugin(ctx)
  const { sections } = await ctx.systemPrompt.assemble({ agent: agentAt(0) })
  const names = sections.map((s) => s.name)
  const mine = names.indexOf(SECTION_NAME)
  const prefix = names.indexOf('deployment:persona-prefix')
  const suffix = names.indexOf('deployment:persona-suffix')
  assert.ok(mine >= 0, `section missing from the real assembly: ${JSON.stringify(names)}`)
  // The v0.1.7 baseline split the persona; assert BOTH halves so a future
  // re-merge fails loudly here rather than silently invalidating the docs.
  assert.ok(prefix >= 0, `persona prefix section absent — baseline anchors changed: ${JSON.stringify(names)}`)
  assert.ok(suffix >= 0, `persona suffix section absent — baseline anchors changed: ${JSON.stringify(names)}`)
  assert.ok(mine > prefix, `section must follow the persona prefix (mine ${mine}, prefix ${prefix})`)
  assert.ok(mine < suffix, `section must precede the persona suffix (mine ${mine}, suffix ${suffix})`)
})

test('the registered section declares the documented name, order and no `complete`', { skip: runtime === undefined ? SKIP_REASON : false }, async () => {
  const ctx = await makeRoot(mods, 'standard')
  let registered
  const original = ctx.systemPrompt.section.bind(ctx.systemPrompt)
  ctx.systemPrompt.section = (section) => { registered = section; return original(section) }
  await mountPlugin(ctx)
  assert.notEqual(registered, undefined, 'section() was never called')
  assert.equal(registered.name, SECTION_NAME)
  assert.equal(registered.order, SECTION_ORDER)
  assert.equal(registered.complete, undefined, 'a `complete` section would displace the whole prompt')
})

test('a routed preset gets base + engineering; an unmatched preset gets the base block alone', { skip: runtime === undefined ? SKIP_REASON : false }, async () => {
  const sectionText = async (presetId) => {
    const ctx = await makeRoot(mods, presetId)
    await mountPlugin(ctx)
    const { sections } = await ctx.systemPrompt.assemble({ agent: agentAt(0) })
    return sections.find((s) => s.name === SECTION_NAME)?.text ?? ''
  }
  const standard = await sectionText('standard')
  assert.ok(standard.includes('Evidence discipline:'), 'base block must reach a routed preset')
  assert.ok(standard.includes('Working method'), 'engineering block must reach a routed preset')
  assert.ok(standard.includes('\n\n'), 'the two blocks must be separated by a blank line')

  const unmatched = await sectionText('minimal')
  assert.ok(unmatched.includes('Evidence discipline:'), 'base block must reach every agent')
  assert.ok(!unmatched.includes('Working method'), 'engineering block must not leak to an unmatched preset')
})

test('a subagent is excluded from the engineering block by the real depth facts', { skip: runtime === undefined ? SKIP_REASON : false }, async () => {
  const ctx = await makeRoot(mods, 'standard')
  await mountPlugin(ctx)
  const { sections } = await ctx.systemPrompt.assemble({ agent: agentAt(1) })
  const text = sections.find((s) => s.name === SECTION_NAME)?.text ?? ''
  assert.ok(text.includes('Evidence discipline:'), 'a subagent still gets the base block')
  assert.ok(!text.includes('Working method'), 'a subagent must not inherit a mainAgentOnly route')
})

test('an assembly without an agent degrades to the base block instead of throwing', { skip: runtime === undefined ? SKIP_REASON : false }, async () => {
  const ctx = await makeRoot(mods, 'standard')
  await mountPlugin(ctx)
  const { sections } = await ctx.systemPrompt.assemble()
  const text = sections.find((s) => s.name === SECTION_NAME)?.text ?? ''
  assert.ok(text.includes('Evidence discipline:'))
  assert.ok(!text.includes('Working method'), 'no agent means no route match')
})

test('the empty-text off switch registers nothing in the real registry', { skip: runtime === undefined ? SKIP_REASON : false }, async () => {
  const ctx = await makeRoot(mods, 'standard')
  let calls = 0
  const original = ctx.systemPrompt.section.bind(ctx.systemPrompt)
  ctx.systemPrompt.section = (section) => { calls += 1; return original(section) }
  await mountPlugin(ctx, Config({ text: '', routes: [] }))
  assert.equal(calls, 0, 'the off switch must not register a section')
  const { sections } = await ctx.systemPrompt.assemble({ agent: agentAt(0) })
  assert.ok(!sections.some((s) => s.name === SECTION_NAME), 'the off-switched section must be absent')
})

test('disposal removes the section from the real registry', { skip: runtime === undefined ? SKIP_REASON : false }, async () => {
  const ctx = await makeRoot(mods, 'standard')
  const fiber = await mountPlugin(ctx)
  const before = (await ctx.systemPrompt.assemble({ agent: agentAt(0) })).sections.map((s) => s.name)
  assert.ok(before.includes(SECTION_NAME), 'section must be present before dispose')
  await fiber.dispose()
  const after = (await ctx.systemPrompt.assemble({ agent: agentAt(0) })).sections.map((s) => s.name)
  assert.ok(!after.includes(SECTION_NAME), 'section must be gone after dispose')
})
