import webpack from 'webpack'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import ProgressBar from './webpack-plugins/ProgressBar.mjs'
import DeleteBeforeEmit from './webpack-plugins/DeleteBeforeEmit.mjs'

// Redefining __dirname is a temporary solution, due to https://github.com/nodejs/help/issues/2907
const __dirname = dirname(fileURLToPath(import.meta.url))
const baseDirectoryPath = __dirname
const srcDirectoryPath = resolve(baseDirectoryPath, 'src')
const { WatchIgnorePlugin } = webpack

export default ({ typeScriptConfigFilePath }) => ({
  context: baseDirectoryPath,
  plugins: [
    new ProgressBar(),
    new DeleteBeforeEmit(resolve(baseDirectoryPath, 'types')),
    new WatchIgnorePlugin({ paths: [resolve(baseDirectoryPath, 'types')] })
  ],
  entry: {
    index: [resolve(srcDirectoryPath, 'index.ts')]
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        include: srcDirectoryPath,
        options: {
          configFile: typeScriptConfigFilePath,
          onlyCompileBundledFiles: true
        }
      },
      {
        test: /\.js$/,
        loader: 'source-map-loader',
        include: /node_modules/,
        enforce: 'pre'
      }
    ]
  },
  resolveLoader: {
    modules: [srcDirectoryPath, 'node_modules']
  },
  resolve: {
    symlinks: false,
    extensions: ['.tsx', '.ts', '.js']
  }
})
