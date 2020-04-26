import { $TYPE_RJ_PARTIAL, $TYPE_RJ_OBJECT, $TYPE_RJ } from './internals'

export function isRj(rj) {
  return typeof rj === 'function' && rj.__rjtype === $TYPE_RJ
}

export function isPartialRj(partialRj, rj) {
  if (typeof partialRj === 'function') {
    if (partialRj.__rjtype !== $TYPE_RJ_PARTIAL) {
      return false
    }
    // When a rj is given check for same rj implementation!
    if (typeof rj === 'function') {
      return rj.__rjimplementation === partialRj.__rjimplementation
    } else {
      return true
    }
  }
  return false
}

export function isObjectRj(objRj, rj) {
  if (objRj !== null && typeof objRj === 'object') {
    if (objRj.__rjtype !== $TYPE_RJ_OBJECT) {
      return false
    }
    // When a rj is given check for same rj implementation!
    if (typeof rj === 'function') {
      return rj.__rjimplementation === objRj.__rjimplementation
    } else {
      return true
    }
  }
  return false
}
