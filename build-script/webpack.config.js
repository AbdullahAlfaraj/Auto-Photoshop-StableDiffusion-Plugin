const path = require('path')
// const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
        bundle: path.resolve(__dirname, '../typescripts/entry.ts'),
    },
    output: {
        path: path.resolve(__dirname, '../typescripts/dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs2',
    },
    mode: 'development',
    // mode: 'production',

    devtool: false,

    externals: {
        uxp: 'commonjs2 uxp',
        photoshop: 'commonjs2 photoshop',
        os: 'commonjs2 os',
        fs: 'commonjs2 fs',
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],

        fallback: {
            util: require.resolve('util/'),
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    configFile: path.resolve(__dirname, '../typescripts/tsconfig.json'),
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
            {
                test: /\.svg$/,
                use: ['@svgr/webpack', 'url-loader'],
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
