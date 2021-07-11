import { domSerializationHelpers } from '@bangle.dev/core';

const name = 'wikiLink';
export const spec = specFactory;

function specFactory() {
  let spec = {
    type: 'node',
    name: name,
    schema: {
      attrs: {
        path: {
          default: null,
        },
        title: {
          default: null,
        },
      },
      inline: true,
      group: 'inline',
      selectable: false,
      draggable: true,
    },
    markdown: {
      toMarkdown: (state, node) => {
        state.text('[[', false);
        const { path, title } = node.attrs;
        let content = path;
        if (title && title !== path) {
          content += '|' + title;
        }
        state.text(content, false);
        state.text(']]', false);
      },

      parseMarkdown: {
        wiki_link: {
          block: name,
          getAttrs: (tok) => {
            if (typeof tok.payload === 'string') {
              let [path, title] = tok.payload.split('|');
              return { path, title };
            }
          },
          noCloseToken: true,
        },
      },
    },
  };
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tag: 'span',
    parsingPriority: 52,
  });

  spec.schema = {
    ...spec.schema,
    toDOM,
    parseDOM,
  };

  return spec;
}
