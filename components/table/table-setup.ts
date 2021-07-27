import type { Node } from '@bangle.dev/pm';
import { goToNextCell, keymap, tableEditing, tableNodes } from '@bangle.dev/pm';
// Not importing @bangle.dev/markdown to avoid cyclic dependency
import type Token from 'markdown-it/lib/token';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { BaseRawNodeSpec, RawPlugins } from '@bangle.dev/core';

function calculateColumnWidth(tableNode: Node) {
  const sizeMap = new Map();
  let maxColIndex = 0;
  tableNode.forEach((row) => {
    row.forEach((cell, _, colIndex) => {
      if (colIndex > maxColIndex) {
        maxColIndex = colIndex;
      }

      if (!cell) {
        return;
      }

      const textLength = cell.textContent.length + 2;

      if (!sizeMap.has(colIndex)) {
        sizeMap.set(colIndex, textLength);
      }

      if (textLength > sizeMap.get(colIndex)) {
        sizeMap.set(colIndex, textLength);
      }
    });
  });

  return Array.from({ length: maxColIndex + 1 }, (_, k) => sizeMap.get(k) || 1);
}

const nodes = tableNodes({
  tableGroup: 'block',
  cellContent: 'block+',
  cellAttributes: {
    align: {
      default: null,
      setDOMAttr(value, attrs) {
        if (value != null) {
          attrs.style = (attrs.style || '') + `text-align: ${value};`;
        }
      },
    },
    background: {
      default: null,
      getFromDOM(dom) {
        return (dom as HTMLElement).style.backgroundColor || null;
      },
      setDOMAttr(value, attrs) {
        if (value) {
          attrs.style = (attrs.style || '') + `background-color: ${value};`;
        }
      },
    },
  },
});

const tableHeaderName = 'table_header';

const toMarkdownCell = (state: MarkdownSerializerState, node: Node) => {
  node.forEach(function (child, _, i) {
    const originalEsc = state.esc;

    (state as any).esc = (str: string, ...args: any[]) => {
      str = originalEsc(str, ...args);
      str = str.replace(/\|/gi, '\\$&');
      return str;
    };

    state.renderInline(child);

    state.esc = originalEsc;
  });
};

export const table: BaseRawNodeSpec = {
  name: 'table',
  type: 'node',
  schema: nodes.table,
  markdown: {
    toMarkdown: (state: MarkdownSerializerState, node: Node) => {
      // flushClose is not added to the typings
      (state as any).flushClose(1);
      state.ensureNewLine();
      state.write('\n');
      state.renderContent(node);
      return;
    },
    parseMarkdown: {
      table: {
        block: 'table',
      },
    },
  },
};

export const tableCell: BaseRawNodeSpec = {
  name: 'table_cell',
  type: 'node',
  schema: nodes.table_cell,
  markdown: {
    toMarkdown: toMarkdownCell,
    parseMarkdown: {
      td: {
        block: 'table_cell',
        getAttrs: (tok: Token) => ({ align: (tok as any).align }),
      },
    },
  },
};

export const tableHeader: BaseRawNodeSpec = {
  name: tableHeaderName,
  type: 'node',
  schema: nodes.table_header,
  markdown: {
    // cell and header are same as far as serialization is concerned
    toMarkdown: toMarkdownCell,
    parseMarkdown: {
      th: {
        block: 'table_header',
        getAttrs: (tok: Token) => ({ align: (tok as any).align }),
      },
    },
  },
};

export const tableRow: BaseRawNodeSpec = {
  name: 'table_row',
  type: 'node',
  schema: nodes.table_row,
  markdown: {
    toMarkdown: (state: MarkdownSerializerState, node: Node, parent: Node) => {
      state.ensureNewLine();

      const width = calculateColumnWidth(parent);

      // child is either table_header or table_cell
      node.forEach(function (child, _, i) {
        i === 0 && state.write('| ');
        // render has missing types for the 2nd and 3rd param (parent and index)
        (state.render as any)(child, node, i);

        const extraSpace = width[i] - 2 - child.textContent.length;
        state.write(' '.repeat(Math.max(0, extraSpace)));

        state.write(' |');
        child !== node.lastChild && state.write(' ');
      });

      state.ensureNewLine();
      // check if it is the header row
      if (node.firstChild?.type.name === tableHeaderName) {
        node.forEach(function (child, _, i) {
          i === 0 && state.write('|');
          const { align } = child.attrs;
          switch (align) {
            case 'left': {
              state.write(':');
              const extraSpace = width[i] - 1;
              state.write('-'.repeat(Math.max(0, extraSpace)));

              break;
            }
            case 'center': {
              state.write(':');
              const extraSpace = width[i] - 2;
              state.write('-'.repeat(Math.max(0, extraSpace)));
              state.write(':');

              break;
            }
            case 'right': {
              const extraSpace = width[i] - 1;
              state.write('-'.repeat(Math.max(0, extraSpace)));

              state.write(':');
              break;
            }
            default: {
              const extraSpace = width[i];
              state.write('-'.repeat(Math.max(0, extraSpace)));

              break;
            }
          }
          state.write('|');
        });
      }
    },
    parseMarkdown: {
      tr: {
        block: 'table_row',
      },
    },
  },
};

export const tablePlugins = (): RawPlugins => {
  return [
    tableEditing(),
    keymap({
      'Tab': goToNextCell(1),
      'Shift-Tab': goToNextCell(-1),
    }),
  ];
};
