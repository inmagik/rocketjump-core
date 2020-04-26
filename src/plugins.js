import { arrayze } from './utils'

export function enhanceWithPlugins(plugIns, data, method, args = []) {
  let enhancedData = data
  plugIns.forEach((plugin) => {
    if (typeof plugin[method] === 'function') {
      enhancedData = plugin[method](enhancedData, ...args)
    }
  })
  return enhancedData
}

export function createObjectFromPlugins(plugIns, method, args = []) {
  let obj = {}
  plugIns.forEach((plugin) => {
    if (typeof plugin[method] === 'function') {
      const mergeObj = plugin[method](...args)
      if (mergeObj) {
        obj = { ...obj, ...mergeObj }
      }
    }
  })
  return obj
}

export function createListFromPlugins(plugIns, method, args = []) {
  let list = []
  plugIns.forEach((plugin) => {
    if (typeof plugin[method] === 'function') {
      const mergeList = plugin[method](...args)
      if (mergeList !== null && mergeList !== undefined) {
        list = list.concat(arrayze(mergeList))
      }
    }
  })
  return list
}
