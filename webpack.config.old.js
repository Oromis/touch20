var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ZipPlugin = require('zip-webpack-plugin');

module.exports = {
    // your root file
    entry: './src/main.js',

    // output JS bundle to: build/bundle.js
    output: {
        path: './build',
        filename: 'main.js'
    },

    resolve: {
        // you can load named modules from any dirs you want.
        // attempts to find them in the specified order.
        modulesDirectories: [
            './src/lib',
            'node_modules'
        ]
    },

    module: {
        // you can tell webpack to avoid parsing for dependencies in any files matching an Array of regex patterns
        noParse: [
            /(node_modules|~)\/(jquery)\//gi
        ],

        loaders: [
            // transpile ES6/7 to ES5 via babel
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            },
            // bundle LESS and CSS into a single CSS file, auto-generating -vendor-prefixes
            {
                test: /\.(less|css)$/,
                exclude: /\b(some\-css\-framework|whatever)\b/i,
                loader: ExtractTextPlugin.extract("style-loader?sourceMap", "css-loader?sourceMap!autoprefixer?browsers=last 2 version!less-loader")
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

    plugins: ([
        // Avoid publishing files when compilation failed:
        new webpack.NoErrorsPlugin(),

        // Aggressively remove duplicate modules:
        new webpack.optimize.DedupePlugin(),

        // Write out CSS bundle to its own file:
        new ExtractTextPlugin('style.css', {allChunks: true}),

        // Copy manifest.json
        new CopyWebpackPlugin([
            {from: 'manifest.json'},
            {from: 'src/images', to: 'img'}
        ]),

        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': `'${process.env.NODE_ENV}'`
            }
        })
    ]).concat(process.env.NODE_ENV === 'development' ? [] : [
        new webpack.optimize.OccurenceOrderPlugin(),

        // minify the JS bundle
        new webpack.optimize.UglifyJsPlugin({
            output: {comments: false},
            exclude: [/\.min\.js$/gi]		// skip pre-minified libs
        }),

        // new ZipPlugin({
        //   filename: 'touch20.zip',
        //   exclude: [/\.zip$/],
        // })
    ]),

    // Pretty terminal output
    stats: {colors: true},

    // Generate external sourcemaps for the JS & CSS bundles
    devtool: 'source-map'
};