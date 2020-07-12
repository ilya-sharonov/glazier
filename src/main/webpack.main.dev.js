const merge = require('webpack-merge');
const common = require('../../webpack.common.js');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ElectronReloadPlugin = require('webpack-electron-reload')({
    path: path.resolve('./dist/main/main.js'),
});

module.exports = merge.strategy({ plugins: 'replace' })(common, {
    mode: 'development',
    target: 'electron-main',
    devtool: 'inline-source-map',
    entry: {
        app: './src/main/index.ts',
    },
    plugins: [new CleanWebpackPlugin(), ElectronReloadPlugin()],
    output: {
        filename: 'main.js',
        path: path.resolve(path.normalize(path.join(__dirname, '..', '..')), 'dist/main'),
    },
});
