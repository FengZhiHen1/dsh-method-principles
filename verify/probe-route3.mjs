// Verification-only probe #3: proves the ROUTED text in a live assembly — the
// report records whether the engineering block reached the agent being
// assembled, plus the agent's depth and joined preset.
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const REPORT = 'E:/Project/DSH_Plugins/plugins/dsh-method-principles/verify/mp-route3-report.txt'
const SECTION = 'deployment:method-principles'
const MARKER = 'Before reporting a task complete:'

export const name = 'mp-route-probe3'
export const inject = ['systemPrompt', 'agentPresets']

export function apply(ctx) {
  mkdirSync(dirname(REPORT), { recursive: true })
  ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    const agent = context?.agent
    const text = assembly.sections.find(section => section.name === SECTION)?.text ?? ''
    const preset = agent === undefined ? 'n/a' : String(ctx.agentPresets.composedPreset(agent.ctx))
    const depth = Math.max(
      agent?.session?.header?.delegationDepth ?? 0,
      agent?.options?.subagentDepth ?? 0,
    )
    appendFileSync(REPORT, [
      new Date().toISOString(),
      `agent=${agent?.id ?? 'none'}`,
      `preset=${preset}`,
      `depth=${depth}`,
      `hasSection=${text.length > 0}`,
      `hasEngineering=${text.includes(MARKER)}`,
      `lines=${text.split('\n').length}`,
    ].join(' ') + '\n')
    return next()
  })
  appendFileSync(REPORT, `${new Date().toISOString()} probe3-registered\n`)
}
