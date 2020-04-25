const { createMacro, MacroError } = require('babel-plugin-macros')

const buildThrowError = (t, args) =>
  t.throwStatement(t.newExpression(t.identifier('Error'), args))

function blamer({ babel: { types: t }, references: { default: paths } }) {
  const nodeEnvExpr = t.memberExpression(
    t.memberExpression(t.identifier('process'), t.identifier('env')),
    t.identifier('NODE_ENV')
  )

  paths.forEach(nodePath => {
    const blamerCallArgs = nodePath.parentPath.container.expression.arguments
    if (blamerCallArgs.length !== 2) {
      throw new MacroError('Sorry, blamer macro needs two params')
    }

    nodePath.parentPath.insertAfter(
      t.ifStatement(
        t.binaryExpression('===', nodeEnvExpr, t.stringLiteral('production')),
        buildThrowError(t, [blamerCallArgs[0]]),
        buildThrowError(t, [blamerCallArgs[1]])
      )
    )

    nodePath.parentPath.remove()
  })
}

module.exports = createMacro(blamer)
