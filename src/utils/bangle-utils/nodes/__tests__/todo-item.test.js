/**
 * @jest-environment jsdom
 */
import '../../../../../src/test-helpers/jest-helpers';

import {
  doc,
  ul,
  li,
  p,
  ol,
  br,
  h1,
  codeBlock,
  underline,
  todoList,
  todoItem,
} from '../../../../../src/test-helpers/test-builders';
import { renderTestEditor } from '../../../../../src/test-helpers/render-test-editor';
import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import { ListItem } from '../list-item/list-item';
import {
  sendKeyToPm,
  typeText,
} from '../../../../../src/test-helpers/keyboard';
import { Underline } from '../../../../../src/utils/bangle-utils/marks';

import { Heading } from '../heading';
import { HardBreak } from '../hard-break';

import {
  enterKeyCommand,
  splitListItem,
  toggleList,
  backspaceKeyCommand,
} from '../list-item/commands';
import { TodoList } from '../todo-list';
import { TodoItem } from '../todo-item';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new TodoList(),
  new TodoItem(),
  new HardBreak(),
  new Heading(),
  new Underline(),
];
const testEditor = renderTestEditor({ extensions });

test('Typing works', async () => {
  const { editor } = await testEditor(doc(todoList(todoItem(p('foo{<>}bar')))));

  typeText(editor.view, 'hello');

  expect(editor.state).toEqualDocAndSelection(
    doc(todoList(todoItem(p('foohello{<>}bar')))),
  );
});

test('Pressing Enter', async () => {
  const { editor } = await testEditor(doc(todoList(todoItem(p('foo{<>}')))));

  typeText(editor.view, 'hello');
  sendKeyToPm(editor.view, 'Enter');
  typeText(editor.view, 'second');

  expect(editor.state).toEqualDocAndSelection(
    doc(todoList(todoItem(p('foohello')), todoItem(p('second{<>}')))),
  );
});

describe('Pressing Tab', () => {
  test('first list has no effect', async () => {
    const { editor } = await testEditor(
      doc(todoList(todoItem(p('foo{<>}bar')))),
    );

    sendKeyToPm(editor.view, 'Tab');

    expect(editor.state).toEqualDocAndSelection(
      doc(todoList(todoItem(p('foo{<>}bar')))),
    );
  });
  test('second list nests', async () => {
    const { editor } = await testEditor(
      doc(todoList(todoItem(p('first')), todoItem(p('{<>}second')))),
    );

    sendKeyToPm(editor.view, 'Tab');

    expect(editor.state).toEqualDocAndSelection(
      doc(todoList(todoItem(p('first'), todoList(todoItem(p('{<>}second')))))),
    );

    sendKeyToPm(editor.view, 'Shift-Tab');

    expect(editor.state).toEqualDocAndSelection(
      doc(todoList(todoItem(p('first')), todoItem(p('{<>}second')))),
    );
  });
});

describe('Markdown shortcuts', () => {
  it('Typing [ ]  works', async () => {
    const { editorView, sel } = await testEditor(doc(p('{<>}')));

    typeText(editorView, '[ ] my day', sel);
    expect(editorView.state.doc).toEqualDocument(
      doc(todoList(todoItem(p('my day')))),
    );
  });
});

describe('Heterogenous toggle', () => {
  it('Toggles todo to ordered list', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('first'), 
          todoList(
            todoItem(p('{<>}second'))
          )
        )
      )),
    );

    sendKeyToPm(editorView, 'Ctrl-Shift-8');

    // prettier-ignore
    expect(editorView.state.doc).toEqualDocument(
      doc(todoList(
        todoItem(
          p('first'), 
          ul(
            li(p('{<>}second'))
          )
        )
      )),
    );
  });

  it('Toggles ordered list to todo item', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('first'), 
          ul(
            li(p('{<>}second'))
          )
        )
      )),
    );

    sendKeyToPm(editorView, 'Ctrl-Shift-7');

    // prettier-ignore
    expect(editorView.state.doc).toEqualDocument(
      doc(todoList(
        todoItem(
          p('first'), 
          todoList(
            todoItem(p('{<>}second'))
          )
        )
      )),
    );
  });
});

