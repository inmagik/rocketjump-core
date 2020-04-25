import forgeRocketJump from '../forgeRocketJump'
import { enhanceWithPlugins } from '../plugins'

describe('rocketjump-core implementation', () => {
  it('should respect rj implementation', () => {
    const rj = forgeRocketJump({
      mark: Symbol('rj'),
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
      finalizeExport: (rjExport, runConfig, finalConfig, plugIns) => {
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
    const MAIN = {
      name: 'MAIN',
    }
    const rj = forgeRocketJump({
      mark: Symbol('rj'),
      makeExport: (runConfig, config, rjExport = {}, plugIns) => {
        // console.log('~~~', plugIns)
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

        return enhanceWithPlugins(
          plugIns,
          newExport,
          'makeExport',
          [
            runConfig,
            config,
          ]
        )
      },
      finalizeExport: (rjExportArg, runConfig, finalConfig, plugIns) => {
        const rjExport = enhanceWithPlugins(
          plugIns,
          rjExportArg,
          'hackExportBeforeFinalize'
        )
        let finalExport = { ...rjExport }
        if (finalExport.foo.king === 'giova') {
          finalExport = {
            KING: '$$',
            ...finalExport,
          }
        }
        return enhanceWithPlugins(
          plugIns,
          finalExport,
          'finalizeExport',
          [
            runConfig,
            finalConfig,
          ]
        )
      },
    }, [MAIN])

    // rj.setGlobals(
    //   rjPlugin(),
    // )
    //
    // rj.setPluginsDefault({
    //   list: {
    //
    //   }
    // })

    const plugin1 = rj.plugin(
      {
        name: 'One',
        finalizeExport: (finalExport, _, config) => {
          return {
            ...finalExport,
            override: 'G E M E L L O',
          }
        },
        hackExportBeforeFinalize: finalExport => {
          return {
            ...finalExport,
            foo: {
              ...finalExport.foo,
              king: 'giova',
            },
          }
        },
        makeExport: (extendExport, _, config) => {
          const betterExport = {
            ...extendExport,
          }
          if (config.babu) {
            betterExport.babu = config.babu
          }
          return betterExport
        },
      },
      // (age = 20) =>
      //   rj({
      //     foo: {
      //       age,
      //     },
      //   }),
    )

    const plugin2 = rj.plugin(
      {
        name: 'Two',
      },
      (gang = 23) =>
        rj.pure(plugin1(99), {
          babu: 'Budda',
          foo: {
            gang,
          },
        }),
    )

    const plugin3 = rj.plugin(
      {
        name: '##3',
      },
      (g = 'Ciko') =>
        rj.pure(plugin2(1), {
          foo: {
            g,
          },
        }),
    )

    // rj(
    //   // rjAjax(),
    //   {
    //     effect: () => '/api/todos',
    //   }
    // )
    // rj.setPluginsDefaults({
    //   One: ['KETY'],
    // })

    const RjObjectA = rj(
      // rj(rj({})),
      // rj(
      plugin1(),
      // rj(
      //   rj({
      //     babu: 23,
      //   })
      // ),
      // rj({
      //   babu: 23,
      // }),
      // ),
      // plugin1(),
      // plugin1(),
      {
        foo: {
          name: 'GiGino',
        },
        // babu: 'Super'
      }
    )()
    // console.log(RjObjectA)
    // console.log(RjObjectA.plugins)
    // expect(RjObjectA).toEqual({
    //   foo: {
    //     name: 'GiGino',
    //     gang: 1,
    //     age: 99,
    //     g: 'Noyz',
    //     king: 'giova',
    //   },
    //   KING: '$$',
    //   babu: 'Budda',
    //   override: 'G E M E L L O',
    // })
  })
})
