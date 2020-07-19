// babel.config.js
module.exports = (api) => {
  if (api.env('test')) {
    return {
      presets: [
        '@babel/preset-react',
        [
          '@babel/preset-env',
          {
            debug: true,
            targets: {
              node: 'current',
            },
          },
        ],
      ],
    };
  }
  return {
    presets: ['@babel/preset-react', ['@babel/preset-env', { debug: true }]],
  };
};
