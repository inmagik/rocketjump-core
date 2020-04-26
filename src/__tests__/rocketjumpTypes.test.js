import forgeRocketJump from '../forgeRocketJump'
import { isPartialRj, isObjectRj } from '../types'

describe('rocketjump types', () => {
  it('shoudl be generic Partial and Object', () => {
    const rjGiova = forgeRocketJump({
      mark: Symbol('giova'),
      shouldRocketJump: () => false, // double invocation
      makeRunConfig: () => null, // no run config
      makeRecursionRjs: (rjs) => rjs, // don't touch configs
      makeExport: (_, config, rjExport = {}) => ({
        babu: 23, // Exports always BaBu
      }),
      finalizeExport: (rjExport) => ({ ...rjExport }), // don't hack config
    })

    const PartialRj = rjGiova()
    expect(isPartialRj(PartialRj)).toBe(true)
    expect(isObjectRj(PartialRj)).toBe(false)

    const RjStateObject = rjGiova()()
    expect(isPartialRj(RjStateObject)).toBe(false)
    expect(isObjectRj(RjStateObject)).toBe(true)
  })
  it('should be Partial and Object target to a specific family', () => {
    const rjGiova = forgeRocketJump({
      mark: Symbol('giova'),
      shouldRocketJump: () => false, // double invocation
      makeRunConfig: () => null, // no run config
      makeRecursionRjs: (rjs) => rjs, // don't touch configs
      makeExport: (_, config, rjExport = {}) => ({
        babu: 23, // Exports always BaBu
      }),
      finalizeExport: (rjExport) => ({ ...rjExport }), // don't hack config
    })

    const rjSkaffo = forgeRocketJump({
      mark: Symbol('skaffo'),
      shouldRocketJump: () => false, // double invocation
      makeRunConfig: () => null, // no run config
      makeRecursionRjs: (rjs) => rjs, // don't touch configs
      makeExport: (_, config, rjExport = {}) => ({
        babu: 23, // Exports always BaBu
      }),
      finalizeExport: (rjExport) => ({ ...rjExport }), // don't hack config
    })

    const PartialRj = rjGiova()
    expect(isPartialRj(PartialRj)).toBe(true)
    expect(isObjectRj(PartialRj)).toBe(false)
    expect(isPartialRj(PartialRj, rjSkaffo)).toBe(false)
    expect(isObjectRj(PartialRj, rjSkaffo)).toBe(false)
    expect(isPartialRj(PartialRj, rjGiova)).toBe(true)
    expect(isObjectRj(PartialRj, rjGiova)).toBe(false)

    const RjStateObject = rjSkaffo()()
    expect(isPartialRj(RjStateObject)).toBe(false)
    expect(isObjectRj(RjStateObject)).toBe(true)
    expect(isPartialRj(RjStateObject, rjGiova)).toBe(false)
    expect(isObjectRj(RjStateObject, rjGiova)).toBe(false)
    expect(isPartialRj(RjStateObject, rjSkaffo)).toBe(false)
    expect(isObjectRj(RjStateObject, rjSkaffo)).toBe(true)
  })
})
