import forgeRocketJump from '../forgeRocketJump'
import { makeExportValue, squashExportValue } from '../exportValue'

describe('rocketjump-core', () => {
  it('should kick ass with recursion', () => {
    // Create the stupidest rj ever
    const rj = forgeRocketJump({
      mark: Symbol('rj'),
      pure: true,
      makeRecursionRjs: rjs => rjs, // don't touch configs
      makeExport: (_, config, rjExport = {}) => {
        return {
          message: (rjExport.message || '') + (config.m || ''),
          magic: (config.n || 0) + (rjExport.magic || 0),
        }
      },
      finalizeExport: rjExport => ({ ...rjExport }), // don't hack config
    })

    expect(rj({})()).toEqual({ magic: 0, message: '' })

    expect(
      rj(
        {
          n: 23,
          m: 'R',
        },
        {
          n: 10,
          m: 'J',
        }
      )()
    ).toEqual({ magic: 33, message: 'RJ' })

    expect(
      rj(
        {
          n: 10,
          m: 'G',
        },
        rj({ n: 3, m: 'i' }, { n: 3, m: 'o' })
      )()
    ).toEqual({ magic: 16, message: 'Gio' })
  })

  it('should kick ass with recursion but lazy', () => {
    const exportMessage = makeExportValue({
      defaultValue: '',
      isLazy: v => v === null,
      shouldCompose: v => typeof v === 'string',
      compose: (message, m) => message + m,
    })

    // Create the stupidest rj ever
    const rj = forgeRocketJump({
      mark: Symbol('rj'),
      pure: true,
      makeExport: (_, config, rjExport = {}) => ({
        message: exportMessage(rjExport.message, config.m),
      }),
      finalizeExport: rjExport => ({ ...rjExport }), // don't hack config
    })

    expect(rj({})()).toEqual({ message: '' })

    expect(
      rj(
        {
          m: 'R',
        },
        {
          m: 'J',
        }
      )()
    ).toEqual({ message: 'RJ' })

    let e = {}

    e = rj(
      {
        m: 'G',
      },
      rj({ m: null }, { m: 'o' }),
      rj({ m: null }),
      rj({ m: ' ~ Matto IL DRAGO' }, { m: null })
    )()
    expect(squashExportValue(e.message, ['1', 'Va', ' 23'])).toBe(
      'G1oVa ~ Matto IL DRAGO 23'
    )
  })
})
