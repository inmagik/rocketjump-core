export function enhanceWithPlugins(plugIns, data, method, args = []) {
  let enhancedData = data
  plugIns.forEach(plugin => {
    if (typeof plugin[method] === 'function') {
      enhancedData = plugin[method](
        enhancedData,
        ...args
      )
    }
  })
  return enhancedData
}
