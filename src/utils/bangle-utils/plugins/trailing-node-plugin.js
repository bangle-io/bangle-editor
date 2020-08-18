import { Extension } from '../extensions';
import { PluginKey, Plugin } from 'prosemirror-state';

export class TrailingNodePlugin extends Extension {
  get name() {
    return 'trailing_node_plugin';
  }

  get defaultOptions() {
    return {
      node: 'paragraph',
      notAfter: ['paragraph'],
    };
  }

  get plugins() {
    const plugin = new PluginKey(this.name);
    const disabledNodes = Object.entries(this.editor.schema.nodes)
      .map(([, value]) => value)
      .filter((node) => this.options.notAfter.includes(node.name));

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

            const { doc, schema, tr } = state;
            const type = schema.nodes[this.options.node];
            const transaction = tr.insert(doc.content.size, type.create());

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
  }
}
