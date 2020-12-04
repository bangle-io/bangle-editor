// We are injecting handlebars instead of requiring it
// since handlebars is not a defined dependency at the root
// so yarn throws an error.
module.exports = (Handlebars) => {
  Handlebars.registerHelper('typedQueryCommand', function (param) {
    return `[QueryCommand](#querycommand)<${param}>`;
  });
  Handlebars.registerHelper('t', function (param) {
    return new Handlebars.SafeString('<code>' + param.fn(this) + '</code>');
  });

  const basePath = `/docs/api`;

  const coreLinks = {
    Component: `[Component](${basePath}/core/#component)`,
    MarkSpec: `[MarkSpec](${basePath}/core/#spec)`,
    NodeSpec: `[NodeSpec](${basePath}/core/#spec)`,
    Plugins: `[Plugins](${basePath}/core/#plugins)`,
    Keybindings: `[KeybindingsObject](${basePath}/core/#keybindingsobject)`,
    Command: `[Command](${basePath}/core/#command)`,
    CommandObject: `[CommandObject](${basePath}/core/#commandobject)`,
    PluginKey: `[PluginKey](${basePath}/core/#pluginkey)`,
    nodeViews: '',
  };

  return {
    shorthands: {
      core: {
        link: coreLinks,
        text: {
          emptyCut:
            'Execute a clipboard _cut_ on the node when the selection is empty.',
          emptyCopy:
            'Execute a clipboard _copy_ on the node when the selection is empty.',
          insertEmptyParaAbove:
            'Inserts an empty [paragraph](#paragraph-component) above.',
          insertEmptyParaBelow:
            'Inserts an empty [paragraph](#paragraph-component) below.',
          pluginsParamKeybindings: `**keybindings**: ?${coreLinks.Keybindings}=defaultKeys  \n For a list of allowed keys see **defaultKeys** below.`,
        },
      },
      global: {
        link: {
          UnderstandingBangleGuide: `[UnderstandingBangleGuide]`,
          MarkdownSupport: `[MarkdownSupport]`,
          MarkdownGuide: `[MarkdownGuide]`,
          EditorOperationsGuide: `[EditorOperationsGuide]`,
          KeybindingsGuide: `[KeybindingsGuide]`,
          MenuGuide: `[MenuGuide]`,
        },
        useRightSidebar:
          ':bulb: _Use the right sidebar or the hamburger at bottom-right (mobile screens) to navigate quickly_.',
      },
      Prosemirror: {
        NodeSpec:
          '[Prosemirror.NodeSpec](https://prosemirror.net/docs/ref/#model.NodeSpec)',
        MarkSpec:
          '[Prosemirror.MarkSpec](https://prosemirror.net/docs/ref/#model.MarkSpec)',
        PluginSpec:
          '[Prosemirror.Plugin](https://prosemirror.net/docs/ref/#state.PluginSpec)',
        EditorState:
          '[Prosemirror.EditorState](https://prosemirror.net/docs/ref/#state.EditorState)',
        EditorView:
          '[Prosemirror.EditorView](https://prosemirror.net/docs/ref/#view.EditorView)',
        Dispatch:
          '?⁠fn(tr: [Prosemirror.Transaction](https://prosemirror.net/docs/ref/#state.Transaction))',
        SchemaSpec:
          '[Prosemirror.SchemaSpec](https://prosemirror.net/docs/ref/#model.SchemaSpec)',
        PluginKey:
          '[Prosemirror.PluginKey](https://prosemirror.net/docs/ref/#state.PluginKey)',
      },
    },
  };
};
