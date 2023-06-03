
const path = require('path')
// const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
        bundle: './typescripts/entry.ts',
    },
    output: {
        path: path.resolve(__dirname, './typescripts/dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs2',
    },
    mode: 'development',
    // mode: 'production',
    devtool: 'inline-source-map', // won't work on XD due to lack of eval
    externals: {
        uxp: 'commonjs2 uxp',
        photoshop: 'commonjs2 photoshop',
        os: 'commonjs2 os',
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    configFile: 'tsconfig.json',
                },
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    plugins: [
                        '@babel/transform-react-jsx',
                        '@babel/proposal-object-rest-spread',
                        '@babel/plugin-syntax-class-properties',
                    ],
                },
            },
            {
                test: /\.png$/,
                exclude: /node_modules/,
                loader: 'file-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        //new CleanWebpackPlugin(),
        // new CopyPlugin(['plugin'], {
        //     copyUnmodified: true,
        // }),
    ],
}