describe('Pressing Backspace', () => {
  it('Backspacing works', async () => {
    const { editorView } = await testEditor(
      doc(todoList(todoItem(p('foohello')), todoItem(p('{<>}second')))),
    );

    sendKeyToPm(editorView, 'Backspace');
    expect(editorView.state.doc).toEqualDocument(
      doc(todoList(todoItem(p('foohello'))), p('{<>}second')),
    );
  });

  it('Backspacing nested todo outdents', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('first'), 
          todoList(
            todoItem(p('{<>}second'))
          )
        )
      )),
    );

    sendKeyToPm(editorView, 'Backspace');

    // prettier-ignore
    expect(editorView.state.doc).toEqualDocument(
      doc(todoList(
        todoItem(p('first')),
        todoItem(p('{<>}second')),
      )),
    );
  });

  it('Backspacing nested todo outdents to para', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(p('first')),
        todoItem(p('{<>}second')),
      )),
    );

    sendKeyToPm(editorView, 'Backspace');

    // prettier-ignore
    expect(editorView.state.doc).toEqualDocument(
      doc(todoList(
        todoItem(p('first'))),
        p('{<>}second'),
      ),
    );
  });

  it('Backspacing a ul inside a todo outdents', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('first'), 
          ul(
            li(p('{<>}second'))
          )
        )
      )),
    );

    sendKeyToPm(editorView, 'Backspace');

    // prettier-ignore
    expect(editorView.state.doc).toEqualDocument(
      doc(todoList(
        todoItem(p('first')),
        todoItem(p('{<>}second')),
      )),
    );
  });

  it('Backspacing an ol inside a todo outdents', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('first'), 
          ol(
            li(p('{<>}second'))
          )
        )
      )),
    );

    sendKeyToPm(editorView, 'Backspace');

    // prettier-ignore
    expect(editorView.state.doc).toEqualDocument(
      doc(todoList(
        todoItem(p('first')),
        todoItem(p('{<>}second')),
      )),
    );
  });

  it('Backspacing an ol inside ol inside a todo outdents to ol', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('first'), 
          ol(
            li(
              p('nested'), 
              ol(
                li(p('{<>}deep'))
              )
            )
          )
        )
      )),
    );

    sendKeyToPm(editorView, 'Backspace');

    // prettier-ignore
    expect(editorView.state.doc).toEqualDocument(
      doc(todoList(
        todoItem(
          p('first'), 
          ol(
            li(p('nested')),
            li(p('{<>}deep'))
          )
        )
      )),
    );
  });
});

describe('Pressing Alt-Up / Down to move list', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Up');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
    sendKeyToPm(editorView, 'Alt-Down');
    expect(editorView.state).toEqualDocAndSelection(beforeDoc);
  };

  it('if item above exists and selection is at end', async () => {
    await check(
      doc(todoList(todoItem(p('first')), todoItem(p('second{<>}')))),
      doc(todoList(todoItem(p('second{<>}')), todoItem(p('first')))),
    );
  });

  it('if first item is empty', async () => {
    await check(
      doc(todoList(todoItem(p('')), todoItem(p('sec{<>}ond')))),
      doc(todoList(todoItem(p('sec{<>}ond')), todoItem(p('')))),
    );
  });
  it('works for nested todo list', async () => {
    // prettier-ignore
    await check(
      doc(
        todoList(
          todoItem(p('first')),
          todoItem(p('second'), todoList(
            todoItem(p('nested:1')),
            todoItem(p('nested:2{<>}'))
          ))
        )
      ),
      doc(
        todoList(
          todoItem(p('first')),
          todoItem(p('second'), todoList(
            todoItem(p('nested:2{<>}')),
            todoItem(p('nested:1')),
          ))
        )
      ),
    );
  });
});

