import { $TYPE_RJ_EXPORT, $TYPE_RJ_PARTIAL, $TYPE_RJ_OBJECT } from './internals'
import { mergeConfigs } from './utils'
import { isPartialRj } from './types'

function unionSet(setA, setB) {
  let _union = new Set(setA)
  setB.forEach(elem => _union.add(elem))
  return _union
}

const DefaultRjImplementation = {
  // Standard merge config implementation
  makePartialConfig: (partialRjsOrConfigs, plugIns) =>
    mergeConfigs(partialRjsOrConfigs),

  // Should be implemented (if you need a run config)
  makeRunConfig: (finalConfig, plugIns) => null,

  makeRecursionRjs: (
    partialRjsOrConfigs,
    extraConfig,
    isLastRjInvocation,
    plugIns
  ) => partialRjsOrConfigs,

  makeExport: (runConfig, rjOrConfig, combinedExport, plugIns) => {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        'You should implement `makeExport` in order to forge a rocketjump!'
      )
    }
    throw new Error()
  },

  finalizeExport: (finalExport, runConfig, finalConfig, plugIns) => {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        'You should implement `finalizeExport` in order to forge a rocketjump!'
      )
    }
    throw new Error()
  },

  // Default 2X invocation rj()() -> RjObject you can hack this here hehehe
  shouldRocketJump: (partialRjsOrConfigs, plugIns) => false,

  // When true remove all global side effect prone shit eehhehe joke
  // if U use Y head Y can use them i implement them for how?
  pure: false,
}

// Forge a rocketjump in da S T E L L
export default function forgeRocketJump(rjImplArg) {
  const rjImpl = Object.freeze({
    ...DefaultRjImplementation,
    ...rjImplArg,
  })
  const pureRj = makeRj(rjImpl)

  // Long time a ago i belive in a world without side effects ...
  // this flag bring back this world Default: False
  if (rjImpl.pure) {
    pureRj.plugin = makeRjPlugin()
    return pureRj
  }

  // Global config of all rj except for Generated from Plugins
  const rjGlobals = {
    rjs: [],
    pluginsDefaults: {},
  }

  // Wrap pure rj and prepend global base rjs
  const rj = (...partialRjsOrConfigs) => {
    return pureRj(...rjGlobals.rjs, ...partialRjsOrConfigs)
  }

  rj.clearGlobalRjs = () => {
    rjGlobals.rjs = []
  }
  rj.setGlobalRjs = (...rjs) => {
    rjGlobals.rjs = rjs
  }

  rj.clearPluginsDefaults = () => {
    rjGlobals.pluginsDefaults = {}
  }
  rj.setPluginsDefaults = pluginsDefaults => {
    rjGlobals.pluginsDefaults = pluginsDefaults
  }

  // Attach the RJ Implementation to rj constructor! Fuck YEAH!
  Object.defineProperty(rj, '__rjimplementation', { value: rjImpl })

  rj.plugin = makeRjPlugin(rjGlobals)
  rj.pure = pureRj

  // Build An Rj With defaults ehehhe
  rj.build = (...rjs) => (...callRjs) => pureRj(...rjs, ...callRjs)

  // Namespaces!!!
  rj.ns = {}

  rj.addNamespace = (name, ...rjs) => {
    rj.ns[name] = (...callRjs) => pureRj(...rjs, ...callRjs)
  }
  rj.removeNamespace = name => {
    delete rj.ns[name]
  }
  rj.clearNamespaces = name => {
    rj.ns = {}
  }

  return rj
}

function makeRjPlugin(rjGlobals) {
  function rjPlugin(createPartialRj, plugInConfigArg) {
    let plugInConfig = null
    if (typeof plugInConfigArg === 'object' && plugInConfigArg !== null) {
      // Can't touch plugin config anymore
      plugInConfig = Object.freeze({ ...plugInConfigArg })
    }
    return function rjPluginBuilder(...args) {
      let partialRj
      if (
        rjGlobals &&
        arguments.length === 0 &&
        plugInConfig &&
        plugInConfig.name &&
        rjGlobals.pluginsDefaults[plugInConfig.name]
      ) {
        // No args give use default global settings when got it
        partialRj = createPartialRj(
          ...rjGlobals.pluginsDefaults[plugInConfig.name]
        )
      } else {
        partialRj = createPartialRj(...args)
      }
      partialRj.__plugins = unionSet([plugInConfig], partialRj.__plugins)
      return partialRj
    }
  }
  return rjPlugin
}

// Make the pure rj function using give stable implementation
function makeRj(rjImpl) {
  // Here is where the magic starts the functional recursive rjs combining \*.*/
  function rj(...partialRjsOrConfigs) {
    // Grab a Set of plugins config in current rj Tree
    // rj( plugiInA(), plugInB()  )
    const plugInsInTree = partialRjsOrConfigs.reduce((resultSet, a) => {
      if (isPartialRj(a)) {
        a.__plugins.forEach(plugin => resultSet.add(plugin))
      }
      return resultSet
    }, new Set(rjImpl.forgedPlugins))

    // Derive the partial config from partial configuration
    // (default implementation skip other partialRjs)
    const partialConfig = rjImpl.makePartialConfig(
      partialRjsOrConfigs,
      plugInsInTree
    )

    // Make the partial rj
    function PartialRj(
      extraConfig,
      extendExportArg,
      runRjImpl = rjImpl,
      /*
        Take this rj tree:
        rj(
          pluginA(),
          pluginB(),
          *
          |   All plugins in parent and siblisings
          |
          rj(
            pluginA(),
            pluginX(),
            *
            |
            |
            myRj() <---- "Where Our Rj is defined"
          )
        ) -> Set(pluginA, pluginB, pluginX)
      )
      */
      plugInsParent = new Set()
    ) {
      // Take the extended exports seriusly only when came from rj
      let extendExport
      if (
        typeof extendExportArg === 'object' &&
        extendExportArg !== null &&
        extendExportArg.__rjtype === $TYPE_RJ_EXPORT
      ) {
        extendExport = extendExportArg
      }

      const plugIns = unionSet(plugInsParent, plugInsInTree)

      // true when rj(rj(), rj(), rj(), { })() the last rj of recursion is
      // evalutated
      const isLastRjInvocation = extendExport === undefined

      // Final configuration
      const finalConfig = mergeConfigs([partialConfig, extraConfig])

      const runConfig = runRjImpl.makeRunConfig(finalConfig, plugIns)
      const recursionRjs = runRjImpl.makeRecursionRjs(
        partialRjsOrConfigs,
        extraConfig,
        isLastRjInvocation,
        plugIns
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
          return rjOrConfig(runConfig, combinedExport, runRjImpl, plugIns)
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
          plugIns
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
    if (rjImpl.shouldRocketJump(partialRjsOrConfigs, plugInsInTree)) {
      return PartialRj()
    }

    // Mark the partialRj
    Object.defineProperty(PartialRj, '__rjtype', { value: $TYPE_RJ_PARTIAL })

    Object.defineProperty(PartialRj, '__rjconfig', { value: partialConfig })

    // Attach the RJ Implementation to rj partial! Fuck YEAH!
    Object.defineProperty(PartialRj, '__rjimplementation', { value: rjImpl })

    // All plugins in the partial rj tree
    PartialRj.__plugins = plugInsInTree

    return PartialRj
  }

  // Attach the RJ Implementation to rj constructor! Fuck YEAH!
  Object.defineProperty(rj, '__rjimplementation', { value: rjImpl })

  return rj
}
