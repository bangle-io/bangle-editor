import markdownit from 'markdown-it';
import { MarkdownParser } from 'prosemirror-markdown';
import emojiParser from 'markdown-it-emoji';

export function markdownParser(schema) {
  return new MarkdownParser(
    schema,
    markdownit().use(emojiParser).use(todoListPlugin),
    tokens,
  );
}

const tokens = {
  blockquote: { block: 'blockquote' },
  paragraph: { block: 'paragraph' },
  list_item: { block: 'list_item' },
  bullet_list: { block: 'bullet_list' },
  ordered_list: {
    block: 'ordered_list',
    getAttrs: (tok) => ({ order: +tok.attrGet('start') || 1 }),
  },
  todo_item: {
    block: 'todo_item',
    getAttrs: (tok) => ({
      'data-name': 'todo_item',
      'data-done': tok.attrGet('isDone') || false,
    }),
  },
  todo_list: { block: 'todo_list' },
  heading: {
    block: 'heading',
    getAttrs: (tok) => ({ level: tok.tag.slice(1) }),
  },
  code_block: { block: 'code_block', noCloseToken: true },
  fence: {
    block: 'code_block',
    getAttrs: (tok) => ({ language: tok.info || '' }),
    noCloseToken: true,
  },
  hr: { node: 'horizontal_rule' },
  image: {
    node: 'image',
    getAttrs: (tok) => ({
      src: tok.attrGet('src'),
      title: tok.attrGet('title') || null,
      alt: (tok.children[0] && tok.children[0].content) || null,
    }),
  },
  hardbreak: { node: 'hard_break' },

  s: { mark: 'strike' },
  em: { mark: 'italic' },
  strong: { mark: 'bold' },
  link: {
    mark: 'link',
    getAttrs: (tok) => ({
      href: tok.attrGet('href'),
      title: tok.attrGet('title') || null,
    }),
  },
  code_inline: { mark: 'code', noCloseToken: true },
  emoji: {
    node: 'emoji',
    getAttrs: (tok) => {
      return {
        'data-emojikind': tok.markup,
      };
    },
  },
};

function todoListPlugin(md, options) {
  md.core.ruler.after('inline', 'gfm-todo-list', function (state) {
    var tokens = state.tokens;
    for (var i = 0; i < tokens.length; i++) {
      processToken(tokens, i);
    }
  });
}

function processToken(tokens, index) {
  if (tokens[index].type !== 'bullet_list_open') {
    return;
  }
  const children = getChildren(tokens, index);

  if (
    children
      .filter(([child]) => child.type === 'list_item_open')
      .every(([child, childIndex]) => !isListItemTodoItem(tokens, childIndex))
  ) {
    return;
  }

  // this means some or all children are todoItems
  if (children.some(([child]) => !child.type.startsWith('list_item_'))) {
    console.log(children, tokens, index);
    throw new Error('Expected all children to be of type list_item_*');
  }

  const closingToken = findMatchingCloseToken(tokens, index);

  if (closingToken === -1) {
    throw new Error('Must have a closing token');
  }

  tokens[index].type = 'todo_list_open';
  tokens[closingToken].type = 'todo_list_close';

  children.forEach(([todoItem]) => {
    if (todoItem.type === 'list_item_close') {
      todoItem.type = 'todo_item_close';
    }
    if (todoItem.type === 'list_item_open') {
      todoItem.type = 'todo_item_open';
    }
  });

  children
    .filter(([todoItem]) => todoItem.type === 'todo_item_open')
    .forEach(([todoItem, todoItemIndex]) => {
      // we add a +2 since the check works on the inline para node
      const inlineToken = tokens[todoItemIndex + 2];
      const inlineTokenChild = inlineToken.children[0];

      let isDone = false;
      if (startsWithTodoMarkdown(inlineTokenChild)) {
        if (
          inlineTokenChild.content?.charAt(1) === 'x' ||
          inlineTokenChild.content?.charAt(1) === 'X'
        ) {
          isDone = true;
        }
      }

      todoItem.attrs = todoItem.attrs
        ? [['isDone', isDone], ...todoItem.attrs]
        : [['isDone', isDone]];

      inlineTokenChild.content = trimTodoSquare(inlineTokenChild.content);
      inlineToken.content = trimTodoSquare(inlineToken.content);
    });
}

function findMatchingCloseToken(tokens, position) {
  const type = tokens[position].type;
  if (!type.endsWith('_open')) {
    throw new Error('expect type to be _open');
  }

  const endType = type.split('_open').join('') + '_close';

  var targetLevel = tokens[position].level;
  for (var i = position + 1; i < tokens.length; i++) {
    if (tokens[i].level === targetLevel && tokens[i].type === endType) {
      return i;
    }
  }
  return -1;
}

// returns children of same level
function getChildren(tokens, position) {
  const parentOpen = tokens[position];
  if (!parentOpen.type.endsWith('_open')) {
    throw new Error('Can only work with _open types');
  }

  const endType = parentOpen.type.split('_open').join('') + '_close';

  const result = [];
  for (let i = position + 1; i < tokens.length; i++) {
    const current = tokens[i];
    if (current.level < parentOpen.level) {
      break;
    }
    if (current.level === parentOpen.level && current.type === endType) {
      break;
    }

    if (current.level === parentOpen.level + 1) {
      result.push([current, i]);
    }
  }

  return result;
}

function trimTodoSquare(str) {
  return strStartsWithTodoMarkdown(str) ? str.slice(4) : str;
}

function strStartsWithTodoMarkdown(str) {
  return str
    ? str.startsWith('[ ] ') || str.startsWith('[x] ') || str.startsWith('[X] ')
    : false;
}

function startsWithTodoMarkdown(token) {
  // leading whitespace in a list item is already trimmed off by markdown-it
  return strStartsWithTodoMarkdown(token.content);
}

function isListItemTodoItem(tokens, index) {
  function isInline(token) {
    return token.type === 'inline';
  }
  function isParagraph(token) {
    return token.type === 'paragraph_open';
  }
  function isListItem(token) {
    return token.type === 'list_item_open';
  }

  return (
    isInline(tokens[index + 2]) &&
    isParagraph(tokens[index + 1]) &&
    isListItem(tokens[index]) &&
    startsWithTodoMarkdown(tokens[index + 2])
  );
}