describe('Alt-up/down of nesting ol/ul list', () => {
  it('works for nested ul', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('top'), 
          ul(
            li(p('{<>}nested 1')),
            li(p('nested 2')),
          )
        )
      )),
    );
    sendKeyToPm(editorView, 'Alt-Up');
    // prettier-ignore
    expect(editorView.state).toEqualDocAndSelection(
      doc(todoList(
        todoItem(
          p('{<>}nested 1'),
        ), 
        todoItem(
          p('top'),
          ul(
            li(p('nested 2')),
          )
        )
      )),
    );
  });

  it.skip('works for nested ul with selection in middle', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('top'), 
          ul(
            li(p('nested{<>} 1')),
            li(p('nested 2')),
          )
        )
      )),
    );
    sendKeyToPm(editorView, 'Alt-Up');
    // prettier-ignore
    expect(editorView.state).toEqualDocAndSelection(
      doc(todoList(
        todoItem(
          p('nested{<>} 1'),
        ), 
        todoItem(
          p('top'),
          ul(
            li(p('nested 2')),
          )
        )
      )),
    );
  });

  it('works for nested ul going down', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('top'), 
          ul(
            li(p('nested 1')),
            li(p('nested{<>} 2')),
          )
        )
      )),
    );
    sendKeyToPm(editorView, 'Alt-Down');
    // prettier-ignore
    expect(editorView.state).toEqualDocAndSelection(
      doc(todoList(
        todoItem(
          p('top'), 
          ul(
            li(p('nested 1')),
          )
        ),
        todoItem(p('{<>}nested 2')),
      )),
    );
  });
});

describe('Nesting heterogenous lists', () => {
  it('converts to ol', async () => {
    const { editor } = await testEditor(
      doc(todoList(todoItem(p('first'), todoList(todoItem(p('{<>}second')))))),
    );

    sendKeyToPm(editor.view, 'Ctrl-Shift-9');

    expect(editor.state).toEqualDocAndSelection(
      doc(todoList(todoItem(p('first'), ol(li(p('{<>}second')))))),
    );
  });

  it('converts to ul', async () => {
    const { editor } = await testEditor(
      doc(todoList(todoItem(p('first'), todoList(todoItem(p('{<>}second')))))),
    );

    sendKeyToPm(editor.view, 'Ctrl-Shift-8');

    expect(editor.state).toEqualDocAndSelection(
      doc(todoList(todoItem(p('first'), ul(li(p('{<>}second')))))),
    );
  });

  it('pressing enter on empty nested li should outdent and take the type of the parent', async () => {
    const { editor } = await testEditor(
      // prettier-ignore
      doc(
        todoList(
          todoItem(
            p('first'),
            ol(
              li(p('{<>}')),
            )
          )
        )
      ),
    );

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      // prettier-ignore
      doc(
        todoList(
          todoItem(
            p('first'),
          ),
          todoItem(
            p('{<>}')
          )
        )
      ),
    );
  });

  // TODO I think this blocked by the bug described by a test in list item https://github.com/kepta/bangle-play/blob/ee3305892fbe46e1217b28045b14955e94f24430/src/utils/bangle-utils/nodes/__tests__/list-item.test.js#L553
  it.skip('pressing enter on empty nested li should outdent and take the type of the parent when their are other sibblings', async () => {
    const { editor } = await testEditor(
      // prettier-ignore
      doc(
        todoList(
          todoItem(
            p('first'),
            ol(
              li(p('{<>}')),
              li(p('last')),
            )
          )
        )
      ),
    );

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      // prettier-ignore
      doc(
        todoList(
          todoItem(
            p('first'),
          ),
          todoItem(
            p('{<>}')
          ),
          ol(
            li(p('last')),
          )
        )
      ),
    );
  });

  it('pressing enter on empty double nested li should outdent and take the type of the parent', async () => {
    const { editor } = await testEditor(
      // prettier-ignore
      doc(
        todoList(
          todoItem(
            p('first'),
            todoList(
              todoItem(
                p('first'),
                ol(
                  li(p('{<>}')),
                )
              )
            )
          )
        )
      ),
    );

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      // prettier-ignore
      doc(
        todoList(
          todoItem(
            p('first'),
            todoList(
              todoItem(
                p('first'),
              ),
              todoItem(
                p('{<>}')
              )
            )
          )
        )
      ),
    );
  });

  // Do we want this ? A user can in theory select all the items and
  // convert them to whatever the want
  it.skip('converts every sibbling to ol', async () => {
    const { editor } = await testEditor(
      doc(
        todoList(
          todoItem(
            p('first'),
            todoList(todoItem(p('nested1')), todoItem(p('{<>}nested2'))),
          ),
        ),
      ),
    );

    sendKeyToPm(editor.view, 'Ctrl-Shift-9');

    expect(editor.state).toEqualDocAndSelection(
      // prettier-ignore
      doc(
        todoList(
          todoItem(
            p('first'),
            ol(
              li(p('nested1')),
              li(p('{<>}nested2')),
            )
          )
        )
      ),
    );
  });
});

