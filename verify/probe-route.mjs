// Verification-only probe (never shipped): proves that at assembly time the
// section text function can read the agent, its delegation depth, and the
// preset the agent actually joined via agentPresets.composedPreset(agent.ctx).
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const REPORT = 'E:/Project/DSH_Plugins/plugins/dsh-method-principles/verify/mp-route-report.txt'

export const name = 'mp-route-probe'
export const inject = ['systemPrompt']

function depthOf(agent) {
  return Math.max(
    agent?.session?.header?.delegationDepth ?? 0,
    agent?.options?.subagentDepth ?? 0,
  )
}

export function apply(ctx) {
  mkdirSync(dirname(REPORT), { recursive: true })
  const agentPresets = ctx.get('agentPresets')
  appendFileSync(REPORT, `${new Date().toISOString()} probe-registered agentPresets=${agentPresets !== undefined}\n`)
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'probe:route',
    order: 260,
    text: (context) => {
      const agent = context?.agent
      let preset = 'n/a'
      try {
        preset = agentPresets === undefined || agent === undefined
          ? 'no-service'
          : String(agentPresets.composedPreset(agent.ctx))
      } catch (error) {
        preset = `throw:${String(error).slice(0, 60)}`
      }
      const line = [
        `agent=${agent?.id ?? 'none'}`,
        `hasCtx=${agent?.ctx !== undefined}`,
        `depth=${agent === undefined ? 'n/a' : depthOf(agent)}`,
        `preset=${preset}`,
        `scopeKind=${context?.scope === undefined ? 'none' : 'set'}`,
      ].join(' ')
      appendFileSync(REPORT, `${new Date().toISOString()} ${line}\n`)
      return ''
    },
  }), 'mp-route-probe.section()')
}
