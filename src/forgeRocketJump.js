import blamer from '../blamer.macro'
import {
  $TYPE_RJ_EXPORT,
  $TYPE_RJ_PARTIAL,
  $TYPE_RJ_OBJECT,
  $TYPE_RJ,
} from './internals'
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
}

function markAsRj(baseFn, rjImpl) {
  Object.defineProperty(baseFn, '__rjtype', {
    value: $TYPE_RJ,
  })
  Object.defineProperty(baseFn, '__rjimplementation', {
    value: rjImpl.mark,
  })
}

function markAsPartialRj(baseFn, rjImpl, config, plugIns = new Set()) {
  Object.defineProperty(baseFn, '__rjtype', {
    value: $TYPE_RJ_PARTIAL,
  })
  Object.defineProperty(baseFn, '__rjimplementation', {
    value: rjImpl.mark,
  })
  Object.defineProperty(baseFn, '__rjconfig', { value: config })
  baseFn.__plugins = plugIns
}

function markAsRjObject(baseFn, rjImpl, config) {
  Object.defineProperty(baseFn, '__rjtype', {
    value: $TYPE_RJ_OBJECT,
  })
  Object.defineProperty(baseFn, '__rjimplementation', {
    value: rjImpl.mark,
  })
  Object.defineProperty(baseFn, '__rjconfig', { value: config })
}

function noopPartialRj(rjImpl, config = {}) {
  const TheNoopPartialRj = (runConfig, combinedExport, plugIns) =>
    combinedExport
  markAsPartialRj(TheNoopPartialRj, rjImpl, config)
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

  const rj = makeRj(rjImpl)

  // Plugins!
  rj.plugin = makeRjPlugin(rjImpl)

  // Build An Rj With defaults
  rj.build = (...partialRjs) => {
    const newRj = (...rjArgs) => rj(...partialRjs, ...rjArgs)
    markAsRj(newRj, rjImpl)
    return newRj
  }

  return rj
}

function makeRjPlugin(rjImpl) {
  function rjPlugin(plugInConfigArg, createPartialRjArg) {
    if (typeof plugInConfigArg !== 'object' || plugInConfigArg === null) {
      blamer(
        '[rj-core-forge]',
        'Please give a plain object as Plugin config to rj.plugin()'
      )
    }
    // Can't touch plugin config anymore
    const plugInConfig = Object.freeze({ ...plugInConfigArg })

    const createPartialRj =
      typeof createPartialRjArg === 'function'
        ? createPartialRjArg
        : () => noopPartialRj(rjImpl)

    return function rjPluginBuilder(...args) {
      const partialRj = createPartialRj(...args)
      partialRj.__plugins = unionSet([plugInConfig], partialRj.__plugins)
      return partialRj
    }
  }
  return rjPlugin
}

// Make the pure rj function using give stable implementation
function makeRj(rjImpl) {
  // Set of fronzen PlugIns config
  const forgedPlugInsSet = new Set(
    rjImpl.forgedPlugins.map((plugInConfig) =>
      // Can't touch this
      Object.freeze({
        ...plugInConfig,
      })
    )
  )

  // Here is where the magic starts the functional recursive rjs combining \*.*/
  function rj(...partialRjsOrConfigs) {
    // Grab a Set of plugins config in current rj Tree
    // rj( plugiInA(), plugInB()  )
    const plugInsInTree = partialRjsOrConfigs.reduce((resultSet, a) => {
      if (isPartialRj(a)) {
        a.__plugins.forEach((plugin) => resultSet.add(plugin))
      }
      return resultSet
    }, forgedPlugInsSet)

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
        markAsRjObject(rjObject, rjImpl, partialConfig)
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
    markAsPartialRj(PartialRj, rjImpl, partialConfig, plugInsInTree)

    return PartialRj
  }

  // Mark Rj Fn
  markAsRj(rj, rjImpl)
  return rj
}
