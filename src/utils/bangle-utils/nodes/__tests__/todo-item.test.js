/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import '../../../../../src/test-helpers/jest-helpers';
import { psx } from '../../../../test-helpers/schema-builders';
import { renderTestEditor } from '../../../../test-helpers/render-helper';
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
  const { editor } = await testEditor(
    <doc>
      <todoList>
        <todoItem>
          <para>foo[]bar</para>
        </todoItem>
      </todoList>
    </doc>,
  );

  typeText(editor.view, 'hello');

  expect(editor.state).toEqualDocAndSelection(
    <doc>
      <todoList>
        <todoItem>
          <para>foohello[]bar</para>
        </todoItem>
      </todoList>
    </doc>,
  );
});

test('Pressing Enter', async () => {
  const { editor } = await testEditor(
    <doc>
      <todoList>
        <todoItem>
          <para>foo[]</para>
        </todoItem>
      </todoList>
    </doc>,
  );

  typeText(editor.view, 'hello');
  sendKeyToPm(editor.view, 'Enter');
  typeText(editor.view, 'second');

  expect(editor.state).toEqualDocAndSelection(
    <doc>
      <todoList>
        <todoItem>
          <para>foohello</para>
        </todoItem>
        <todoItem>
          <para>second[]</para>
        </todoItem>
      </todoList>
    </doc>,
  );
});

describe('Pressing Tab', () => {
  test('first list has no effect', async () => {
    const { editor } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>foo[]bar</para>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Tab');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>foo[]bar</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });
  test('second list nests', async () => {
    const { editor } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Tab');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Shift-Tab');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });
});

describe('Markdown shortcuts', () => {
  it('Typing [ ]  works', async () => {
    const { editorView, sel } = await testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    typeText(editorView, '[ ] my day', sel);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <todoList>
          <todoItem>
            <para>my day</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });
});

describe('Heterogenous toggle', () => {
  it('Toggles todo to ordered list', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editorView, 'Ctrl-Shift-8');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ul>
              <li>
                <para>[]second</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  it('Toggles ordered list to todo item', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ul>
              <li>
                <para>[]second</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editorView, 'Ctrl-Shift-7');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );
  });
});

describe('Pressing Backspace', () => {
  it('Backspacing works', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>foohello</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <todoList>
          <todoItem>
            <para>foohello</para>
          </todoItem>
        </todoList>
        <para>[]second</para>
      </doc>,
    );
  });

  it('Backspacing nested todo outdents', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  it('Backspacing nested todo outdents to para', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
        </todoList>
        <para>[]second</para>
      </doc>,
    );
  });

  it('Backspacing a ul inside a todo outdents', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ul>
              <li>
                <para>[]second</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  it('Backspacing an ol inside a todo outdents', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ol>
              <li>
                <para>[]second</para>
              </li>
            </ol>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  it('Backspacing an ol inside ol inside a todo outdents to ol', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ol>
              <li>
                <para>nested</para>
                <ol>
                  <li>
                    <para>[]deep</para>
                  </li>
                </ol>
              </li>
            </ol>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ol>
              <li>
                <para>nested</para>
              </li>
              <li>
                <para>[]deep</para>
              </li>
            </ol>
          </todoItem>
        </todoList>
      </doc>,
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
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>second[]</para>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>second[]</para>
          </todoItem>
          <todoItem>
            <para>first</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  it('if first item is empty', async () => {
    await check(
      <doc>
        <todoList>
          <todoItem>
            <para></para>
          </todoItem>
          <todoItem>
            <para>sec[]ond</para>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>sec[]ond</para>
          </todoItem>
          <todoItem>
            <para></para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });
  it('works for nested todo list', async () => {
    await check(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>second</para>
            <todoList>
              <todoItem>
                <para>nested:1</para>
              </todoItem>
              <todoItem>
                <para>nested:2[]</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>second</para>
            <todoList>
              <todoItem>
                <para>nested:2[]</para>
              </todoItem>
              <todoItem>
                <para>nested:1</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );
  });
});

describe('Alt-up/down of nesting ol/ul list', () => {
  it('works for nested ul', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>top</para>
            <ul>
              <li>
                <para>[]nested 1</para>
              </li>
              <li>
                <para>nested 2</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
    );
    sendKeyToPm(editorView, 'Alt-Up');

    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>[]nested 1</para>
          </todoItem>
          <todoItem>
            <para>top</para>
            <ul>
              <li>
                <para>nested 2</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  it.skip('works for nested ul with selection in middle', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>top</para>
            <ul>
              <li>
                <para>nested[] 1</para>
              </li>
              <li>
                <para>nested 2</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
    );
    sendKeyToPm(editorView, 'Alt-Up');

    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>nested[] 1</para>
          </todoItem>
          <todoItem>
            <para>top</para>
            <ul>
              <li>
                <para>nested 2</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  it('works for nested ul going down', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>top</para>
            <ul>
              <li>
                <para>nested 1</para>
              </li>
              <li>
                <para>nested[] 2</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
    );
    sendKeyToPm(editorView, 'Alt-Down');

    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>top</para>
            <ul>
              <li>
                <para>nested 1</para>
              </li>
            </ul>
          </todoItem>
          <todoItem>
            <para>[]nested 2</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });
});

