var path = require('path');
var webpack = require('webpack');
var webpackCfg = require('./webpack.config');

var cfg = Object.assign({}, webpackCfg);

cfg.devtool = 'cheap-module-eval-source-map';

cfg.plugins = cfg.plugins.concat(
  [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development')
      }
    }),

    new webpack.HotModuleReplacementPlugin(),

    new webpack.NoErrorsPlugin()
  ]
);

module.exports = cfg;
