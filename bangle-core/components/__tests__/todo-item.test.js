/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import {
  psx,
  renderTestEditor,
  typeText,
  sendKeyToPm,
} from 'bangle-core/test-helpers/index';
import { todoItem } from '../index';

const testEditor = renderTestEditor();
const keybindings = todoItem.defaultKeys;

test('Typing works', async () => {
  const { view } = await testEditor(
    <doc>
      <todoList>
        <todoItem>
          <para>foo[]bar</para>
        </todoItem>
      </todoList>
    </doc>,
  );

  typeText(view, 'hello');

  expect(view.state).toEqualDocAndSelection(
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
  const { view } = await testEditor(
    <doc>
      <todoList>
        <todoItem>
          <para>foo[]</para>
        </todoItem>
      </todoList>
    </doc>,
  );

  typeText(view, 'hello');
  sendKeyToPm(view, 'Enter');
  typeText(view, 'second');

  expect(view.state).toEqualDocAndSelection(
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
    const { view } = await testEditor(
      <doc>
        <todoList>
          <todoItem>
            <para>foo[]bar</para>
          </todoItem>
        </todoList>
      </doc>,
    );

    sendKeyToPm(view, 'Tab');

    expect(view.state).toEqualDocAndSelection(
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
    const { view } = await testEditor(
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

    sendKeyToPm(view, 'Tab');

    expect(view.state).toEqualDocAndSelection(
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

    sendKeyToPm(view, 'Shift-Tab');

    expect(view.state).toEqualDocAndSelection(
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
    const { view } = await testEditor(
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

    sendKeyToPm(view, 'Ctrl-Shift-9');

    expect(view.state).toEqualDocAndSelection(
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
    const { view } = await testEditor(
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

    sendKeyToPm(view, 'Ctrl-Shift-8');

    expect(view.state).toEqualDocAndSelection(
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
    const { view } = await testEditor(
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

    sendKeyToPm(view, 'Enter');

    expect(view.state).toEqualDocAndSelection(
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

  // TODO I think this blocked by the bug described by a test in list item https://github.com/kepta/bangle-play/blob/ee3305892fbe46e1217b28045b14955e94f24430/bangle-play/utilsnodes/__tests__/list-item.test.js#L553
  it.skip('pressing enter on empty nested li should outdent and take the type of the parent when their are other sibblings', async () => {
    const { view } = await testEditor(
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

    sendKeyToPm(view, 'Enter');

    expect(view.state).toEqualDocAndSelection(
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
    const { view } = await testEditor(
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

    sendKeyToPm(view, 'Enter');

    expect(view.state).toEqualDocAndSelection(
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
    const { view } = await testEditor(
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

    sendKeyToPm(view, 'Ctrl-Shift-9');

    expect(view.state).toEqualDocAndSelection(
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

    sendKeyToPm(editorView, keybindings.markDone);

    let { $from } = editorView.state.selection;
    let node = $from.node(-1);

    expect(node.attrs).toEqual({
      'done': true,
      'data-type': 'todo_item',
    });

    sendKeyToPm(editorView, keybindings.markDone);

    ({ $from } = editorView.state.selection);
    node = $from.node(-1);

    expect(node.attrs).toEqual({
      'done': false,
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

    sendKeyToPm(editorView, keybindings.markDone);

    let { $from } = editorView.state.selection;
    let node = $from.node(-1);
    let ancestorTodo = $from.node(-3);
    expect(node.attrs).toEqual({
      'done': true,
      'data-type': 'todo_item',
    });
    expect(ancestorTodo.attrs).toEqual({
      'done': false,
      'data-type': 'todo_item',
    });

    sendKeyToPm(editorView, keybindings.markDone);

    ({ $from } = editorView.state.selection);
    node = $from.node(-1);
    ancestorTodo = $from.node(-3);

    expect(node.attrs).toEqual({
      'done': false,
      'data-type': 'todo_item',
    });
    expect(ancestorTodo.attrs).toEqual({
      'done': false,
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
    const { view } = await testEditor(input);

    sendKeyToPm(view, keybindings.insertEmptyAbove);

    expect(view.state).toEqualDocAndSelection(expected);
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
    const { view } = await testEditor(input);

    sendKeyToPm(view, keybindings.insertEmptyBelow);

    expect(view.state).toEqualDocAndSelection(expected);
  });
});
