import blamer from '../blamer.macro'
import { $TYPE_RJ_EXPORT, $TYPE_RJ_PARTIAL, $TYPE_RJ_OBJECT } from './internals'
import { mergeConfigs } from './utils'
import { isPartialRj } from './types'

function unionSet(setA, setB) {
  let _union = new Set(setA)
  setB.forEach((elem) => _union.add(elem))
  return _union
}

const DefaultRjImplementation = {
  mark: null, // A Symbol to identify implementation!

  // Standard merge config implementation
  makePartialConfig: (partialRjsOrConfigs, plugIns) =>
    mergeConfigs(partialRjsOrConfigs),

  // Default 2X invocation rj()() -> RjObject you can hack this here hehehe
  shouldRocketJump: (partialRjsOrConfigs, plugIns) => false,

  // Should be implemented (if you need a run config)
  makeRunConfig: (finalConfig, plugIns) => null,

  makeRecursionRjs: (
    partialRjsOrConfigs,
    extraConfig,
    isLastRjInvocation,
    plugIns
  ) => partialRjsOrConfigs,

  makeExport: (runConfig, rjOrConfig, combinedExport, plugIns) => {
    blamer(
      '[rj-core-forge]',
      'You should implement `makeExport` in order to forge a rocketjump!'
    )
  },

  finalizeExport: (finalExport, runConfig, finalConfig, plugIns) => {
    blamer(
      '[rj-core-forge]',
      'You should implement `finalizeExport` in order to forge a rocketjump!'
    )
  },

  hackRjObject: (rjObject) => rjObject,

  // Plugins in the core implementation
  forgedPlugins: [],

  // When true remove all global side effect prone shit eehhehe joke
  // if U use Y head Y can use them i implement them for how?
  enableGlobals: false,
}

function noopPartialRj(rjImpl, config = {}) {
  const TheNoopPartialRj = (runConfig, combinedExport, plugIns) =>
    combinedExport
  Object.defineProperty(TheNoopPartialRj, '__rjtype', {
    value: $TYPE_RJ_PARTIAL,
  })
  Object.defineProperty(TheNoopPartialRj, '__rjimplementation', {
    value: rjImpl.mark,
  })
  Object.defineProperty(TheNoopPartialRj, '__rjconfig', { value: config })
  TheNoopPartialRj.__plugins = new Set()
  return TheNoopPartialRj
}

