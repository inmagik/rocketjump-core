class PlaceholderValue {
  constructor(index) {
    this.index = index
  }
}

class LazyValue {
  constructor(valueConfig, exportValue, configValue) {
    this.valueConfig = valueConfig
    this.exportValue = exportValue

    this.placeholdersCount = 1
    this.chain = [new PlaceholderValue(0)]
  }

  add(configValue) {
    const { shouldCompose, isLazy } = this.valueConfig

    if (isLazy(configValue)) {
      this.chain.push(new PlaceholderValue(this.placeholdersCount))
      this.placeholdersCount++
    } else if (shouldCompose(configValue)) {
      this.chain.push(configValue)
    }
  }

  squashValue(placeholders) {
    const { compose } = this.valueConfig
    return this.chain.reduce((exportValue, valueOrPlaceholder) => {
      let value
      if (valueOrPlaceholder instanceof PlaceholderValue) {
        value = placeholders[valueOrPlaceholder.index]
      } else {
        value = valueOrPlaceholder
      }
      return compose(exportValue, value)
    }, this.exportValue)
  }
}

// Configure the export value
export function makeExportValue({
  defaultValue,
  isLazy,
  shouldCompose,
  compose
}) {
  return (exportValue, configValue) => {
    // Assing a default value to export value
    let nextValue
    if (exportValue === undefined) {
      nextValue = defaultValue
    } else {
      nextValue = exportValue
    }

    if (nextValue instanceof LazyValue) {
      nextValue.add(configValue)
      return nextValue
    } else {
      // The prev export is normal in recursion chain

      // Lazy placeholder
      if (isLazy(configValue)) {
        return new LazyValue({ shouldCompose, isLazy, compose }, exportValue, configValue)
      }

      // Normal composition
      if (shouldCompose(configValue)) {
        return compose(nextValue, configValue)
      } else {
        return nextValue
      }
    }
  }
}

export function squashExportValue(value, placeholders) {
  if (value instanceof LazyValue) {
    return value.squashValue(placeholders)
  } else {
    return value
  }
}
