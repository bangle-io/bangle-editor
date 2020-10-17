export function todoListMarkdownItPlugin(md, options = {}) {
  const {
    todoListOpenType = 'todo_list_open',
    todoListCloseType = 'todo_list_close',
    todoItemCloseType = 'todo_item_close',
    todoItemOpenName = 'todo_item_open',
    isDoneAttrName = 'isDone',
  } = options;

  md.core.ruler.after('inline', 'gfm-todo-list', function (state) {
    var tokens = state.tokens;
    for (var i = 0; i < tokens.length; i++) {
      processToken(tokens, i);
    }
  });

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

    tokens[index].type = todoListOpenType;
    tokens[closingToken].type = todoListCloseType;

    children.forEach(([todoItem]) => {
      if (todoItem.type === 'list_item_close') {
        todoItem.type = todoItemCloseType;
      }
      if (todoItem.type === 'list_item_open') {
        todoItem.type = todoItemOpenName;
      }
    });

    children
      .filter(([todoItem]) => todoItem.type === todoItemOpenName)
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
          ? [[isDoneAttrName, isDone], ...todoItem.attrs]
          : [[isDoneAttrName, isDone]];

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
      ? str.startsWith('[ ] ') ||
          str.startsWith('[x] ') ||
          str.startsWith('[X] ')
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
}
