const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const PnpWebpackPlugin = require(`pnp-webpack-plugin`);

module.exports = (env, argv) => {
  const isProduction = env && env.production;
  const mode = isProduction ? 'production' : 'development';
  if (isProduction && process.env.NODE_ENV !== 'production') {
    throw new Error('NODE_ENV not production');
  }
  console.log(`
  ====================${mode}========================
  `);
  return {
    target: 'web',
    mode,
    entry: './src/index.js',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    stats: { maxModules: 50, modulesSort: 'size' },
    resolve: {
      plugins: [PnpWebpackPlugin],
    },
    resolveLoader: {
      plugins: [PnpWebpackPlugin.moduleLoader(module)],
    },
    devServer: {
      contentBase: './build',
    },
    output: {
      filename: 'main.js',
      chunkFilename: '[name].bundle.js',
      path: path.resolve(__dirname, 'build'),
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Bangle',
        template: 'public/index.html',
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
        ignoreOrder: false,
      }),
      new webpack.EnvironmentPlugin({
        NODE_ENV: isProduction ? 'production' : 'development',
      }),
    ],
    module: {
      rules: [
        {
          test: /\.(png|svg|jpg|gif)$/,
          use: ['file-loader'],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: require.resolve('babel-loader'),
            options: { presets: ['@babel/preset-react'] },
          },
        },

        {
          test: /\.css$/i,
          use: [
            // 'style-loader',
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: '/',
                hmr: process.env.NODE_ENV === 'development',
              },
            },
            {
              loader: 'css-loader',
              options: { importLoaders: 1, sourceMap: true },
            },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: [require('tailwindcss'), require('autoprefixer')],
              },
            },
          ],
        },
      ],
    },
  };
};
