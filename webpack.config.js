const path = require('path');
const my_webpack = require('webpack');
const NoEmitOnErrorsPlugin = my_webpack.NoEmitOnErrorsPlugin;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

process.env.NODE_ENV = "production"

module.exports = {
  name: "dev-config",
  mode: "development", // "production", "development", "none"
  entry: './src/main.js',

  // output JS bundle to: build/bundle.js
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'main.js',
    uniqueName: "touch20",
  },

  module: {
    noParse: [
      /(node_modules|~)\/(jquery)\//gi
    ],
    rules: [
      // transpile ES6/7 to ES5 via babel
      {
        test: /\.m?js$/, ///\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      // bundle LESS and CSS into a single CSS file, auto-generating -vendor-prefixes
        //Updated to MiniCssExtractPlugin
      {
        test: /\.css$/i, //test: /\.(less|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "less-loader"
            ]
        //exclude: /\b(some\-css\-framework|whatever)\b/i,
       // loader: MiniCssExtractPlugin.extract("style-loader?sourceMap", "css-loader?sourceMap!autoprefixer?browsers=last 2 version!less-loader")
      },

      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSS
          "style-loader",
          "css-loader",
          "less-loader",
        ],
      },

      // Copy static files to output folder
      {
        test: /\.json$/,
        loader: 'file'
      },
      // Embed icons into CSS
      {
        test: /\.(png|jpe?g)$/,
        loader: 'url-loader'
      }
    ]
  },

  resolve: {
    // options for resolving module requests
    // (does not apply to resolving of loaders)
    // directories where to look for modules (in order)
    modules: [
      './src/lib',
      'node_modules'
    ],
    // extensions that are used
    extensions: [".js", ".json", ".jsx", ".css"],

  },

  plugins: ([
    // Avoid publishing files when compilation failed:
    new my_webpack.NoEmitOnErrorsPlugin(),

    // Write out CSS bundle to its own file:
    new MiniCssExtractPlugin({filename: 'style.css'}),

    // Copy manifest.json
    new CopyWebpackPlugin(
        {patterns: [
      {from: 'manifest.json', to: path.resolve(__dirname, "build")},
      {from: 'src/images', to: 'img'}
    ]}),

    // new my_webpack.DefinePlugin({
    //   'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    // })
  ]),
      //.concat(process.env.NODE_ENV === 'development' ? [] : [

    // new ZipPlugin({
    //   filename: 'touch20.zip',y
    //   exclude: [/\.zip$/],
    // })
  //]),

  // Pretty terminal output
  stats: {colors: true},

  // Generate external sourcemaps for the JS & CSS bundles
  devtool: 'source-map'
};
