import babel from 'rollup-plugin-babel'
import pkg from './package.json'

const vendors = []
  // Make all external dependencies to be exclude from rollup
  .concat(
    Object.keys(pkg.peerDependencies),
  )

export default ['esm', 'cjs'].map(format => ({
  input: {
    'index': 'src/index.js',
    'utils': 'src/utils.js',
  },
  output: [
    {
      dir: 'lib',
      entryFileNames: '[name].[format].js',
      exports: 'named',
      format
    }
  ],
  external: vendors,
  plugins: [babel({ exclude: 'node_modules/**' })],
}))
