const path = require("path");

module.exports = {
    entry: {
        main: './src/index.js',
        "pdf.worker": "pdfjs-dist/build/pdf.worker.entry",
    },
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        static: './dist',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};