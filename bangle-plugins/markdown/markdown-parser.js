import markdownit from 'markdown-it';
import { MarkdownParser } from 'prosemirror-markdown';

export function markdownParser(schema) {
  return new MarkdownParser(
    schema,
    markdownit(),
    // .use(todoListPlugin),
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
};

// function todoListPlugin(md) {
//   function isInline(token) {
//     return token.type === 'inline';
//   }
//   function isParagraph(token) {
//     return token.type === 'paragraph_open';
//   }
//   function isListItem(token) {
//     return token.type === 'list_item_open';
//   }
//   function startsWithTodoMarkdown(token) {
//     // leading whitespace in a list item is already trimmed off by markdown-it
//     return (
//       token.content.indexOf('[ ] ') === 0 ||
//       token.content.indexOf('[x] ') === 0 ||
//       token.content.indexOf('[X] ') === 0
//     );
//   }
//   function isTodoItem(tokens, index) {
//     return (
//       isInline(tokens[index]) &&
//       isParagraph(tokens[index - 1]) &&
//       isListItem(tokens[index - 2]) &&
//       startsWithTodoMarkdown(tokens[index])
//     );
//   }

//   function todoify(token, TokenConstructor) {
//     token.children.unshift(makeCheckbox(token, TokenConstructor));
//     token.children[1].content = token.children[1].content.slice(3);
//     token.content = token.content.slice(3);

//     if (useLabelWrapper) {
//       if (useLabelAfter) {
//         token.children.pop();

//         // Use large random number as id property of the checkbox.
//         var id =
//           'task-item-' + Math.ceil(Math.random() * (10000 * 1000) - 1000);
//         token.children[0].content =
//           token.children[0].content.slice(0, -1) + ' id="' + id + '">';
//         token.children.push(afterLabel(token.content, id, TokenConstructor));
//       } else {
//         token.children.unshift(beginLabel(TokenConstructor));
//         token.children.push(endLabel(TokenConstructor));
//       }
//     }
//   }
//   md.core.ruler.after('inline', 'todo_list', (state) => {
//     const tokens = state.tokens;

//     // var tokens = state.tokens;
//     for (var i = 2; i < tokens.length; i++) {
//       if (isTodoItem(tokens, i)) {
//         todoify(tokens[i], state.Token);
//         attrSet(
//           tokens[i - 2],
//           'class',
//           'task-list-item' + (!disableCheckboxes ? ' enabled' : ''),
//         );
//         attrSet(
//           tokens[parentToken(tokens, i - 2)],
//           'class',
//           'contains-task-list',
//         );
//       }
//     }
//   });
// }
