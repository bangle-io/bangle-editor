import { PluginKey, Plugin } from '@bangle.dev/core/plugin';

export const spec = specFactory;
export const plugins = pluginsFactory;

const name = 'trailing_node_addon';

function specFactory() {
  return {
    name: name,
    type: 'component',
  };
}

// TODO can we move this to appendTransaction ?
function pluginsFactory({ node = 'paragraph', notAfter = ['paragraph'] } = {}) {
  const plugin = new PluginKey(name);
  return ({ schema }) => {
    const disabledNodes = Object.entries(schema.nodes)
      .map(([, value]) => value)
      .filter((node) => notAfter.includes(node.name));

    const map = new WeakMap();
    return [
      new Plugin({
        key: plugin,
        view: () => ({
          update: (view) => {
            const { state } = view;

            const { incorrectNodeAtEnd } = plugin.getState(state);
            if (!incorrectNodeAtEnd) {
              return;
            }

            // TODO For some reason (unknown bug) this keeps getting called
            // with the same state, to prevent that, I have added this quick hack
            // And I have only seen it happen when loading md files
            if (map.has(view.state)) {
              return;
            }

            const { doc, schema, tr } = view.state;
            const type = schema.nodes[node];
            const transaction = tr.insert(doc.content.size, type.create(''));
            map.set(view.state, true);
            view.dispatch(transaction);
          },
        }),
        state: {
          init: (_, state) => {
            return {
              incorrectNodeAtEnd: !disabledNodes.includes(
                state.tr.doc.lastChild.type,
              ),
            };
          },
          apply: (tr, value) => {
            if (!tr.docChanged) {
              return value;
            }
            return {
              incorrectNodeAtEnd: !disabledNodes.includes(
                tr.doc.lastChild.type,
              ),
            };
          },
        },
      }),
    ];
  };
}
