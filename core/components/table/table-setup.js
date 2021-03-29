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

export const table = {
  name: 'table',
  type: 'node',
  schema: nodes.table,
  markdown: {
    toMarkdown: (state, node) => {},
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
    toMarkdown: (state, node) => {},
    parseMarkdown: {
      td: {
        block: 'table_cell',
        getAttrs: (tok) => ({ align: tok.align }),
      },
    },
  },
};

export const tableHeader = {
  name: 'table_header',
  type: 'node',
  schema: nodes.table_header,
  markdown: {
    toMarkdown: (state, node) => {},
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
    toMarkdown: (state, node) => {},
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
