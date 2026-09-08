// Verification-only overlay plugin (never shipped): listens to the system
// prompt assembly waterfall and writes one report line per assembly to
// verify/mp-assembly-report.txt, so the test-profile gate can prove the
// dsh-method-principles section really lands in the assembled prompt.
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const REPORT = 'E:/Project/DSH_Plugins/plugins/dsh-method-principles/verify/mp-assembly-report.txt'
const SECTION = 'deployment:method-principles'

export const name = 'mp-assembly-verify'
export const inject = ['systemPrompt']

export function apply(ctx) {
  mkdirSync(dirname(REPORT), { recursive: true })
  ctx.on('system-prompt/assemble', async (assembly, _context, next) => {
    const names = assembly.sections.map((section) => section.name)
    const index = names.indexOf(SECTION)
    const persona = names.indexOf('deployment:persona')
    const plan = names.indexOf('plan:policy')
    const text = assembly.sections.find((section) => section.name === SECTION)?.text ?? ''
    const lines = [
      `sections=${names.length}`,
      `has=${index >= 0}`,
      `index=${index}`,
      `personaIndex=${persona}`,
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
