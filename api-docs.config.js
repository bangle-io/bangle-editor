const fs = require('fs');
// We are injecting handlebarsinstead of requiring it
// since handlebars is not a defined dependency at the root
// so yarn throws an error.
module.exports = (Handlebars, resolvePath) => {
  Handlebars.registerHelper('typedQueryCommand', function (param) {
    return `[QueryCommand](#querycommand)<${param}>`;
  });
  Handlebars.registerHelper('t', function (param) {
    return new Handlebars.SafeString('<code>' + param.fn(this) + '</code>');
  });

  Handlebars.registerHelper('npmInstallation', function (param) {
    let { name, peerDependencies = {} } = JSON.parse(
      fs.readFileSync(resolvePath(param + '/package.json'), 'utf-8'),
    );

    peerDependencies = Object.keys(peerDependencies).filter((r) =>
      r.startsWith('@banglejs/'),
    );

    const peerDependenciesStr =
      peerDependencies.length === 0
        ? ''
        : `# peer deps\nnpm install ${peerDependencies.join(' ')}\n`;

    return new Handlebars.SafeString(
      peerDependenciesStr + `npm install ${name}`,
    );
  });

  const apiPath = `/docs/api`;

  const coreLinks = {
    Component: `[Component](${apiPath}/core/#component)`,
    MarkSpec: `[MarkSpec](${apiPath}/core/#spec)`,
    NodeSpec: `[NodeSpec](${apiPath}/core/#spec)`,
    Plugins: `[Plugins](${apiPath}/core/#plugins)`,
    Keybindings: `[KeybindingsObject](${apiPath}/core/#keybindingsobject)`,
    Command: `[Command](${apiPath}/core/#command)`,
    CommandObject: `[CommandObject](${apiPath}/core/#commandobject)`,
    PluginKey: `[PluginKey](${apiPath}/core/#pluginkey)`,
    nodeViews: '',
    BangleEditorState: `[BangleEditorState](${apiPath}/core/#bangleeditorstate)`,
    BangleEditorStateProps: `[BangleEditorState](${apiPath}/core/#bangleeditorstate)`,
    SpecRegistry: `[SpecRegistry](${apiPath}/core/#specregistry)`,
  };

  const example = {
    ReactBasicEditorExample:
      '[React example](/docs/examples/react-basic-editor)',
    FloatingMenu: `[FloatingMenu example](/docs/examples/react-floating-menu)`,
    ReactEmojiSuggestExample: `[Emoji Suggest example](/docs/examples/react-emoji-suggest)`,
    BangleMarkdownExample: `[Bangle Markdown example](/docs/examples/markdown-editor)`,
  };

  return {
    shorthands: {
      example,
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
      reactMenu: {
        link: {
          FloatingMenu: `[FloatingMenu](${apiPath}/react_menu#floatingmenu-reactelement)`,
        },
      },
      tooltip: {
        link: {
          tooltipRenderOpts: `[tooltipRenderOpts]`,
        },
      },
      global: {
        link: {
          YourFirstEditorGuide: `[Your first editor guide](/docs/guides/first-editor)`,
          MarkdownSupport: ``,
          MarkdownExample: `[Markdown example](/docs/examples/markdown-editor)`,
          EditorOperationsGuide: `[commands guide](/docs/guides/commands)`,
          KeybindingsGuide: `[Keybindings Guide](/docs/guides/keybindings)`,
          ReactElement: `[React.Element](https://reactjs.org/docs/react-api.html#reactcomponent)`,
          ReactCustomRenderingGuide: `[React custom rendering guide](/docs/guides/custom-rendering-speech)`,
          // TODO to explain how to listen to changes in an editor. Maybe I need a guide without
          // react and a separate guide on
          ReactBasicExample: `[React Basic example](/docs/examples/react-basic-editor)`,
          ReactFloatingMenuExample: `[React Floating Menu example](/docs/examples/react-floating-menu)`,
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
        Schema:
          '[Prosemirror.Schema](https://prosemirror.net/docs/ref/#model.Schema)',
        PluginKey:
          '[Prosemirror.PluginKey](https://prosemirror.net/docs/ref/#state.PluginKey)',
        EditorProps:
          '[Prosemirror.EditorProps](https://prosemirror.net/docs/ref/#view.EditorProps)',
        NodeView:
          '[Prosemirror.NodeView](https://prosemirror.net/docs/ref/#view.NodeView)',
      },
    },
  };
};
