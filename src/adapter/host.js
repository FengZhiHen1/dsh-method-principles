// host — DSH adapter entry: the Config schema, the distilled default text, and
// the single system-prompt section registration.
//
// Boundary: this plugin contributes exactly ONE global prompt section and
// nothing else — no service, no tool, no dynamic context, no variable. The
// section is registered through ctx.systemPrompt.section() inside ctx.effect(),
// so the fiber's dispose path removes it automatically. Section name and order
// are deliberate: `deployment:method-principles` never collides with the
// persona slot, and order 200 places the block after the persona and before
// plan policy / tool guidance. Reference: docs/technical-details/提示词段机制.md.

import z from '@deepseek-ai/schemastery'

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
 * Plugin config. The loader validates this schema BEFORE apply and fills in
 * defaults, so apply always receives a complete config; an invalid value fails
 * the mount with the loader's actionable ValidationError. `text` is the only
 * field: replacing it swaps the whole block, and an empty string removes the
 * section from the assembled prompt.
 */
export const Config = z.object({
  text: z.string().default(DEFAULT_PRINCIPLES_TEXT),
})

export const name = 'dsh-method-principles'

/** Hard dependency: apply registers into this service, so wait for it. */
export const inject = ['systemPrompt']

/**
 * Register the section. An empty text registers nothing — the assembled prompt
 * drops empty sections anyway, and skipping the registration keeps the registry
 * honest about what this plugin contributes.
 * @param ctx - the plugin's Cordis context.
 * @param config - validated config supplied by the loader.
 */
export function apply(ctx, config) {
  const text = config?.text ?? DEFAULT_PRINCIPLES_TEXT
  if (text.length === 0) return
  ctx.effect(
    () => ctx.systemPrompt.section({ name: SECTION_NAME, order: SECTION_ORDER, text }),
    'dsh-method-principles.section()',
  )
}
