import { $TYPE_RJ_PARTIAL } from './internals'

export function isPartialRj(partialRj) {
  if (typeof partialRj === 'function') {
    return partialRj.__rjtype === $TYPE_RJ_PARTIAL
  }
  return false
}
