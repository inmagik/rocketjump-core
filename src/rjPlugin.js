export default function makeRjPlugin(rj) {
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
      const partialRj = createPartialRj(...args)
      partialRj.__plugins = new Set([plugInConfig, ...partialRj.__plugins])
      return partialRj
    }
  }
  return rjPlugin
}
