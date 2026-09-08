// Verification-only probe #2: does a plugin loaded through a --patch overlay
// see the agentPresets service at all (inject vs ctx.get), and what does the
// session header record for the joined preset?
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const REPORT = 'E:/Project/DSH_Plugins/plugins/dsh-method-principles/verify/mp-route-report.txt'

export const name = 'mp-route-probe2'
export const inject = ['systemPrompt', 'agentPresets']

function log(line) {
  appendFileSync(REPORT, `${new Date().toISOString()} probe2 ${line}\n`)
}

function depthOf(agent) {
  return Math.max(
    agent?.session?.header?.delegationDepth ?? 0,
    agent?.options?.subagentDepth ?? 0,
  )
}

export function apply(ctx) {
  mkdirSync(dirname(REPORT), { recursive: true })
  const injected = ctx.agentPresets
  const viaGet = ctx.get('agentPresets')
  log(`registered inject=${injected !== undefined} get=${viaGet !== undefined} same=${injected === viaGet}`)
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'probe:route2',
    order: 261,
    text: (context) => {
      const agent = context?.agent
      const service = injected ?? viaGet
      let live = 'no-service'
      if (service !== undefined && agent !== undefined) {
        try {
          live = String(service.composedPreset(agent.ctx))
        } catch (error) {
          live = `throw:${String(error).slice(0, 50)}`
        }
      }
      log([
        `agent=${agent?.id ?? 'none'}`,
        `headerPreset=${agent?.session?.header?.agentPreset ?? 'none'}`,
        `depth=${agent === undefined ? 'n/a' : depthOf(agent)}`,
        `composedPreset=${live}`,
      ].join(' '))
      return ''
    },
  }), 'mp-route-probe2.section()')
}
