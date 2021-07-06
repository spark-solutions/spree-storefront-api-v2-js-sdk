import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import sizes from 'rollup-plugin-sizes'
import { terser } from 'rollup-plugin-terser'
import del from 'rollup-plugin-delete'

// Redefining __dirname is a temporary solution, due to https://github.com/nodejs/help/issues/2907
const __dirname = dirname(fileURLToPath(import.meta.url))
const baseDirectoryPath = __dirname
const srcDirectoryPath = resolve(baseDirectoryPath, 'src')
const distDirectoryPath = resolve(baseDirectoryPath, 'dist')
const typeScriptConfigFilePath = resolve(baseDirectoryPath, 'tsconfig-esm.json')

export default {
  input: resolve(srcDirectoryPath, 'index.ts'),
  output: {
    file: resolve(distDirectoryPath, 'index.esm.mjs'),
    format: 'es',
    sourcemap: true
  },
  plugins: [
    del({ targets: resolve(baseDirectoryPath, 'types') }),
    sizes(),
    json(),
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: typeScriptConfigFilePath,
      include: './src/**'
    }),
    terser()
  ],
  external: ['axios', 'qs']
}
