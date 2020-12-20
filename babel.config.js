// babel.config.js

const DEBUG = false;

module.exports = (api) => {
  if (api.env('test')) {
    return {
      presets: [
        '@babel/preset-react',
        [
          '@babel/preset-env',
          {
            debug: DEBUG,
            targets: {
              node: 'current',
            },
          },
        ],
      ],
    };
  }

  let envOptions = {
    debug: DEBUG,
    targets: {
      browsers: ['last 4 Chrome versions', 'last 4 Firefox versions'],
    },
  };

  // // browserslist is not configured when running integration tests
  if (api.env('integration')) {
    envOptions.targets = 'last 2 chrome version';
  }

  return {
    presets: ['@babel/preset-react', ['@babel/preset-env', envOptions]],
    plugins: [
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      '@babel/plugin-proposal-optional-chaining',
    ],
  };
};
