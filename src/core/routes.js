// Route resolution — pure domain logic (no DSH imports, runs under bare node).
//
// The plugin ships ONE global section whose text is decided per assembly: this
// module answers "what text does an agent with this preset and delegation depth
// get?". The adapter owns extracting the preset id and depth from DSH objects;
// this module owns matching, ordering, and the subagent exclusion.
//
// Contract:
// - routes are evaluated in order; the FIRST route whose `presets` contains the
//   agent's preset wins (no merging, no fallthrough to a later route).
// - `mainAgentOnly: true` (the default) suppresses the route for any agent whose
//   delegation depth is greater than zero — i.e. subagents never inherit it.
// - an agent with no resolvable preset, or with no matching route, gets '' and
//   the section disappears from that agent's prompt.

/**
 * @typedef {object} Route
 * @property {string} [id] route label, for config readability only.
 * @property {readonly string[]} presets agent-preset ids this route applies to.
 * @property {string} text the prompt text for matching agents.
 * @property {boolean} [mainAgentOnly] default true; false lets subagents inherit.
 */

/** What the adapter can observe about the agent being assembled. */
export const UNKNOWN_AGENT = Object.freeze({ presetId: undefined, depth: 0 })

/**
 * Decide whether one route applies to one agent.
 * @param {Route} route - the candidate route.
 * @param {{presetId: string | undefined, depth: number}} agent - observed facts.
 * @returns {boolean} whether this route supplies the agent's text.
 */
export function routeMatches(route, agent) {
  if (agent.presetId === undefined) return false
  if (!Array.isArray(route.presets) || !route.presets.includes(agent.presetId)) return false
  if (route.mainAgentOnly !== false && agent.depth > 0) return false
  return true
}

/**
 * Resolve the section text for one assembly.
 * @param {readonly Route[] | undefined} routes - configured routes, in order.
 * @param {{presetId: string | undefined, depth: number}} agent - observed facts.
 * @returns {string} the matching route's text, or '' when nothing matches.
 */
export function resolveRouteText(routes, agent) {
  if (!Array.isArray(routes)) return ''
  for (const route of routes) {
    if (routeMatches(route, agent)) return route.text ?? ''
  }
  return ''
}

/**
 * Read the delegation depth from a DSH agent, defensively: the persisted
 * session header is authoritative and the runtime option may only deepen it.
 * @param {unknown} agent - the agent from the assembly context, when present.
 * @returns {number} a non-negative depth; 0 when nothing is readable.
 */
export function depthOf(agent) {
  const header = agent?.session?.header?.delegationDepth
  const runtime = agent?.options?.subagentDepth
  const values = [header, runtime].filter(value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
  return values.length === 0 ? 0 : Math.max(...values)
}
