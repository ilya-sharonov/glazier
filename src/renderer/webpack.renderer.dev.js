const merge = require('webpack-merge');
const common = require('../../webpack.common.js');
const path = require('path');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    target: 'electron-renderer',
    entry: {
        app: './src/renderer/index.ts',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist/renderer'),
    },
    devServer: {
        contentBase: './dist/renderer',
        compress: true,
        port: 9000,
    },
});
