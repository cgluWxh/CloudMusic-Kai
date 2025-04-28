const path = require('path');
const { webpack, ProvidePlugin } = require('webpack');

module.exports = {
  mode: "production",
  entry: {
    app: './request.js'
  },
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url-polyfill"),
      buffer: require.resolve("buffer"),
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
        // exclude: /node_modules/ // exclude写在babel.config.js，这里就可以不写了
      }
    ]
  },
  plugins: [
    new ProvidePlugin({
      Buffer: ["buffer", "Buffer"]
    })
  ]
};
