const { merge } = require('webpack-merge')
const base = require('./base')

module.exports = merge(base, {
  // mode: 'production',
  output: {
    filename: 'bundle.min.js',
    clean: true
  },
  devtool: false,
  performance: {
    maxEntrypointSize: 900000,
    maxAssetSize: 900000
  }
})
