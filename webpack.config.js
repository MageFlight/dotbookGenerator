const path = require("path");

module.exports = {
    entry: './src/index.js',
    mode: 'development',
    devServer: {
        static: './dist',
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};