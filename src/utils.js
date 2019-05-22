export const arrayze = a => (Array.isArray(a) ? a : [a])

// Simple merge and skip when function....
export function mergeConfigs(rjsOrConfigs) {
  return rjsOrConfigs.reduce((finalConfig, config) => {
    if (typeof config === 'function') {
      return finalConfig
    }
    return {
      ...finalConfig,
      ...config,
    }
  }, {})
}

// Thanks lodash
export function mapValues(object, iteratee) {
  object = Object(object)
  const result = {}

  Object.keys(object).forEach(key => {
    result[key] = iteratee(object[key], key, object)
  })
  return result
}

// Proxy an object of fucntions
export const proxyObject = (obj, proxy) => {
  if (typeof proxy === 'function') {
    return {
      ...obj,
      ...proxy(obj),
    }
  }
  if (typeof proxy === 'object' && proxy !== null) {
    return {
      ...obj,
      ...mapValues(proxy, proxyFn => proxyFn(obj)),
    }
  }
  return obj
}

// Compose functions
export const kompose = (...fns) => x => fns.reduce((v, f) => f(v), x)

export const proxyReducer = (reducer, proxyFn) => {
  if (typeof proxyFn === 'function') {
    return proxyFn(reducer)
  }
  return reducer
}

export const mergeActionPatterns = (...patterns) =>
  patterns.reduce((finalPattern, pattern) => {
    return [...finalPattern, ...arrayze(pattern)]
  }, [])

export const matchActionPattern = (action, pattern) =>
  pattern === '*' || arrayze(pattern).indexOf(action.type) !== -1

export const composeReducers = (...reducers) => (prevState, action) =>
  reducers.reduce((nextState, reducer) => {
    if (typeof prevState === 'undefined') {
      // When le fukin prevState is undefined merge reducers
      // initial states... Cekka
      return { ...nextState, ...reducer(undefined, action) }
    } else {
      return reducer(nextState, action)
    }
  }, prevState)
