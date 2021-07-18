import { domSerializationHelpers } from '@bangle.dev/core';
import type { MarkdownSerializerState } from '@bangle.dev/markdown';
import type { Node } from '@bangle.dev/pm';

const name = 'wikiLink';
export const spec = specFactory;

function specFactory() {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tag: 'span',
    parsingPriority: 52,
  });

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
      toDOM,
      parseDOM,
    },
    markdown: {
      toMarkdown: (state: MarkdownSerializerState, node: Node) => {
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
          getAttrs: (tok: any) => {
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

  return spec;
}
