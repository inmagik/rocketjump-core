import { $TYPE_RJ_EXPORT, $TYPE_RJ_PARTIAL } from './internals'

// Simple merge and skip when function....
function mergeConfigs(rjsOrConfigs) {
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

const noop = () => {}

// Forge a rocketjump from in da S T E L L
export function forgeRocketJump(rjImpl, extendsPartialRj = noop) {
  // Here is where the magic starts the functional recursive rjs combining \*.*/
  function rj(...partialRjsOrConfigs) {
    // ... make the partial config
    const partialConfig = mergeConfigs(partialRjsOrConfigs)

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
          return runRjImpl.makeExport(runConfig, rjOrConfig, combinedExport)
        }
      }, continuedExport)

      if (isLastRjInvocation) {
        return runRjImpl.finalizeExport(finalExport, runConfig, finalConfig)
      } else {
        return finalExport
      }
    }

    extendsPartialRj(PartialRj)

    // Mark the partialRj
    Object.defineProperty(PartialRj, '__rjtype', { value: $TYPE_RJ_PARTIAL })

    PartialRj.config = partialConfig

    return PartialRj
  }

  return rj
}
