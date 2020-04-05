export function enhanceFinalExportWithPlugins(
  finalExport,
  runConfig,
  finalConfig,
  plugIns
) {
  let enhancedExport = finalExport
  plugIns.forEach(plugin => {
    if (plugin.finalizeExport) {
      enhancedExport = plugin.finalizeExport(
        enhancedExport,
        runConfig,
        finalConfig,
      )
    }
  })
  return enhancedExport
}

export function enhanceMakeExportWithPlugins(
  runConfig,
  config,
  combinedExport,
  plugIns
) {
  let enhancedExport = combinedExport
  plugIns.forEach(plugin => {
    if (plugin.makeExport) {
      enhancedExport = plugin.makeExport(
        runConfig,
        config,
        enhancedExport,
      )
    }
  })
  return enhancedExport
}
