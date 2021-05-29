const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { readdir, access, lstat } = require('fs/promises');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const base = __dirname;
const getEntryPath = (f) => path.join(base, f, 'entry.js');
const getEntries = async () => {
  const files = await readdir(base);
  return Promise.all(
    files.map(async (f) => {
      const exists = await access(getEntryPath(f))
        .then(() => true)
        .catch(() => false);

      return [
        exists && (await lstat(path.join(base, f, 'entry.js'))).isFile(),
        f,
      ];
    }),
  ).then((files) => files.filter((f) => f[0]).map((r) => r[1]));
};

module.exports = async (env, argv) => {
  const isProduction = env && env.production;
  const mode = isProduction ? 'production' : 'development';
  // eslint-disable-next-line no-process-env
  if (isProduction && process.env.NODE_ENV !== 'production') {
    throw new Error('NODE_ENV not production');
  }
  const entries = await getEntries();
  console.log(`
  ====================${mode}========================
  `);
  return {
    target: 'web',
    mode,
    entry: Object.fromEntries(
      entries.map((entry) => [entry, getEntryPath(entry)]),
    ),
    resolve: {
      extensions: ['.jsx', '.js', '...'],
      // TODO fix me punycode
      fallback: { punycode: require.resolve('punycode/') },
    },
    resolveLoader: {},
    output: {
      filename: '[name].bundle.js',
      chunkFilename: '[name].bundle.[contenthash].js',
      path: path.resolve(__dirname, 'build'),
    },
    plugins: [
      new CleanWebpackPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(
          isProduction ? 'production' : 'development',
        ),
      }),
      ...entries.map(
        (entry) =>
          new HtmlWebpackPlugin({
            inject: true,
            chunks: [entry],
            title: 'Bangle App',
            filename: entry + '.html',
          }),
      ),
    ],
    module: {
      rules: [
        {
          test: /\.(png|svg|jpg|gif)$/,
          use: ['file-loader'],
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: require.resolve('babel-loader'),
            options: { rootMode: 'upward' },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
  };
};
