/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import {
  psx,
  renderTestEditor,
  typeText,
  sendKeyToPm,
} from '../../test-helpers/index';
import { todoItem } from '../index';

const testEditor = renderTestEditor();
const keybindings = todoItem.defaultKeys;

test('Typing works', async () => {
  const { view } = await testEditor(
    <doc>
      <ul>
        <li todoChecked={false}>
          <para>foo[]bar</para>
        </li>
      </ul>
    </doc>,
  );

  typeText(view, 'hello');

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <ul>
        <li todoChecked={false}>
          <para>foohello[]bar</para>
        </li>
      </ul>
    </doc>,
  );
});

test('Pressing Enter', async () => {
  const { view } = await testEditor(
    <doc>
      <ul>
        <li todoChecked={false}>
          <para>foo[]</para>
        </li>
      </ul>
    </doc>,
  );

  typeText(view, 'hello');
  sendKeyToPm(view, 'Enter');
  typeText(view, 'second');

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <ul>
        <li todoChecked={false}>
          <para>foohello</para>
        </li>
        <li todoChecked={false}>
          <para>second[]</para>
        </li>
      </ul>
    </doc>,
  );
});

describe('Pressing Tab', () => {
  test('first list has no effect', async () => {
    const { view } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>foo[]bar</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Tab');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>foo[]bar</para>
          </li>
        </ul>
      </doc>,
    );
  });
  test('second list nests', async () => {
    const { view } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Tab');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Shift-Tab');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>[]second</para>
          </li>
        </ul>
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
        <ul>
          <li todoChecked={false}>
            <para>my day</para>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Heterogenous toggle', () => {
  it('Toggles todo to orderedList', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, 'Ctrl-Shift-9');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ol>
              <li>
                <para>[]second</para>
              </li>
            </ol>
          </li>
        </ul>
      </doc>,
    );
  });

  // TODO make it more intuitive
  it('when calling toggleTodo on bulletList it converts to paragraph', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, 'Ctrl-Shift-8');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
        </ul>
        <para>[]second</para>
      </doc>,
    );
  });

  it.skip('Toggles ordered list to todo item', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, 'Ctrl-Shift-7');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe.only('Pressing Backspace', () => {
  it('Backspacing works', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>foohello</para>
          </li>
          <li todoChecked={false}>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>foohello</para>
          </li>
        </ul>
        <para>[]second</para>
      </doc>,
    );
  });

  it('Backspacing nested todo outdents', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('Backspacing nested todo outdents to para', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
        </ul>
        <para>[]second</para>
      </doc>,
    );
  });

  it('Backspacing a ul inside a todo outdents', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('Backspacing an ol inside a todo outdents', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ol>
              <li>
                <para>[]second</para>
              </li>
            </ol>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('Backspacing an ol inside ol inside a todo outdents to ol', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
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
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, 'Backspace');

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ol>
              <li>
                <para>nested</para>
              </li>
              <li>
                <para>[]deep</para>
              </li>
            </ol>
          </li>
        </ul>
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
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>second[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>second[]</para>
          </li>
          <li todoChecked={false}>
            <para>first</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('if first item is empty', async () => {
    await check(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para></para>
          </li>
          <li todoChecked={false}>
            <para>sec[]ond</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>sec[]ond</para>
          </li>
          <li todoChecked={false}>
            <para></para>
          </li>
        </ul>
      </doc>,
    );
  });
  it('works for nested todo list', async () => {
    await check(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>second</para>
            <ul>
              <li todoChecked={false}>
                <para>nested:1</para>
              </li>
              <li todoChecked={false}>
                <para>nested:2[]</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>second</para>
            <ul>
              <li todoChecked={false}>
                <para>nested:2[]</para>
              </li>
              <li todoChecked={false}>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Alt-up/down of nesting ol/ul list', () => {
  it('works for nested ul', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>top</para>
            <ul>
              <li>
                <para>[]nested 1</para>
              </li>
              <li>
                <para>nested 2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
    sendKeyToPm(editorView, 'Alt-Up');

    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>[]nested 1</para>
          </li>
          <li todoChecked={false}>
            <para>top</para>
            <ul>
              <li>
                <para>nested 2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it.skip('works for nested ul with selection in middle', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>top</para>
            <ul>
              <li>
                <para>nested[] 1</para>
              </li>
              <li>
                <para>nested 2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
    sendKeyToPm(editorView, 'Alt-Up');

    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>nested[] 1</para>
          </li>
          <li todoChecked={false}>
            <para>top</para>
            <ul>
              <li>
                <para>nested 2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('works for nested ul going down', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>top</para>
            <ul>
              <li>
                <para>nested 1</para>
              </li>
              <li>
                <para>nested[] 2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
    sendKeyToPm(editorView, 'Alt-Down');

    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>top</para>
            <ul>
              <li>
                <para>nested 1</para>
              </li>
            </ul>
          </li>
          <li todoChecked={false}>
            <para>[]nested 2</para>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Nesting heterogenous lists', () => {
  it('converts to ol', async () => {
    const { view } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Ctrl-Shift-9');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ol>
              <li>
                <para>[]second</para>
              </li>
            </ol>
          </li>
        </ul>
      </doc>,
    );
  });

  it('converts to ul', async () => {
    const { view } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Ctrl-Shift-8');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('pressing enter on empty nested li should outdent and take the type of the parent', async () => {
    const { view } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ol>
              <li>
                <para>[]</para>
              </li>
            </ol>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Enter');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    );
  });

  // TODO I think this blocked by the bug described by a test in list item https://github.com/bangle-io/bangle.dev/blob/ee3305892fbe46e1217b28045b14955e94f24430/bangle-play/utilsnodes/__tests__/list-item.test.js#L553
  it.skip('pressing enter on empty nested li should outdent and take the type of the parent when their are other sibblings', async () => {
    const { view } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ol>
              <li>
                <para>[]</para>
              </li>
              <li>
                <para>last</para>
              </li>
            </ol>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Enter');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
          </li>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
          <ol>
            <li>
              <para>last</para>
            </li>
          </ol>
        </ul>
      </doc>,
    );
  });

  it('pressing enter on empty double nested li should outdent and take the type of the parent', async () => {
    const { view } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>first</para>
                <ol>
                  <li>
                    <para>[]</para>
                  </li>
                </ol>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Enter');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>first</para>
              </li>
              <li todoChecked={false}>
                <para>[]</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  // Do we want this ? A user can in theory select all the items and
  // convert them to whatever the want
  it.skip('converts every sibbling to ol', async () => {
    const { view } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>nested1</para>
              </li>
              <li todoChecked={false}>
                <para>[]nested2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Ctrl-Shift-9');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ol>
              <li>
                <para>nested1</para>
              </li>
              <li>
                <para>[]nested2</para>
              </li>
            </ol>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Toggle todo list with keyboard shortcut', () => {
  it('toggles the todo with the command', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>top[]</para>
            <ul>
              <li>
                <para>nested 1</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, keybindings.toggleDone);

    let { $from } = editorView.state.selection;
    let node = $from.node(-1);

    expect(node.attrs).toEqual({
      done: true,
    });

    sendKeyToPm(editorView, keybindings.toggleDone);

    ({ $from } = editorView.state.selection);
    node = $from.node(-1);

    expect(node.attrs).toEqual({
      done: false,
    });
  });

  it('handles nested todo', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>top</para>
            <ul>
              <li todoChecked={false}>
                <para>nested 1 []</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editorView, keybindings.toggleDone);

    let { $from } = editorView.state.selection;
    let node = $from.node(-1);
    let ancestorTodo = $from.node(-3);
    expect(node.attrs).toEqual({
      done: true,
    });
    expect(ancestorTodo.attrs).toEqual({
      done: false,
    });

    sendKeyToPm(editorView, keybindings.toggleDone);

    ({ $from } = editorView.state.selection);
    node = $from.node(-1);
    ancestorTodo = $from.node(-3);

    expect(node.attrs).toEqual({
      done: false,
    });
    expect(ancestorTodo.attrs).toEqual({
      done: false,
    });
  });
});

describe('Insert empty todo above and below', () => {
  test.each([
    [
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>top[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
          <li todoChecked={false}>
            <para>top</para>
          </li>
        </ul>
      </doc>,
    ],
    // empty
    [
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
          <li todoChecked={false}>
            <para></para>
          </li>
        </ul>
      </doc>,
    ],
    // nested
    [
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]</para>
              </li>
              <li todoChecked={false}>
                <para>second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    ],
    // nested but selection in parent
    [
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first[]</para>
            <ul>
              <li todoChecked={false}>
                <para>second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    ],
  ])('Case %# insert above', async (input, expected) => {
    const { view } = await testEditor(input);

    sendKeyToPm(view, keybindings.insertEmptyTodoAbove);

    expect(view.state).toEqualDocAndSelection(expected);
  });

  test.each([
    [
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>top[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>top</para>
          </li>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    ],
    // empty
    [
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para></para>
          </li>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    ],
    // nested
    [
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>second</para>
              </li>
              <li todoChecked={false}>
                <para>[]</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    ],
    // nested but selection in parent
    [
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first[]</para>
            <ul>
              <li todoChecked={false}>
                <para>second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li todoChecked={false}>
            <para>first</para>
            <ul>
              <li todoChecked={false}>
                <para>second</para>
              </li>
            </ul>
          </li>
          <li todoChecked={false}>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    ],
  ])('Case %# insert below', async (input, expected) => {
    const { view } = await testEditor(input);

    sendKeyToPm(view, keybindings.insertEmptyTodoBelow);

    expect(view.state).toEqualDocAndSelection(expected);
  });
});
