import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/main.ts',
  output: {
    dir: '../../dist/apps/api',
    format: 'cjs',
    sourcemap: true,
    entryFileNames: '[name].js',
  },
  // External: all dependencies (npm packages, @taskflow libs, node built-ins)
  external: [/^@/, /^[a-z]/, /node:/],
  tsconfig: '../../tsconfig.json',
})
