import { $TYPE_RJ_PARTIAL, $TYPE_RJ_OBJECT } from './internals'

export function isPartialRj(partialRj) {
  if (typeof partialRj === 'function') {
    return partialRj.__rjtype === $TYPE_RJ_PARTIAL
  }
  return false
}

export function isObjectRj(objRj) {
  if (objRj !== null && typeof objRj === 'object') {
    return objRj.__rjtype === $TYPE_RJ_OBJECT
  }
  return false
}
