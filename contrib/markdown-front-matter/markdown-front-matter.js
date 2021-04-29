import { domSerializationHelpers } from '@bangle.dev/core/utils/utils';

export const spec = specFactory;

const name = 'markdownFrontMatter';

function specFactory({} = {}) {
  const spec = {
    type: 'node',
    name: name,
    schema: {
      group: 'frontMatter',
      atom: true,
      isolating: true,
      attrs: {
        data: {
          default: '',
        },
      },
    },
    markdown: {
      toMarkdown(state, node) {
        state.write('---\n');
        state.text(node.attrs.data, false);
        state.write('\n---');
        state.closeBlock(node);
      },
      parseMarkdown: {
        front_matter: {
          block: name,
          getAttrs: (tok) => {
            if (typeof tok.meta === 'string') {
              return { data: tok.meta };
            }
          },
          noCloseToken: true,
        },
      },
    },
  };

  spec.schema = {
    ...spec.schema,
    ...domSerializationHelpers(name, {
      tag: 'div',
      content: (node) => node.attrs.data,
      parsingPriority: 52,
    }),
  };

  return spec;
}
