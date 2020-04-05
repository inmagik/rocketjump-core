export default function rjPlugin(
  createPartialRj,
  plugInConfigArg
) {
  let plugInConfig = null
  if (typeof plugInConfigArg === 'object' && plugInConfigArg !== null) {
    // Can't touch plugin confgi anymore
    plugInConfig = Object.freeze({ ...plugInConfigArg })
  }

  return function rjPluginBuilder(...args) {
    const partialRj = createPartialRj(...args)
    partialRj.plugins = new Set([plugInConfig, ...partialRj.plugins])
    return partialRj
  }
}
