// RJ Core interal types

// The unique rj() constructor!
export const $TYPE_RJ = Symbol('rj')

// The curried config partial rj
// partialRj = rj(...)
export const $TYPE_RJ_PARTIAL = Symbol('rj~partial')

// The extended exports type of export objects
// extended by recursion:
// partialRj(runConfig, extendedExport, impl)
export const $TYPE_RJ_EXPORT = Symbol('rj~export')

// The final rj runnable object
// rj(...)() or rj(... launched ->)
export const $TYPE_RJ_OBJECT = Symbol('rj~object')

// Inject Plugin as Partial of current rj
export const $TYPE_RJ_INJECT_PLUGIN = Symbol('rj~injectPlugIn')

export function markAsRj(baseFn, rjImpl) {
  Object.defineProperty(baseFn, '__rjtype', {
    value: $TYPE_RJ,
  })
  Object.defineProperty(baseFn, '__rjimplementation', {
    value: rjImpl.mark,
  })
}

export function markAsPartialRj(baseFn, rjImpl, config, plugIns = new Set()) {
  Object.defineProperty(baseFn, '__rjtype', {
    value: $TYPE_RJ_PARTIAL,
  })
  Object.defineProperty(baseFn, '__rjimplementation', {
    value: rjImpl.mark,
  })
  Object.defineProperty(baseFn, '__rjconfig', { value: config })
  baseFn.__plugins = plugIns
}

export function markAsRjObject(baseFn, rjImpl, config) {
  Object.defineProperty(baseFn, '__rjtype', {
    value: $TYPE_RJ_OBJECT,
  })
  Object.defineProperty(baseFn, '__rjimplementation', {
    value: rjImpl.mark,
  })
  Object.defineProperty(baseFn, '__rjconfig', { value: config })
}
