const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { readdir, access, lstat } = require('fs/promises');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const base = __dirname;
const getEntries = async () => {
  const files = await readdir(base);
  const entryTypes = ['entry.js', 'entry.jsx'];
  let result = [];
  for (const entryType of entryTypes) {
    result.push(
      ...(await Promise.all(
        files.map(async (f) => {
          const entryPath = path.join(base, f, entryType);
          const exists = await access(entryPath)
            .then(() => true)
            .catch(() => false);

          return {
            isValid:
              exists && (await lstat(path.join(base, f, entryType))).isFile(),
            fileName: f,
            path: entryPath,
          };
        }),
      )),
    );
  }

  return result.filter((r) => r.isValid);
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
      entries.map((entry) => [entry.fileName, entry.path]),
    ),
    resolve: {
      extensions: ['.jsx', '.js', '.ts', '.tsx', '...'],
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
            chunks: [entry.fileName],
            title: 'Bangle App',
            filename: entry.fileName + '.html',
          }),
      ),
    ],
    module: {
      rules: [
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          use: ['file-loader'],
        },
        {
          test: /\.(js|jsx|ts|tsx)$/,
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
