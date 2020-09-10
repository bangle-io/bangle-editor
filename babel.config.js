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
  return {
    presets: ['@babel/preset-react', ['@babel/preset-env', { debug: DEBUG }]],
    plugins: [
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      '@babel/plugin-proposal-optional-chaining',
    ],
  };
};
