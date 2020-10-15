import { PluginKey, Plugin } from 'prosemirror-state';
import { Extension } from 'bangle-core/extensions/index';

export class TrailingNode extends Extension {
  get name() {
    return 'trailing_node_addon';
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
            const type = schema.nodes[this.options.node];
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
  }
}
