import { tableNodes, tableEditing, goToNextCell } from 'prosemirror-tables';
import { keymap } from 'prosemirror-keymap';
import { weakCache } from '@bangle.dev/core/utils/utils';

const calculateColumnWidth = weakCache(function calculateColumnWidth(
  tableNode,
) {
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
});

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
        return dom.style.backgroundColor || null;
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

const toMarkdownCell = (state, node) => {
  node.forEach(function (child, _, i) {
    const originalEsc = state.esc;

    state.esc = (str, ...args) => {
      str = originalEsc(str, ...args);
      str = str.replace(/\|/gi, '\\$&');
      return str;
    };

    state.renderInline(child);

    state.esc = originalEsc;
  });
};

export const table = {
  name: 'table',
  type: 'node',
  schema: nodes.table,
  markdown: {
    toMarkdown: (state, node) => {
      state.flushClose(1);
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

export const tableCell = {
  name: 'table_cell',
  type: 'node',
  schema: nodes.table_cell,
  markdown: {
    toMarkdown: toMarkdownCell,
    parseMarkdown: {
      td: {
        block: 'table_cell',
        getAttrs: (tok) => ({ align: tok.align }),
      },
    },
  },
};

export const tableHeader = {
  name: tableHeaderName,
  type: 'node',
  schema: nodes.table_header,
  markdown: {
    // cell and header are same as far as serialization is concerned
    toMarkdown: toMarkdownCell,
    parseMarkdown: {
      th: {
        block: 'table_header',
        getAttrs: (tok) => ({ align: tok.align }),
      },
    },
  },
};

export const tableRow = {
  name: 'table_row',
  type: 'node',
  schema: nodes.table_row,
  markdown: {
    toMarkdown: (state, node, parent) => {
      state.ensureNewLine();

      const width = calculateColumnWidth(parent);

      // child is either table_header or table_cell
      node.forEach(function (child, _, i) {
        i === 0 && state.write('| ');
        state.render(child, node, i);

        const extraSpace = width[i] - 2 - child.textContent.length;
        state.write(' '.repeat(Math.max(0, extraSpace)));

        state.write(' |');
        child !== node.lastChild && state.write(' ');
      });

      state.ensureNewLine();
      // check if it is the header row
      if (node.firstChild.type.name === tableHeaderName) {
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
      state.closeBlock();
    },
    parseMarkdown: {
      tr: {
        block: 'table_row',
      },
    },
  },
};

export const tablePlugins = () => {
  return [
    tableEditing(),
    keymap({
      'Tab': goToNextCell(1),
      'Shift-Tab': goToNextCell(-1),
    }),
  ];
};
