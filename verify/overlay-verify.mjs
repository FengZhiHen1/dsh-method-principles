// Verification-only overlay plugin (never shipped): listens to the system
// prompt assembly waterfall and writes one report line per assembly to
// verify/mp-assembly-report.txt, so the test-profile gate can prove the
// dsh-method-principles section really lands in the assembled prompt.
//
// ⚠️ Anchor names are BASELINE-SPECIFIC. On `dsh-v0.1.2-rc.1` the deployment
// persona was ONE section named `deployment:persona`; from the v0.1.7 baseline
// it was SPLIT into `deployment:persona-prefix` (order 0) and
// `deployment:persona-suffix` (order 10200). Probing the old name on a new
// runtime yields `personaIndex=-1` and `afterPersona=n/a` — the gate would
// still print a report, but its position assertion would silently stop
// meaning anything. So this probe checks BOTH spellings and reports which one
// the runtime actually carries.
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const REPORT = 'E:/Project/DSH_Plugins/plugins/dsh-method-principles/verify/mp-assembly-report.txt'
const SECTION = 'deployment:method-principles'
/** Persona anchor per baseline: pre-v0.1.7 single section, then the split pair. */
const PERSONA_PREFIX = 'deployment:persona-prefix'
const PERSONA_SUFFIX = 'deployment:persona-suffix'
const PERSONA_LEGACY = 'deployment:persona'

export const name = 'mp-assembly-verify'
export const inject = ['systemPrompt']

export function apply(ctx) {
  mkdirSync(dirname(REPORT), { recursive: true })
  ctx.on('system-prompt/assemble', async (assembly, _context, next) => {
    const names = assembly.sections.map((section) => section.name)
    const index = names.indexOf(SECTION)
    const plan = names.indexOf('plan:policy')
    // Persona anchor: prefer the split pair, fall back to the legacy section.
    const prefix = names.indexOf(PERSONA_PREFIX)
    const suffix = names.indexOf(PERSONA_SUFFIX)
    const legacy = names.indexOf(PERSONA_LEGACY)
    const persona = prefix >= 0 ? prefix : legacy
    const anchor = prefix >= 0 ? PERSONA_PREFIX : legacy >= 0 ? PERSONA_LEGACY : 'none'
    const text = assembly.sections.find((section) => section.name === SECTION)?.text ?? ''
    const lines = [
      `sections=${names.length}`,
      `has=${index >= 0}`,
      `index=${index}`,
      `personaAnchor=${anchor}`,
      `personaIndex=${persona}`,
      `personaSuffixIndex=${suffix}`,
      `planIndex=${plan}`,
      `afterPersona=${persona >= 0 ? index > persona : 'n/a'}`,
      `beforePlan=${plan >= 0 ? index < plan : 'n/a'}`,
      `firstLine=${JSON.stringify(text.split('\n')[0])}`,
      `lines=${text.split('\n').length}`,
    ]
    appendFileSync(REPORT, `${new Date().toISOString()} ${lines.join(' ')}\n`)
    return next()
  })
  appendFileSync(REPORT, `${new Date().toISOString()} listener-registered\n`)
}
