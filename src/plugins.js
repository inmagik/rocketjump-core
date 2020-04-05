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
