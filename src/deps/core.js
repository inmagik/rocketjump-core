// ~~ prince of saint felix ~~

const DefaultConfig = {
  shouldRun: true,
  metaOnMount: false,
  skipRunValue: false,
}

class DeBp {
  constructor(value, c = {}) {
    const config = { ...DefaultConfig, ...c }
    this._value = value
    this._meta = config.meta
    this._shouldRun = config.shouldRun
    this._metaOnMount = config.metaOnMount
    this._skipRunValue = config.skipRunValue
  }

  getValue() {
    return this._value
  }

  metaOnMount() {
    return this._metaOnMount
  }

  skipRunValue() {
    return this._skipRunValue
  }

  shouldRun() {
    return this._shouldRun
  }

  withMeta(newMeta) {
    this._meta = { ...this._meta, ...newMeta }
    return this
  }

  getMeta(onMount = false) {
    // When we are on mount and meta are only 4 mount give undef
    if (!onMount && this._metaOnMount) {
      return undefined
    }
    return this._meta
  }
}

export const ifDep = (a, cbTrue, cbFalse) =>
  a instanceof DeBp ? cbTrue() : cbFalse()

export const RunDeBp = a =>
  ifDep(
    a,
    () =>
      new DeBp(a.getValue(), {
        shouldRun: true,
        meta: a.getMeta(),
        metaOnMount: a.metaOnMount(),
        skipRunValue: a.skipRunValue(),
      }),
    () => new DeBp(a, { shouldRun: true })
  )

export const NotRunDeBp = a =>
  ifDep(
    a,
    () =>
      new DeBp(a.getValue(), {
        shouldRun: false,
        meta: a.getMeta(),
        metaOnMount: a.metaOnMount(),
        skipRunValue: a.skipRunValue(),
      }),
    () => new DeBp(a, { shouldRun: false })
  )

export const WithMetaDeBp = (a, meta) =>
  ifDep(
    a,
    () =>
      new DeBp(a.getValue(), {
        shouldRun: a.shouldRun(),
        meta: { ...a.getMeta(), ...meta },
      }),
    () => new DeBp(a, { shouldRun: true, meta })
  )

export const WithMetaOnMountDeBp = meta =>
  new DeBp(true, {
    shouldRun: true,
    meta,
    metaOnMount: true,
    skipRunValue: true,
  })

export const WithAlwaysMeta = meta =>
  new DeBp(true, {
    shouldRun: true,
    meta,
    metaOnMount: false,
    skipRunValue: true,
  })

export const getDepValue = a =>
  ifDep(
    a,
    () => a.getValue(),
    () => a
  )

export const getDepMeta = (a, onMount) =>
  ifDep(
    a,
    () => a.getMeta(onMount),
    () => undefined
  )

export const shouldDepRun = a =>
  ifDep(
    a,
    () => a.shouldRun(),
    () => true
  )
