const webpack = require('webpack')

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  output: {
    filename: 'navkolo.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /assets\S*\.html$/,
        type: 'asset/source'
      },
      {
        test: /assets\S*\.svg$/,
        type: 'asset/source'
      }
    ]
  },
  externals: {
    phaser: 'Phaser'
  },
  plugins: [
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true)
    })
  ]
}
