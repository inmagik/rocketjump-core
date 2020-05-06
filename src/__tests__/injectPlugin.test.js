import forgeRocketJump from '../forgeRocketJump'
import rjPlugin from '../rjPlugin'

describe('injectPlugins', () => {
  it('should INJECT', () => {
    const rjA = forgeRocketJump({
      name: 'A',
      mark: Symbol('A'),
      makeExport: (config, rjExport = {}) => {
        if (config.msg) {
          rjExport.msg = (rjExport.msg ?? []).concat(config.msg)
        }
        return rjExport
      },
      finalizeExport: (rjExport, runConfig, finalConfig, plugIns) => {
        return {
          hello: 'RJ A SAYS ' + rjExport.msg.join(' '),
        }
      },
    })

    const rjB = forgeRocketJump({
      name: 'B',
      mark: Symbol('B'),
      makeExport: (config, rjExport = {}) => {
        if (config.msg) {
          rjExport.msg = (rjExport.msg ?? []).concat(config.msg)
        }
        return rjExport
      },
      finalizeExport: (rjExport, runConfig, finalConfig, plugIns) => {
        return {
          hello: 'RJ B SAYS ' + rjExport.msg.join('~'),
        }
      },
    })

    let coolGuy = rjPlugin((rj, x) =>
      rj({
        msg: 'Gio Va' + (x ?? ''),
      })
    )

    let ObjA = rjA(
      coolGuy(),
      {
        msg: 'IS',
      },
      rjA(rjA({ msg: 'SO' }), rjA({ msg: 'AWESOME' }))
    )()
    expect(ObjA).toEqual({
      hello: 'RJ A SAYS Gio Va IS SO AWESOME',
    })

    let ObjB = rjB(
      coolGuy('2X'),
      {
        msg: 'IS',
      },
      rjB(rjB({ msg: 'SO' }), rjB({ msg: 'AWESOME' }))
    )()
    expect(ObjB).toEqual({
      hello: 'RJ B SAYS Gio Va2X~IS~SO~AWESOME',
    })

    coolGuy = rjPlugin({
      createPartial: (rj) => rj({ msg: 'Gio Va' }),
      hookForge: {
        finalizeExport: (rawObj) => ({
          ...rawObj,
          hackerman: 23,
        }),
      },
    })
    ObjA = rjA(
      coolGuy(),
      {
        msg: 'IS',
      },
      rjA(rjA({ msg: 'SO' }), rjA({ msg: 'AWESOME' }))
    )()
    expect(ObjA).toEqual({
      hello: 'RJ A SAYS Gio Va IS SO AWESOME',
      hackerman: 23,
    })

    coolGuy = rjPlugin.impl({
      A: (rj) => rj({ msg: 'KETY' }),
      B: (rj) => rj({ msg: '4RG0' }),
    })

    ObjA = rjA(
      coolGuy(),
      {
        msg: 'IS',
      },
      rjA(rjA({ msg: 'SO' }), rjA({ msg: 'AWESOME' }))
    )()
    expect(ObjA).toEqual({
      hello: 'RJ A SAYS KETY IS SO AWESOME',
    })

    ObjB = rjB(
      coolGuy(),
      {
        msg: 'IS',
      },
      rjB(rjB({ msg: 'SO' }), rjB({ msg: 'AWESOME' }))
    )()
    expect(ObjB).toEqual({
      hello: 'RJ B SAYS 4RG0~IS~SO~AWESOME',
    })

    coolGuy = rjPlugin.impl({
      A: {
        createPartial: (rj) => rj({ msg: 'Gringo' }),
        hookForge: {
          finalizeExport: (rawObj) => ({
            ...rawObj,
            magik: 23,
          }),
        },
      },
      B: {
        createPartial: (rj) => rj({ msg: 'Frank' }),
        hookForge: {
          finalizeExport: (rawObj) => ({
            ...rawObj,
            magik: 999,
          }),
        },
      },
    })

    ObjA = rjA(
      coolGuy(),
      {
        msg: 'IS',
      },
      rjA(rjA({ msg: 'SO' }), rjA({ msg: 'AWESOME' }))
    )()
    expect(ObjA).toEqual({
      hello: 'RJ A SAYS Gringo IS SO AWESOME',
      magik: 23,
    })

    ObjB = rjB(
      coolGuy(),
      {
        msg: 'IS',
      },
      rjB(rjB({ msg: 'SO' }), rjB({ msg: 'AWESOME' }))
    )()
    expect(ObjB).toEqual({
      hello: 'RJ B SAYS Frank~IS~SO~AWESOME',
      magik: 999,
    })
  })
})
