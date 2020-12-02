const Handlebars = require('handlebars');

Handlebars.registerHelper('customQueryCommand', function (param) {
  return `customQuery ${param}`;
});

module.exports = {
  shorthands: {
    link: {
      Component: 'Papa',
      SpecFactory: '',
      MarkSpecFactory: '',
      NodeSpecFactory: '[NodeSpecFactory](https://google.com)',
      PluginsFactory: '',
      Keybindings: '',
      Command: '',
      CommandsObject: '',
      QueryCommand: {
        boolean: '',
      },
      nodeViews: '',
      MarkdownSupport: '',
    },
    text: {
      emptyCut: '',
      emptyCopy: '',
      insertEmptyParaAbove: '',
      insertEmptyParaBelow: '',
      pluginsParamKeybindings: '',
      Nodes: '',
      Marks: '',
    },
  },
};
