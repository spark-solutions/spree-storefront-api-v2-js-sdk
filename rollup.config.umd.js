import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import sizes from 'rollup-plugin-sizes'
import { terser } from 'rollup-plugin-terser'

// Redefining __dirname is a temporary solution, due to https://github.com/nodejs/help/issues/2907
const __dirname = dirname(fileURLToPath(import.meta.url))
const baseDirectoryPath = __dirname
const srcDirectoryPath = resolve(baseDirectoryPath, 'src')
const distDirectoryPath = resolve(baseDirectoryPath, 'dist')
const typeScriptConfigFilePath = resolve(baseDirectoryPath, 'tsconfig-umd.json')

export default {
  input: resolve(srcDirectoryPath, 'index.ts'),
  output: {
    file: resolve(distDirectoryPath, 'index.umd.js'),
    format: 'umd', // Works as AMD, CJS and IIFE all in one.
    name: 'SpreeSDK',
    sourcemap: true,
    globals: {
      axios: 'axios',
      qs: 'Qs'
    }
  },
  plugins: [
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
