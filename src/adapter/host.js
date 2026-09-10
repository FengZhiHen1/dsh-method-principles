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
 * apply them unprompted (it rushes in and confabulates).
 *
 * Deliberate choices:
 * - no proportionality meta-rule: "apply when relevant / proportional to risk"
 *   hands the decision back to the model, which is exactly what under-estimates
 *   its own process cost; concrete triggers replace it.
 * - the root cause is a CONDITIONAL REQUIREMENT, not a prohibition: stating
 *   "unconfirmed + how you will test it" is a legal, non-silent way to comply,
 *   so a guess is never dressed up as a confirmed cause.
 * - claims are limited to those that matter, so the block does not turn every
 *   sentence into an evidence ceremony.
 * - the destructive-operation gate exists because a real incident destroyed the
 *   only copy of data: an irreversible delete ran after a step that had failed
 *   SILENTLY, and the "validation" sat after the delete. The gate therefore
 *   states the failure-mode self-check as a question, and names who may lift the
 *   only-copy rule (evidence or the user — never the model's own confidence).
 * - adversarial review is excluded: that protocol needs a subagent and belongs
 *   to presets that own one.
 */
export const DEFAULT_ENGINEERING_RIGOR_TEXT = [
  'Working method',
  '',
  'Before changing behavior:',
  '- Establish a baseline: reproduce the reported behavior when you can. If you cannot, say so and name the evidence you do have.',
  '- State the observable success criteria. When there is no reproducible problem (new feature, refactor, docs), the success criteria are the baseline.',
  '',
  'Before you claim a fix works:',
  '- State either the root cause with its evidence, or that the cause is still unconfirmed and how you will test it.',
  '',
  'When you state a cause, a fix, or a conclusion that matters:',
  '- Separate what you observed from what you inferred, and say what evidence would overturn it.',
  '',
  'Before any destructive or irreversible operation (delete, overwrite, truncate, force-push, drop, recursive cleanup):',
  '- Treat it as high-risk by default, however routine it looks.',
  '- Do not destroy the only copy of anything — unless it has been established as no longer needed, or as recoverable from a version repository, another copy, or the user. "Established" means clear evidence or the user\'s word, not your own confidence. When unsure, treat it as the only copy.',
  '- A destructive step must be its own invocation, and the step it depends on must already be verified from a result you have read. Ask: if the step before this had silently done nothing, what would this destroy?',
  '- Validation has to come before the destructive step; a check after it is an autopsy, not a gate. Never let a command that fails silently be the last thing before one that cannot be undone.',
  '',
  'Before reporting a task complete:',
  '- State the checks you actually ran and what you observed.',
  '- State the acceptance criteria you did not verify, the cases you did not test, and the assumptions that could change the result.',
  '- Do not imply verification you did not perform.',
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
