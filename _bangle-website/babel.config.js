module.exports = {
  presets: [require.resolve('@docusaurus/core/lib/babel/preset')],
  plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]],
};
