// babel.config.js

const debug = false;
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
  };
};
