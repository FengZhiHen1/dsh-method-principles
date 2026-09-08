// host — DSH adapter entry: the Config schema, the distilled default text, and
// the single system-prompt section registration.
//
// Boundary: this plugin contributes exactly ONE global prompt section and
// nothing else — no service, no tool, no dynamic context, no variable. The
// section is registered through ctx.systemPrompt.section() inside ctx.effect(),
// so the fiber's dispose path removes it automatically. Section name and order
// are deliberate: `deployment:method-principles` never collides with the
// persona slot, and order 200 places the block after the persona and before
// plan policy / tool guidance.
//
// Per-agent routing: the section text is a function evaluated at each assembly.
// The base `text` is the universal block; `routes` add per-preset blocks. The
// route decision needs two facts from the assembly context — the agent's
// joined preset (via ctx.agentPresets.composedPreset(agent.ctx)) and its
// delegation depth — which are extracted here and matched in src/core/routes.js.
// A route therefore reaches only the agents it names, and (by default) only
// main agents, so a reviewer subagent never inherits the review protocol.
// Reference: docs/technical-details/提示词段机制.md.

import z from '@deepseek-ai/schemastery'
import { depthOf, resolveRouteText } from '../core/routes.js'

/** Global system-prompt section name. Must stay unique across every plugin and preset. */
export const SECTION_NAME = 'deployment:method-principles'

/** Section placement: after the deployment persona (0), before plan policy (500). */
export const SECTION_ORDER = 200

/**
 * Distilled methodology principles (8 lines plus the heading). Kept in English
 * to match the rest of the system prompt, and intentionally short: the point is
 * to trigger capability the model already has, not to restate general process.
 */
export const DEFAULT_PRINCIPLES_TEXT = [
  'Working principles:',
  '- First principles: before changing anything, confirm the problem exists and reproduces, name the root cause, and state the success criteria and what will change after the fix.',
  '- Adversarial review: have a reviewer with no implementation context hunt for counterexamples, gaps, and failure cases, and demand evidence for each.',
  "- Ablation: to prove a rule, tool, or step matters, remove it, keep everything else fixed, re-run, and compare.",
  "- Occam's razor: start from the simplest version that works and let structure follow real demand.",
  '- Surface uncertainty: state which conclusions lack evidence, which cases are untested, and where you are guessing.',
  "- Judge first: form your own conclusion and basis before reading another agent's answer.",
  '- Critical thinking: separate what you observed from what you inferred, and say what evidence would overturn your judgment.',
  '- High cohesion, low coupling: keep related logic together and isolate modules behind clear interfaces, so each change has a bounded blast radius.',
].join('\n')

/**
 * Engineering-method block routed to the coding agents' main agents. Written as
 * TRIGGERS, not slogans: each rule is bound to the moment it must fire, because
 * the observed failure mode is that the model knows these methods but does not
 * apply them unprompted (it rushes in and confabulates). Deliberately excludes
 * adversarial review — that protocol needs a subagent and belongs to presets
 * that own one; this block stays executable by the agent reading it.
 */
export const DEFAULT_ENGINEERING_RIGOR_TEXT = [
  'Working method (apply the rule when its moment comes):',
  '',
  'Before changing anything:',
  '- Confirm the problem actually exists and reproduces, and name the root cause. If you cannot reproduce it, say so before working around it.',
  '',
  'Whenever you state a cause, a fix, or a conclusion:',
  '- Separate what you observed from what you inferred, and say what evidence would overturn it.',
  '',
  'Before reporting a task complete:',
  '- State what you ran, what you observed, and what you did NOT verify.',
  '- List the conclusions that lack evidence, the cases you did not test, and the places you are guessing.',
].join('\n')

/**
 * Default routes: the engineering block reaches main agents of the coding
 * presets only. `mainAgentOnly` keeps subagents on the base block, so a
 * delegated worker never inherits instructions meant for the agent that owns
 * the task.
 */
export const DEFAULT_ROUTES = [
  {
    id: 'engineering',
    presets: ['standard', 'ptc'],
    text: DEFAULT_ENGINEERING_RIGOR_TEXT,
    mainAgentOnly: true,
  },
]

const routeSchema = z.object({
  id: z.string(),
  presets: z.array(z.string()).required(),
  text: z.string().required(),
  /** Default true: subagents (delegation depth > 0) never inherit this route. */
  mainAgentOnly: z.boolean().default(true),
})

/**
 * Plugin config. The loader validates this schema BEFORE apply and fills in
 * defaults, so apply always receives a complete config; an invalid value fails
 * the mount with the loader's actionable ValidationError. `text` is the
 * universal block; `routes` are per-preset additions matched in order.
 */
export const Config = z.object({
  text: z.string().default(DEFAULT_PRINCIPLES_TEXT),
  routes: z.array(routeSchema).default(DEFAULT_ROUTES),
})

export const name = 'dsh-method-principles'

/** Hard dependencies: the section registry and the preset roster (for routing). */
export const inject = ['systemPrompt', 'agentPresets']

/**
 * Resolve the section text for one assembly: the base block plus any route the
 * agent matches. The preset lookup is defensive: `inject` guarantees the roster
 * is present, but an assembly without an agent (or a context that lost the
 * service) must never fail — it simply matches no route.
 * @param ctx - the plugin context (for the preset roster).
 * @param config - validated config supplied by the loader.
 * @param context - the assembly context carrying the agent, when present.
 * @returns the text for this assembly; '' removes the section from it.
 */
function textFor(ctx, config, context) {
  const agent = context?.agent
  const presets = ctx.agentPresets
  const presetId = agent === undefined || presets === undefined
    ? undefined
    : presets.composedPreset(agent.ctx)
  const routed = resolveRouteText(config.routes, { presetId, depth: depthOf(agent) })
  if (routed.length === 0) return config.text
  return config.text.length === 0 ? routed : `${config.text}\n\n${routed}`
}

/**
 * Register the section. An empty text and no matching route register nothing —
 * the assembled prompt drops empty sections anyway, and skipping the
 * registration keeps the registry honest about what this plugin contributes.
 * @param ctx - the plugin's Cordis context.
 * @param config - validated config supplied by the loader.
 */
export function apply(ctx, config) {
  const text = config?.text ?? DEFAULT_PRINCIPLES_TEXT
  const routes = config?.routes ?? DEFAULT_ROUTES
  if (text.length === 0 && routes.length === 0) return
  ctx.effect(() => ctx.systemPrompt.section({
    name: SECTION_NAME,
    order: SECTION_ORDER,
    text: (context) => textFor(ctx, { text, routes }, context),
  }), 'dsh-method-principles.section()')
}
