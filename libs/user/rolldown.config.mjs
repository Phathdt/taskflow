import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: '../../dist/libs/user',
    format: 'cjs',
    sourcemap: true,
    entryFileNames: '[name].js',
  },
  external: [/^@/, /^[a-z]/],
  tsconfig: '../../tsconfig.json',
})
