import babel from 'rollup-plugin-babel'
import pkg from './package.json'

const vendors = []
  // Make all external dependencies to be exclude from rollup
  .concat(
    Object.keys(pkg.peerDependencies),
  )

export default ['index', 'utils'].map(input => ({
  input: `src/${input}.js`,
  output: [
    { file: `lib/${input}.cjs.js`, format: 'cjs', exports: 'named' },
    { file: `lib/${input}.esm.js`, format: 'esm' },
  ],
  external: vendors,
  plugins: [babel({ exclude: 'node_modules/**' })],
}))
