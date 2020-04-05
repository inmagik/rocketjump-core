import { $TYPE_RJ_EXPORT, $TYPE_RJ_PARTIAL, $TYPE_RJ_OBJECT } from './internals'
import { mergeConfigs } from './utils'
import { isPartialRj } from './types'

export default function forgeRocketJump(rjImpl) {
  const pureRj = makeRjFn(rjImpl)
  // Global config of all rj except for Generated from Plugins
  const rjGlobals = {
    rjs: [],
    pluginsDefaults: {},
  }

  // Wrap pure rj and prepend global base rjs
  function rj(...partialRjsOrConfigs) {
    return pureRj(...rjGlobals.rjs, ...partialRjsOrConfigs)
  }

  rj.clearGlobalRjs = () => {
    rjGlobals.rjs = []
  }
  rj.setGlobalRjs = rjs => {
    rjGlobals.rjs = rjs
  }

  rj.clearPluginsDefault = () => {
    rjGlobals.pluginsDefaults = {}
  }
  rj.setPluginsDefault = pluginsDefaults => {
    rjGlobals.pluginsDefaults = pluginsDefaults
  }

  // Attach the RJ Implementation to rj constructor! Fuck YEAH!
  Object.defineProperty(rj, '__rjimplementation', { value: rjImpl })

  rj.plugin = makeRjPlugin(rjGlobals)
  rj.pure = pureRj

  return rj
}

function makeRjPlugin(rjGlobals) {
  function rjPlugin(
    createPartialRj,
    plugInConfigArg
  ) {
    let plugInConfig = null
    if (typeof plugInConfigArg === 'object' && plugInConfigArg !== null) {
      // Can't touch plugin config anymore
      plugInConfig = Object.freeze({ ...plugInConfigArg })
    }
    return function rjPluginBuilder(...args) {
      let partialRj
      if (
        arguments.length === 0 &&
        rjGlobals &&
        plugInConfig &&
        plugInConfig.name &&
        rjGlobals[plugInConfig.name]
      ) {
        // No args give use default global settings when got it
        partialRj = createPartialRj(...rjGlobals[plugInConfig.name])
      } else {
        partialRj = createPartialRj(...args)
      }
      partialRj.__plugins = new Set([plugInConfig, ...partialRj.__plugins])
      return partialRj
    }
  }
  return rjPlugin
}

// Forge a rocketjump from in da S T E L L
function makeRjFn(rjImpl) {
  // Here is where the magic starts the functional recursive rjs combining \*.*/
  function rj(...partialRjsOrConfigs) {
    // Grab a Set of plugins config in current rj Tree
    const plugIns = partialRjsOrConfigs.reduce((resultSet, a) => {
      if (isPartialRj(a)) {
        a.__plugins.forEach(plugin => resultSet.add(plugin))
      }
      return resultSet
    }, new Set())
    let partialConfig
    if (typeof rjImpl.makePartialConfig === 'function') {
      // Implement the partial config on an Rj
      partialConfig = rjImpl.makePartialConfig(partialRjsOrConfigs)
    } else {
      // Standard merge config implementation
      partialConfig = mergeConfigs(partialRjsOrConfigs)
    }

    // Make the partial rj
    function PartialRj(extraConfig, extendExportArg, runRjImpl = rjImpl) {
      // Take the extended exports seriusly only when came from rj
      let extendExport
      if (
        typeof extendExportArg === 'object' &&
        extendExportArg !== null &&
        extendExportArg.__rjtype === $TYPE_RJ_EXPORT
      ) {
        extendExport = extendExportArg
      }

      // true when rj(rj(), rj(), rj(), { })() the last rj of recursion is
      // evalutated
      const isLastRjInvocation = extendExport === undefined

      // Final configuration
      const finalConfig = mergeConfigs([partialConfig, extraConfig])

      const runConfig = runRjImpl.makeRunConfig(finalConfig)
      const recursionRjs = runRjImpl.makeRecursionRjs(
        partialRjsOrConfigs,
        extraConfig,
        isLastRjInvocation
      )

      // Make the continued export for combining
      let continuedExport
      if (!extendExport) {
        continuedExport = {}
        // Mark export as valid
        Object.defineProperty(continuedExport, '__rjtype', {
          value: $TYPE_RJ_EXPORT,
        })
      } else {
        continuedExport = extendExport
      }

      // Invoke all rjs and configs and merge returned exports
      // ... yeah a mindfuck but is coool. ..
      const finalExport = recursionRjs.reduce((combinedExport, rjOrConfig) => {
        if (typeof rjOrConfig === 'function') {
          // Is a partial rj jump it!
          return rjOrConfig(runConfig, combinedExport, runRjImpl)
        } else {
          // Is a config ... run config + jump config = export
          const newExport = runRjImpl.makeExport(
            runConfig,
            rjOrConfig,
            combinedExport,
            plugIns
          )
          // Mark export as valid
          Object.defineProperty(newExport, '__rjtype', {
            value: $TYPE_RJ_EXPORT,
          })
          return newExport
        }
      }, continuedExport)

      if (isLastRjInvocation) {
        // Mark as an Rj Object that can be runned into
        // rj-react
        // or mount on redux / saga
        const rjObject = runRjImpl.finalizeExport(
          finalExport,
          runConfig,
          finalConfig,
          plugIns,
        )
        Object.defineProperty(rjObject, '__rjtype', { value: $TYPE_RJ_OBJECT })
        // Ship the last config in rj chain
        Object.defineProperty(rjObject, '__rjconfig', { value: partialConfig })
        // Attach the RJ Implementation to rj object! Fuck YEAH!
        Object.defineProperty(rjObject, '__rjimplementation', { value: rjImpl })
        return rjObject
      } else {
        return finalExport
      }
    }

    // Create a rocketjump object at first invocation when is needed
    if (
      typeof rjImpl.shouldRocketJump === 'function' &&
      rjImpl.shouldRocketJump(partialRjsOrConfigs)
    ) {
      return PartialRj()
    }

    // Mark the partialRj
    Object.defineProperty(PartialRj, '__rjtype', { value: $TYPE_RJ_PARTIAL })

    Object.defineProperty(PartialRj, '__rjconfig', { value: partialConfig })

    // Attach the RJ Implementation to rj partial! Fuck YEAH!
    Object.defineProperty(PartialRj, '__rjimplementation', { value: rjImpl })

    // All plugins in the partial rj tree
    PartialRj.__plugins = plugIns

    return PartialRj
  }

  // Attach the RJ Implementation to rj constructor! Fuck YEAH!
  Object.defineProperty(rj, '__rjimplementation', { value: rjImpl })

  return rj
}
