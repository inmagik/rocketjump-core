// RJ Core interal types

// The curried config partial rj
// partialRj = rj(...)
export const $TYPE_RJ_PARTIAL = Symbol('rj~partial')

// The extended exports type of export objects
// extended by recursion:
// partialRj(runConfig, extendedExport, impl)
export const $TYPE_RJ_EXPORT = Symbol('rj~export')
