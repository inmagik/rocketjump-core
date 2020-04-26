import forgeRocketJump from '../forgeRocketJump'
import { enhanceWithPlugins } from '../plugins'

describe('rocketjump school', () => {
  it('basic rj', () => {
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

  it('rj with plugins', () => {
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
})