// Forge a rocketjump in da S T E L L
export default function forgeRocketJump(rjImplArg) {
  const rjImpl = Object.freeze({
    ...DefaultRjImplementation,
    ...rjImplArg,
  })

  if (process.env.NODE_ENV === 'production') {
    // NOTE avoid typeof symbol in prod cause can't be polyfill
    if (!rjImpl.mark) {
      throw new Error('[rj-core-forge]')
    }
  } else {
    if (typeof rjImpl.mark !== 'symbol') {
      throw new Error(
        'You should have an unqie across the entir world super cool `make` Symbol.'
      )
    }
  }

  const pureRj = makeRj(rjImpl)

  if (!rjImpl.enableGlobals) {
    // Long time a ago i belive in a world without side effects ...

    // function rj(...args) {

    // }

    pureRj.plugin = makeRjPlugin(rjImpl)
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
  rj.setPluginsDefaults = (pluginsDefaults) => {
    rjGlobals.pluginsDefaults = pluginsDefaults
  }

  // Attach the RJ Implementation to rj constructor! Fuck YEAH!
  Object.defineProperty(rj, '__rjimplementation', { value: rjImpl.mark })

  rj.plugin = makeRjPlugin(rjImpl, rjGlobals)
  rj.pure = pureRj

  // Build An Rj With defaults ehehhe
  rj.build = (...rjs) => (...callRjs) => pureRj(...rjs, ...callRjs)

  // Namespaces!!!
  rj.ns = {}

  rj.addNamespace = (name, ...rjs) => {
    rj.ns[name] = (...callRjs) => pureRj(...rjs, ...callRjs)
  }
  rj.removeNamespace = (name) => {
    delete rj.ns[name]
  }
  rj.clearNamespaces = () => {
    rj.ns = {}
  }

  return rj
}

function makeRjPlugin(rjImpl, rjGlobals) {
  function rjPlugin(plugInConfigArg, createPartialRjArg) {
    let plugInConfig = null
    if (typeof plugInConfigArg === 'object' && plugInConfigArg !== null) {
      // Can't touch plugin config anymore
      plugInConfig = Object.freeze({ ...plugInConfigArg })
    }

    let createPartialRj
    if (typeof createPartialRjArg === 'function') {
      createPartialRj = createPartialRjArg
    } else {
      createPartialRj = () => noopPartialRj(rjImpl)
    }

    return function rjPluginBuilder(...args) {
      let partialRj
      if (
        arguments.length === 0 &&
        plugInConfig?.name &&
        rjGlobals?.pluginsDefaults?.[plugInConfig.name]
      ) {
        // No args give use default global settings when got it
        partialRj = createPartialRj(
          ...rjGlobals.pluginsDefaults[plugInConfig.name]
        )
      } else {
        partialRj = createPartialRj(...args)
      }

      if (
        plugInConfig === null ||
        // When the plug in config has only "name" as key avoid
        // Set them into the plug-in chain
        (plugInConfig.name && Object.keys(plugInConfig).length === 1)
      ) {
        partialRj.__plugins = new Set()
      } else {
        partialRj.__plugins = unionSet([plugInConfig], partialRj.__plugins)
      }
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
        a.__plugins.forEach((plugin) => resultSet.add(plugin))
      }
      return resultSet
    }, new Set(rjImpl.forgedPlugins))

    // Derive the partial config from partial configuration
    // (default implementation skip other partialRjs)
    const partialConfig = Object.freeze(
      rjImpl.makePartialConfig(partialRjsOrConfigs, plugInsInTree)
    )

    // Make the partial rj
    function PartialRj(
      extraConfig,
      extendExportArg,
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
      plugInsParentArg
    ) {
      // Take the extended exports seriusly only when came from rj
      let extendExport
      let plugInsParent
      if (
        typeof extendExportArg === 'object' &&
        extendExportArg !== null &&
        extendExportArg.__rjtype === $TYPE_RJ_EXPORT
      ) {
        extendExport = extendExportArg
        plugInsParent = plugInsParentArg
      }

      const plugIns = unionSet(plugInsParent, plugInsInTree)

      // true when rj(rj(), rj(), rj(), { })() the last rj of recursion is
      // evalutated
      const isLastRjInvocation = extendExport === undefined

      // Final configuration
      const finalConfig = mergeConfigs([partialConfig, extraConfig])

      const runConfig = rjImpl.makeRunConfig(finalConfig, plugIns)
      const recursionRjs = rjImpl.makeRecursionRjs(
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
          return rjOrConfig(runConfig, combinedExport, plugIns)
        } else {
          // Is a config ... run config + jump config = export
          const newExport = rjImpl.makeExport(
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
        const rjObject = rjImpl.finalizeExport(
          finalExport,
          runConfig,
          finalConfig,
          plugIns
        )
        Object.defineProperty(rjObject, '__rjtype', { value: $TYPE_RJ_OBJECT })
        // Ship the last config in rj chain
        Object.defineProperty(rjObject, '__rjconfig', { value: partialConfig })
        // Attach the RJ Implementation to rj object! Fuck YEAH!
        Object.defineProperty(rjObject, '__rjimplementation', {
          value: rjImpl.mark,
        })
        return rjImpl.hackRjObject(rjObject, plugIns)
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
    Object.defineProperty(PartialRj, '__rjimplementation', {
      value: rjImpl.mark,
    })

    // All plugins in the partial rj tree
    PartialRj.__plugins = plugInsInTree

    return PartialRj
  }

  // Attach the RJ Implementation to rj constructor! Fuck YEAH!
  Object.defineProperty(rj, '__rjimplementation', { value: rjImpl.mark })

  return rj
}
