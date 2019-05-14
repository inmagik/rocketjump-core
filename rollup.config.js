import babel from 'rollup-plugin-babel'

export default ['index', 'utils'].map(input => ({
  input: `src/${input}.js`,
  output: [
    { file: `lib/${input}.cjs.js`, format: 'cjs', exports: 'named' },
    { file: `lib/${input}.esm.js`, format: 'esm' },
  ],
  plugins: [babel({ exclude: 'node_modules/**' })],
}))
