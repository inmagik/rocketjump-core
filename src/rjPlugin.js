import invariant from './invariant'
import { $TYPE_RJ_INJECT_PLUGIN } from './internals'
import { mapValues, unionSet } from './utils'

function normalizeInjectConfig(injectConfig) {
  let plugInConfig = null
  let createPartialRj

  if (typeof injectConfig === 'function') {
    createPartialRj = injectConfig
  } else {
    const makeNoopPartial = (rj) => rj()
    createPartialRj = injectConfig?.createPartial ?? makeNoopPartial

    if (
      typeof injectConfig?.hookForge === 'object' &&
      injectConfig.hookForge !== null
    ) {
      // Can't touch plugin config anymore
      plugInConfig = Object.freeze({ ...injectConfig.hookForge })
    }
  }
  return { createPartialRj, plugInConfig }
}

export default function rjPlugin(injectConfig) {
  const { createPartialRj, plugInConfig } = normalizeInjectConfig(injectConfig)

  return function rjPluginBuilder(...args) {
    // PLUGIN
    function rjPluginInject(rj) {
      const partialRj = createPartialRj(rj, ...args)
      if (plugInConfig) {
        partialRj.__plugins = unionSet([plugInConfig], partialRj.__plugins)
      }
      return partialRj
    }
    Object.defineProperty(rjPluginInject, '__rjtype', {
      value: $TYPE_RJ_INJECT_PLUGIN,
    })
    return rjPluginInject
  }
}

rjPlugin.impl = function multiImplRjPlugin(injectByImplConfig) {
  invariant(
    typeof injectByImplConfig === 'object' && injectByImplConfig !== null,
    'Please provide an object with the implementation to follow'
  )

  const injectByImpl = mapValues(injectByImplConfig, normalizeInjectConfig)

  return function rjPluginBuilder(...args) {
    // PLUGIN
    function rjPluginInject(rj, rjImpl) {
      const injector = injectByImpl[rjImpl.name]

      invariant(
        injector !== undefined,
        'You use a plugin not compatible with your rj'
      )

      const { createPartialRj, plugInConfig } = injector
      const partialRj = createPartialRj(rj, ...args)
      if (plugInConfig) {
        partialRj.__plugins = unionSet([plugInConfig], partialRj.__plugins)
      }
      return partialRj
    }
    Object.defineProperty(rjPluginInject, '__rjtype', {
      value: $TYPE_RJ_INJECT_PLUGIN,
    })
    return rjPluginInject
  }
}
