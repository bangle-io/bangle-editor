import { tableNodes, tableEditing, goToNextCell } from 'prosemirror-tables';
import { keymap } from 'prosemirror-keymap';

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
      // child is either table_header or table_cell
      node.forEach(function (child, _, i) {
        i === 0 && state.write('| ');
        state.render(child, node, i);
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
              state.write(':---');
              break;
            }
            case 'center': {
              state.write(':---:');
              break;
            }
            case 'right': {
              state.write('---:');
              break;
            }
            default: {
              state.write('----');
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
