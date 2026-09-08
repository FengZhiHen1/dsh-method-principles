// Shared test double for the DSH services this plugin touches. Mirrors Cordis
// effect semantics: the effect callback's returned function is the disposer.

/**
 * @param {object} [options]
 * @param {string | undefined} [options.presetId] value composedPreset() returns.
 * @param {string} [options.agentId] value of `context.agent.id` when a context is built.
 * @param {number} [options.depth] delegation depth reported on the agent.
 * @param {boolean} [options.withPresets] include the agentPresets service.
 */
export function makeCtx({ presetId, agentId = 'session-test', depth = 0, withPresets = true } = {}) {
  const sections = []
  const disposers = []
  const ctx = {
    effect: (fn) => {
      const result = fn()
      if (typeof result === 'function') disposers.push(result)
    },
    systemPrompt: {
      section: (section) => {
        sections.push(section)
        return () => {
          const index = sections.indexOf(section)
          if (index >= 0) sections.splice(index, 1)
        }
      },
    },
  }
  if (withPresets) {
    ctx.agentPresets = {
      composedPreset: () => presetId,
    }
  }
  return {
    ctx,
    sections,
    dispose: () => {
      while (disposers.length > 0) disposers.pop()()
    },
    /** Build an assembly context for this agent. */
    agentContext: () => ({
      agent: {
        id: agentId,
        ctx: {},
        session: { header: { delegationDepth: depth } },
        options: {},
      },
    }),
  }
}
