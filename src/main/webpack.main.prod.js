const path = require('path');
const merge = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const common = require('../../webpack.common.js');

module.exports = merge.strategy({ plugins: 'replace' })(common, {
    mode: 'production',
    target: 'electron-main',
    entry: {
        app: './src/main/index.ts',
    },
    plugins: [new CleanWebpackPlugin()],
    output: {
        filename: 'main.js',
        path: path.resolve(path.normalize(path.join(__dirname, '..', '..')), 'dist/main'),
    },
});
