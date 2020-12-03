// We are injecting handlebars instead of requiring it
// since handlebars is not a defined dependency at the root
// so yarn throws an error.
module.exports = (Handlebars) => {
  Handlebars.registerHelper('customQueryCommand', function (param) {
    return `customQuery ${param}`;
  });

  return {
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
};