describe('Toggle todo list with keyboard shortcut', () => {
  it('toggles the todo with the command', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('top{<>}'), 
          ul(
            li(p('nested 1')),
          )
        )
      )),
    );

    sendKeyToPm(editorView, 'Ctrl-Enter');

    let { $from } = editorView.state.selection;
    let node = $from.node(-1);

    expect(node.attrs).toEqual({
      'data-done': true,
      'data-type': 'todo_item',
    });

    sendKeyToPm(editorView, 'Ctrl-Enter');

    ({ $from } = editorView.state.selection);
    node = $from.node(-1);

    expect(node.attrs).toEqual({
      'data-done': false,
      'data-type': 'todo_item',
    });
  });

  it('handles nested todo', async () => {
    // prettier-ignore
    const { editorView } = await testEditor(
      doc(todoList(
        todoItem(
          p('top'), 
          todoList(
            todoItem(p('nested 1 {<>}')),
          )
        )
      )),
    );

    sendKeyToPm(editorView, 'Ctrl-Enter');

    let { $from } = editorView.state.selection;
    let node = $from.node(-1);
    let ancestorTodo = $from.node(-3);
    expect(node.attrs).toEqual({
      'data-done': true,
      'data-type': 'todo_item',
    });
    expect(ancestorTodo.attrs).toEqual({
      'data-done': false,
      'data-type': 'todo_item',
    });

    sendKeyToPm(editorView, 'Ctrl-Enter');

    ({ $from } = editorView.state.selection);
    node = $from.node(-1);
    ancestorTodo = $from.node(-3);

    expect(node.attrs).toEqual({
      'data-done': false,
      'data-type': 'todo_item',
    });
    expect(ancestorTodo.attrs).toEqual({
      'data-done': false,
      'data-type': 'todo_item',
    });
  });
});

describe('Insert empty todo above and below', () => {
  test.each(
    // prettier-ignore
    [
      [
        doc(
          todoList(
            todoItem(p('top{<>}'))
          ),
        ), 
        doc(
          todoList(
            todoItem(p('{<>}')),
            todoItem(p('top'))
          ),
        )
      ],
      // empty 
      [
        doc(
          todoList(
            todoItem(p('{<>}'))
          ),
        ), 
        doc(
          todoList(
            todoItem(p('{<>}')),
            todoItem(p()),
          ),
        )
      ],
      // nested
      [
        doc(
          todoList(
            todoItem(
              p('first'), 
              todoList(
                todoItem(p('{<>}second'))
              )
            )
          )
        ), 
        doc(
          todoList(
            todoItem(
              p('first'), 
              todoList(
                todoItem(p('{<>}')),
                todoItem(p('second'))
              )
            )
          )
        )
      ],
      // nested but selection in parent
      [
        doc(
          todoList(
            todoItem(
              p('first{<>}'), 
              todoList(
                todoItem(p('second'))
              )
            )
          )
        ), 
        doc(
          todoList(
            todoItem(p('{<>}')),
            todoItem(
              p('first'),
              todoList(
                todoItem(p('second'))
              )
            )
          )
        )
      ]
    ],
  )('Case %# insert above', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Shift-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });

  test.each(
    // prettier-ignore
    [
      [
        doc(
          todoList(
            todoItem(p('top{<>}')),
          ),
        ), 
        doc(
          todoList(
            todoItem(p('top')),
            todoItem(p('{<>}')),
          ),
        )
      ],
      // empty 
      [
        doc(
          todoList(
            todoItem(p('{<>}')),
          ),
        ), 
        doc(
          todoList(
            todoItem(p()),
            todoItem(p('{<>}')),
          ),
        )
      ],
      // nested
      [
        doc(
          todoList(
            todoItem(
              p('first'), 
              todoList(
                todoItem(p('{<>}second')),
              ),
            )
          )
        ), 
        doc(
          todoList(
            todoItem(
              p('first'), 
              todoList(
                todoItem(p('second')),
                todoItem(p('{<>}')),
              )
            )
          )
        )
      ],
      // nested but selection in parent
      [
        doc(
          todoList(
            todoItem(
              p('first{<>}'), 
              todoList(
                todoItem(p('second')),
              ),
            )
          )
        ), 
        doc(
          todoList(
            todoItem(
              p('first'),
              todoList(
                todoItem(p('second')),
                ),
              ),
            todoItem(p('{<>}')),
          )
        )
      ]
    ],
  )('Case %# insert below', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });
});
