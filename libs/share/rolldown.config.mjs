import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: '../../dist/libs/share',
    format: 'cjs',
    sourcemap: true,
    entryFileNames: '[name].js',
  },
  external: [/^@/, /^[a-z]/],
  tsconfig: '../../tsconfig.json',
})
