// babel.config.js

const debug = false; //true;
module.exports = (api) => {
  if (api.env('test')) {
    return {
      presets: [
        '@babel/preset-react',
        [
          '@babel/preset-env',
          {
            debug: debug,
            targets: {
              node: 'current',
            },
          },
        ],
      ],
    };
  }
  return {
    presets: ['@babel/preset-react', ['@babel/preset-env', { debug: debug }]],
    plugins: [
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      '@babel/plugin-proposal-optional-chaining',
    ],
  };
};