describe('Nesting heterogenous lists', () => {
  it('converts to ol', async () => {
    const { editor } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Ctrl-Shift-9');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ol>
              <li>
                <para>[]second</para>
              </li>
            </ol>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  it('converts to ul', async () => {
    const { editor } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Ctrl-Shift-8');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ul>
              <li>
                <para>[]second</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  it('pressing enter on empty nested li should outdent and take the type of the parent', async () => {
    const { editor } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ol>
              <li>
                <para>[]</para>
              </li>
            </ol>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  // TODO I think this blocked by the bug described by a test in list item https://github.com/kepta/bangle-play/blob/ee3305892fbe46e1217b28045b14955e94f24430/src/utils/bangle-utils/nodes/__tests__/list-item.test.js#L553
  it.skip('pressing enter on empty nested li should outdent and take the type of the parent when their are other sibblings', async () => {
    const { editor } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ol>
              <li>
                <para>[]</para>
              </li>
              <li>
                <para>last</para>
              </li>
            </ol>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]</para>
          </todoItem>
          <ol>
            <li>
              <para>last</para>
            </li>
          </ol>
        </todoList>
      </doc>,
    );
  });

  it('pressing enter on empty double nested li should outdent and take the type of the parent', async () => {
    const { editor } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>first</para>
                <ol>
                  <li>
                    <para>[]</para>
                  </li>
                </ol>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>first</para>
              </todoItem>
              <todoItem>
                <para>[]</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  // Do we want this ? A user can in theory select all the items and
  // convert them to whatever the want
  it.skip('converts every sibbling to ol', async () => {
    const { editor } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>nested1</para>
              </todoItem>
              <todoItem>
                <para>[]nested2</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Ctrl-Shift-9');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ol>
              <li>
                <para>nested1</para>
              </li>
              <li>
                <para>[]nested2</para>
              </li>
            </ol>
          </todoItem>
        </todoList>
      </doc>,
    );
  });
});

describe('Toggle todo list with keyboard shortcut', () => {
  it('toggles the todo with the command', async () => {
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>top[]</para>
            <ul>
              <li>
                <para>nested 1</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
      </doc>,
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
    const { editorView } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>top</para>
            <todoList>
              <todoItem>
                <para>nested 1 []</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
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
  test.each([
    [
      <doc>
        <todoList>
          <todoItem>
            <para>top[]</para>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>[]</para>
          </todoItem>
          <todoItem>
            <para>top</para>
          </todoItem>
        </todoList>
      </doc>,
    ],
    // empty
    [
      <doc>
        <todoList>
          <todoItem>
            <para>[]</para>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>[]</para>
          </todoItem>
          <todoItem>
            <para></para>
          </todoItem>
        </todoList>
      </doc>,
    ],
    // nested
    [
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]</para>
              </todoItem>
              <todoItem>
                <para>second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    ],
    // nested but selection in parent
    [
      <doc>
        <todoList>
          <todoItem>
            <para>first[]</para>
            <todoList>
              <todoItem>
                <para>second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>[]</para>
          </todoItem>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    ],
  ])('Case %# insert above', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Shift-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });

  test.each([
    [
      <doc>
        <todoList>
          <todoItem>
            <para>top[]</para>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>top</para>
          </todoItem>
          <todoItem>
            <para>[]</para>
          </todoItem>
        </todoList>
      </doc>,
    ],
    // empty
    [
      <doc>
        <todoList>
          <todoItem>
            <para>[]</para>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para></para>
          </todoItem>
          <todoItem>
            <para>[]</para>
          </todoItem>
        </todoList>
      </doc>,
    ],
    // nested
    [
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>second</para>
              </todoItem>
              <todoItem>
                <para>[]</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
    ],
    // nested but selection in parent
    [
      <doc>
        <todoList>
          <todoItem>
            <para>first[]</para>
            <todoList>
              <todoItem>
                <para>second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>,
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>second</para>
              </todoItem>
            </todoList>
          </todoItem>
          <todoItem>
            <para>[]</para>
          </todoItem>
        </todoList>
      </doc>,
    ],
  ])('Case %# insert below', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });
});
