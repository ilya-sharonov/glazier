const path = require('path');
const merge = require('webpack-merge');
const common = require('../../webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    target: 'electron-renderer',
    entry: {
        app: './src/renderer/index.ts',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(path.normalize(path.join(__dirname, '..', '..')), 'dist/renderer'),
    },
});
