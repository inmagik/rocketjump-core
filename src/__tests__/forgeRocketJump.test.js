import forgeRocketJump from '../forgeRocketJump'
import { makeExportValue, squashExportValue } from '../exportValue'
import { enhanceWithPlugins } from '../plugins'
import { isPartialRj, isObjectRj } from '../types'

describe('forgeRocketJump', () => {
  it("can't forge an rj without a cool mark", () => {
    expect(() => {
      forgeRocketJump({
        makeExport: (_, config, rjExport = {}) => {
          return { ...config }
        },
        finalizeExport: (rjExport, runConfig, finalConfig, plugIns) => {
          // don't hack config
          return { ...rjExport }
        },
      })
    }).toThrow()
  })
  it('should forge a mergiable tool in respect of given makeExport implementation', () => {
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

  it('should give the ability to choose when rocketjump into an RjObject', () => {
    const rjDouble = forgeRocketJump({
      mark: Symbol('2x'),
      makeExport: (_, config, rjExport = {}) => ({
        ...rjExport,
        ...config,
      }),
      finalizeExport: (rjExport) => ({ ...rjExport }),
    })

    const objA = rjDouble({
      foo: 23,
    })()
    expect(objA).toEqual({
      foo: 23,
    })
    expect(isObjectRj(objA)).toBe(true)
    expect(isPartialRj(rjDouble())).toBe(true)

    const rjGo = forgeRocketJump({
      shouldRocketJump: (objs) => objs.some((o) => o.jump === true),
      mark: Symbol('2x'),
      makeExport: (_, config, rjExport = {}) => ({
        ...rjExport,
        ...config,
      }),
      finalizeExport: (rjExport) => ({ ...rjExport }),
    })

    expect(rjGo({ x: 1 })()).toEqual({ x: 1 })

    expect(rjGo({ x: 1, jump: true })).toEqual({ x: 1, jump: true })

    expect(isObjectRj(rjGo({ jump: true }))).toBe(true)

    expect(isPartialRj(rjGo({ jumpx: true }))).toBe(true)
  })

  it('should give the abilty to lazy compose export value and squash them from RjObject', () => {
    const exportMessage = makeExportValue({
      defaultValue: '',
      isLazy: (v) => v === null,
      shouldCompose: (v) => typeof v === 'string',
      compose: (message, m) => message + m,
    })

    // Create the stupidest rj ever
    const rj = forgeRocketJump({
      mark: Symbol('rj'),
      pure: true,
      makeExport: (_, config, rjExport = {}) => ({
        message: exportMessage(rjExport.message, config.m),
      }),
      finalizeExport: (rjExport) => ({ ...rjExport }), // don't hack config
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

  it('should guarantee the ability to finalize into custom RjObject shape', () => {
    const rj = forgeRocketJump({
      mark: Symbol('XxX'),
      makeExport: (_, config, rjExport = {}) => {
        const newExport = { ...rjExport }

        if (!newExport.vars) {
          // Top of recurison export has no vars
          // init them
          newExport.vars = {}
        }
        // If config has var merge them
        if (config.vars) {
          newExport.vars = {
            ...newExport.vars,
            ...config.vars,
          }
        }

        // Ya da Ya da
        if (!newExport.style) {
          newExport.style = {}
        }
        // If config has var merge them
        if (config.style) {
          newExport.style = {
            ...newExport.style,
            ...config.style,
          }
        }

        // Init class name as string
        if (!newExport.className) {
          newExport.className = ''
        }
        if (config.className) {
          // Concat them
          if (newExport.className !== '') {
            newExport.className += ' '
          }
          newExport.className += config.className
        }

        return newExport
      },
      finalizeExport: (rjExport, runConfig, finalConfig, plugIns) => {
        // End of recurison make the rj object!

        const templateVars = (str, vars) => {
          return Object.keys(vars).reduce((newStr, keyVar) => {
            // Naive impl
            return newStr.split('$' + keyVar).join(vars[keyVar])
          }, str)
        }

        const className = templateVars(rjExport.className, rjExport.vars)
        const style = Object.keys(rjExport.style).reduce(
          (newStyle, keyStyle) => ({
            ...newStyle,
            [keyStyle]: templateVars(rjExport.style[keyStyle], rjExport.vars),
          }),
          {}
        )

        return {
          className,
          style,
        }
      },
    })

    const Theme = rj({
      vars: {
        sad: 'blue',
        magikClassic: 'deepskyblue',
      },
      className: 'bg-light d-flex',
      style: {
        color: '$magikClassic',
        border: '1px solid brown',
      },
    })

    const styledProps = rj(Theme, {
      className: 'flex-end',
      style: {
        background: '$magikClassic',
        color: '$sad',
      },
    })()

    expect(styledProps).toEqual({
      className: 'bg-light d-flex flex-end',
      style: {
        background: 'deepskyblue',
        color: 'blue',
        border: '1px solid brown',
      },
    })
  })

  it('should give the abilty through plugins to hack finalize export into RjObject', () => {
    const rj = forgeRocketJump({
      mark: Symbol('XxX'),
      makeExport: (_, config, rjExport = {}) => {
        const newExport = { ...rjExport }

        if (!newExport.vars) {
          // Top of recurison export has no vars
          // init them
          newExport.vars = {}
        }
        // If config has var merge them
        if (config.vars) {
          newExport.vars = {
            ...newExport.vars,
            ...config.vars,
          }
        }

        // Ya da Ya da
        if (!newExport.style) {
          newExport.style = {}
        }
        // If config has var merge them
        if (config.style) {
          newExport.style = {
            ...newExport.style,
            ...config.style,
          }
        }

        // Init class name as string
        if (!newExport.className) {
          newExport.className = ''
        }
        if (config.className) {
          // Concat them
          if (newExport.className !== '') {
            newExport.className += ' '
          }
          newExport.className += config.className
        }

        return newExport
      },
      finalizeExport: (rjExport, runConfig, finalConfig, plugIns) => {
        // End of recurison make the rj object!

        const { vars } = rjExport
        const templateVars = (strArg) => {
          if (typeof strArg === 'function') {
            return strArg
          }
          const str = String(strArg)
          return Object.keys(vars).reduce((newStr, keyVar) => {
            // Naive impl
            return newStr.split('$' + keyVar).join(vars[keyVar])
          }, str)
        }

        const className = templateVars(rjExport.className, rjExport.vars)
        const style = Object.keys(rjExport.style).reduce(
          (newStyle, keyStyle) => ({
            ...newStyle,
            [keyStyle]: templateVars(rjExport.style[keyStyle]),
          }),
          {}
        )

        const finalExport = {
          className,
          style,
        }
        return enhanceWithPlugins(plugIns, finalExport, 'finalizeExport', [
          templateVars,
        ])
      },
    })

    const Theme = rj({
      vars: {
        sad: 'blue',
        magikClassic: 'deepskyblue',
      },
      className: 'bg-light d-flex',
      style: {
        color: '$magikClassic',
        border: '1px solid brown',
      },
    })

    const rjWithDynamicStyle = rj.plugin({
      finalizeExport: (originalExport, templateVars) => {
        const baseStyle = originalExport.style
        const style = (props) =>
          Object.keys(baseStyle).reduce(
            (newStyle, k) => ({
              ...newStyle,
              [k]:
                typeof baseStyle[k] === 'function'
                  ? templateVars(baseStyle[k](props))
                  : baseStyle[k],
            }),
            {}
          )
        return {
          ...originalExport,
          style,
        }
      },
    })

    const styledProps = rj(rjWithDynamicStyle(), Theme, {
      className: 'flex-end',
      style: {
        background: (props) => (props.black ? 'black' : '$magikClassic'),
        color: '$sad',
      },
    })()

    expect(styledProps.style({ black: true })).toEqual({
      background: 'black',
      color: 'blue',
      border: '1px solid brown',
    })
  })

  it('should give the abilty through plugins to hack make export', () => {
    const rj = forgeRocketJump({
      mark: Symbol('rj'),
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

        return enhanceWithPlugins(plugIns, newExport, 'makeExport', [
          runConfig,
          config,
        ])
      },
      finalizeExport: (rjExportArg, runConfig, finalConfig, plugIns) => {
        const rjExport = enhanceWithPlugins(
          plugIns,
          rjExportArg,
          'hackExportBeforeFinalize'
        )
        let finalExport = { ...rjExport }
        if (finalExport?.foo?.king === 'giova') {
          finalExport = {
            KING: '$$',
            ...finalExport,
          }
        }
        return enhanceWithPlugins(plugIns, finalExport, 'finalizeExport', [
          runConfig,
          finalConfig,
        ])
      },
    })

    const plugin1 = rj.plugin({
      name: 'One',
      finalizeExport: (finalExport, _, config) => {
        return {
          ...finalExport,
          override: 'G E M E L L O',
        }
      },
      hackExportBeforeFinalize: (finalExport) => {
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
    })

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
        })
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
        })
    )

    expect(rj({})()).toEqual({
      foo: {
        name: 'GioVa',
      },
    })

    expect(
      rj({
        foo: {
          name: 'Rinne',
          gang: 23,
        },
      })()
    ).toEqual({
      foo: {
        name: 'Rinne',
        gang: 23,
      },
    })

    expect(
      rj(plugin3(), {
        foo: {
          name: 'Rinne',
        },
      })()
    ).toEqual({
      babu: 'Budda',
      foo: {
        name: 'Rinne',
        g: 'Ciko',
        gang: 1,
        king: 'giova',
      },
      KING: '$$',
      override: 'G E M E L L O',
    })
  })
})
