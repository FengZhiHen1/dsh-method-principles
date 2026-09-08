// Public plugin face. All wiring lives in src/adapter/host.js so the package
// entry stays a thin forwarder (repository convention: adapter owns the DSH
// surface, index.js owns nothing). The section constants and the pure routing
// helpers are re-exported for tests and for users composing their own patches.
export {
  apply,
  Config,
  DEFAULT_ENGINEERING_RIGOR_TEXT,
  DEFAULT_PRINCIPLES_TEXT,
  DEFAULT_ROUTES,
  inject,
  name,
  SECTION_NAME,
  SECTION_ORDER,
} from './src/adapter/host.js'

export { depthOf, resolveRouteText, routeMatches } from './src/core/routes.js'
