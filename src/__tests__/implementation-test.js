import forgeRocketJump from '../forgeRocketJump'
import rjPlugin from '../rjPlugin'
import {
  enhanceFinalExportWithPlugins,
  enhanceMakeExportWithPlugins,
} from '../plugins'

describe('rocketjump-core implementation', () => {
  it('should respect rj implementation', () => {
    const rj = forgeRocketJump({
      shouldRocketJump: () => false, // double invocation
      makeRunConfig: () => null, // no run config
      makeRecursionRjs: rjs => rjs, // don't touch configs
      makeExport: (_, config, rjExport = {}) => {
        let newExport = {}
        // Default foo values
        newExport.foo = rjExport.foo || {
          name: 'GioVa',
        }
        // Extend foo
        newExport.foo = {
          ...newExport.foo,
          ...(config || {}).foo,
        }
        return newExport
      },
      finalizeExport: rjExport => {
        // don't hack config
        return { ...rjExport }
      },
    })

    const RjObjectA = rj(null)()

    expect(RjObjectA).toEqual({
      foo: {
        name: 'GioVa',
      },
    })

    const RjObjectB = rj(
      rj(
        rj({
          foo: {
            group: 'GANG',
          },
        }),
        {
          foo: {
            snitch: false,
          },
        }
      ),
      {
        foo: {
          name: 'Dr3f',
          drink: 'Sciroppo',
        },
      }
    )()
    expect(RjObjectB).toEqual({
      foo: {
        name: 'Dr3f',
        drink: 'Sciroppo',
        group: 'GANG',
        snitch: false,
      },
    })
  })
  it('should respect hande plugins', () => {
    const rj = forgeRocketJump({
      shouldRocketJump: () => false, // double invocation
      makeRunConfig: () => null, // no run config
      makeRecursionRjs: rjs => rjs, // don't touch configs
      makeExport: (runConfig, config, rjExport = {}, plugIns) => {
        let newExport = { ...rjExport }
        // Default foo values
        newExport.foo = rjExport.foo || {
          name: 'GioVa',
        }
        // Extend foo
        newExport.foo = {
          ...newExport.foo,
          ...(config || {}).foo,
        }

        return enhanceMakeExportWithPlugins(
          runConfig,
          config,
          newExport,
          plugIns
        )
      },
      finalizeExport: (rjExport, runConfig, finalConfig, plugIns) => {
        const finalExport = { ...rjExport }
        return enhanceFinalExportWithPlugins(
          finalExport,
          runConfig,
          finalConfig,
          plugIns
        )
      },
    })

    const plugin1 = rjPlugin(
      (age = 20) =>
        rj({
          foo: {
            age,
          },
        }),
      {
        name: 'One',
        finalizeExport: (finalExport, _, config) => {
          return {
            ...finalExport,
            override: 'G E M E L L O',
          }
        },
        makeExport: (_, config, extendExport = {}) => {
          const betterExport = {
            ...extendExport,
          }
          if (config.babu) {
            betterExport.babu = config.babu
          }
          return betterExport
        },
      }
    )

    const plugin2 = rjPlugin(
      (gang = 23) =>
        rj(plugin1(99), {
          babu: 'Budda',
          foo: {
            gang,
          },
        }),
      {
        name: 'Two',
      }
    )

    const plugin3 = rjPlugin(
      (g = 'Ciko') =>
        rj(plugin2(1), {
          foo: {
            g,
          },
        }),
      {
        name: '##3',
      }
    )

    rj(
      // rjAjax(),
      {
        effect: () => '/api/todos',
      }
    )

    const RjObjectA = rj(
      rj(plugin3('Noyz')),
      // plugin1(),
      // plugin1(),
      {
        foo: {
          name: 'GiGino',
        },
      }
    )()
    // console.log(RjObjectA)
    // console.log(RjObjectA.plugins)
    expect(RjObjectA).toEqual({
      foo: {
        name: 'GiGino',
        gang: 1,
        age: 99,
        g: 'Noyz',
      },
      babu: 'Budda',
      override: 'G E M E L L O',
    })
  })
})
