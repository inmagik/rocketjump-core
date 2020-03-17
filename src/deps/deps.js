// ~D3BpS~
import { get } from '../utils'
import {
  WithMetaDeBp,
  WithMetaOnMountDeBp,
  WithAlwaysMeta,
  getDepValue,
  RunDeBp,
  NotRunDeBp,
} from './core'

// Add meta when arg change
export const withMeta = (a, meta) => WithMetaDeBp(a, meta)

// Add meta only on mount
export const withMetaOnMount = meta => WithMetaOnMountDeBp(meta)

// Add always meta
export const withAlwaysMeta = meta => WithAlwaysMeta(meta)

// Maybe run based on value
export const maybe = a => (getDepValue(a) ? RunDeBp(a) : NotRunDeBp(a))

// Make all deps a maybe value!
export const allMaybe = (...args) => args.map(maybe)

// maybe if value is null
export const maybeNull = a =>
  getDepValue(a) === null ? NotRunDeBp(a) : RunDeBp(a)

// Make all deps maybe null
export const allMaybeNull = (...args) => args.map(maybeNull)

// Value + get object path or maybe
export const maybeGet = (a, path) => {
  const obj = getDepValue(a)
  if (obj) {
    return RunDeBp(get(obj, path))
  }
  return NotRunDeBp(a)
}
