import invariant from './invariant'
import {
  markAsRj,
  markAsPartialRj,
  markAsRjObject,
  $TYPE_RJ_EXPORT,
  $TYPE_RJ_INJECT_PLUGIN,
} from './internals'
import { mergeConfigs, unionSet } from './utils'
import { isPartialRj } from './types'
import { enhanceWithPlugins } from './plugins'

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
    invariant(
      false,
      'You should implement `makeExport` in order to forge a rocketjump!'
    )
  },

  finalizeExport: (finalExport, runConfig, finalConfig, plugIns) => {
    invariant(
      false,
      'You should implement `finalizeExport` in order to forge a rocketjump!'
    )
  },

  hackRjObject: (rjObject) => rjObject,

  // Plugins in the core implementation
  forgedPlugins: [],

  // String name of current impl
  name: null,
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

  // Build An Rj With defaults
  rj.build = (...partialRjs) => {
    const newRj = (...rjArgs) => rj(...partialRjs, ...rjArgs)
    markAsRj(newRj, rjImpl)
    return newRj
  }

  return rj
}

// Make the pure rj function using give stable implementation
function makeRj(rjImpl) {
  // Set of fronzen PlugIns config
  const forgedPlugInsList = Object.freeze(
    rjImpl.forgedPlugins.map((plugInConfig) =>
      // Can't touch this
      Object.freeze({ ...plugInConfig })
    )
  )

  // Here is where the magic starts the functional recursive rjs combining \*.*/
  function rj(...recursionChain) {
    const partialRjsOrConfigs = recursionChain.map((rjRecursor) => {
      // Inject Partial!
      if (
        typeof rjRecursor === 'function' &&
        rjRecursor.__rjtype === $TYPE_RJ_INJECT_PLUGIN
      ) {
        const partialRj = rjRecursor(rj, rjImpl)
        return partialRj
      }
      return rjRecursor
    })

    // Grab a Set of plugins config in current rj Tree
    // rj( plugiInA(), plugInB()  )
    const forgedPlugInsSet = new Set(forgedPlugInsList)
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
      const finalExport = recursionRjs.reduce(
        (combinedExport, partialRjOrConfg) => {
          if (typeof partialRjOrConfg === 'function') {
            // Is a partial rj jump it!
            return partialRjOrConfg(runConfig, combinedExport, plugIns)
          } else {
            // Is a config ... run config + jump config = export
            const newExport = rjImpl.makeExport(
              partialRjOrConfg,
              combinedExport,
              runConfig,
              plugIns
            )
            // Mark export as valid
            Object.defineProperty(newExport, '__rjtype', {
              value: $TYPE_RJ_EXPORT,
            })
            return newExport
          }
        },
        continuedExport
      )

      if (isLastRjInvocation) {
        // Mark as an Rj Object that can be runned into
        // rj-react
        // or mount on redux / saga
        let rawRjObject = rjImpl.finalizeExport(
          finalExport,
          runConfig,
          finalConfig,
          plugIns
        )
        // ++ PlugIns
        rawRjObject = enhanceWithPlugins(
          plugIns,
          rawRjObject,
          'finalizeExport',
          [finalExport, finalConfig, runConfig]
        )
        markAsRjObject(rawRjObject, rjImpl, partialConfig)
        return rjImpl.hackRjObject(rawRjObject, plugIns)
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
