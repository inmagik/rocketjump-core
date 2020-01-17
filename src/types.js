import { $TYPE_RJ_PARTIAL, $TYPE_RJ_OBJECT } from './internals'

export function isPartialRj(partialRj, rj) {
  if (typeof partialRj === 'function') {
    if (partialRj.__rjtype !== $TYPE_RJ_PARTIAL) {
      return false
    }
    // When a rj is given check for same rj family!
    if (typeof rj === 'function') {
      return rj.__rjfamily === partialRj.__rjfamily
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
    // When a rj is given check for same rj family!
    if (typeof rj === 'function') {
      return rj.__rjfamily === objRj.__rjfamily
    } else {
      return true
    }
  }
  return false
}
