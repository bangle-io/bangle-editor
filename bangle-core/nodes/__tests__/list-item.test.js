/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import {
  applyCommand,
  psx,
  renderTestEditor,
  sendKeyToPm,
  typeText,
} from 'bangle-core/test-helpers';

import {
  enterKeyCommand,
  toggleList,
  backspaceKeyCommand,
} from '../list-item/commands';

import {
  bulletList,
  listItem,
  orderedList,
  hardBreak,
  heading,
  underline,
  codeBlock,
  doc,
  text,
  paragraph,
} from '../../components';
import { SpecSheet } from 'bangle-core/spec-sheet';

const specSheet = new SpecSheet([
  doc.spec(),
  text.spec(),
  paragraph.spec(),
  bulletList.spec(),
  listItem.spec(),
  orderedList.spec(),
  hardBreak.spec(),
  heading.spec(),
  underline.spec(),
]);

const plugins = [
  doc.plugins(),
  text.plugins(),
  paragraph.plugins(),
  bulletList.plugins(),
  listItem.plugins(),
  orderedList.plugins(),
  hardBreak.plugins(),
  heading.plugins(),
  underline.plugins(),
];

const testEditor = renderTestEditor({ specSheet, plugins });

describe('Command: toggleList', () => {
  let updateDoc, editorView;

  beforeEach(async () => {
    ({ editorView, updateDoc } = await testEditor());
  });

  test('toggles correctly', async () => {
    updateDoc(
      <doc>
        <para>foobar[]</para>
      </doc>,
    );
    // because togglelist requires a view to work
    // we are not using the applyCommand helper
    toggleList(editorView.state.schema.nodes['bullet_list'])(
      editorView.state,
      editorView.dispatch,
      editorView,
    );

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li>
            <para>foobar</para>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Command: backspaceKeyCommand', () => {
  const testEditor = renderTestEditor({});
  let updateDoc,
    editorView,
    cmd = applyCommand(backspaceKeyCommand());

  beforeEach(async () => {
    ({ editorView, updateDoc } = await testEditor());
  });

  test('toggles correctly', async () => {
    updateDoc(
      <doc>
        <ol>
          <li>
            <para>[]text</para>
          </li>
        </ol>
      </doc>,
    );

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      <doc>
        <para>[]text</para>
      </doc>,
    );
  });

  test('toggles correctly with multi paragraphs', async () => {
    updateDoc(
      <doc>
        <ol>
          <li>
            <para>[]text</para>
            <para>other</para>
          </li>
        </ol>
      </doc>,
    );

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      <doc>
        <para>[]text</para>
        <para>other</para>
      </doc>,
    );
  });
});

describe('Command: enterKeyCommand', () => {
  let updateDoc,
    editorView,
    cmd = applyCommand(enterKeyCommand());

  beforeEach(async () => {
    ({ editorView, updateDoc } = await testEditor());
  });

  test('creates a new list when pressed enter at end', async () => {
    updateDoc(
      <doc>
        <ul>
          <li>
            <para>foobar[]</para>
          </li>
        </ul>
      </doc>,
    );

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>foobar</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    );
  });

  test('splits list', async () => {
    updateDoc(
      <doc>
        <ul>
          <li>
            <para>foo[]bar</para>
          </li>
        </ul>
      </doc>,
    );

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>foo</para>
          </li>
          <li>
            <para>bar</para>
          </li>
        </ul>
      </doc>,
    );
  });

  test('Handles if two items in list', async () => {
    updateDoc(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second[]third</para>
          </li>
        </ul>
      </doc>,
    );

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
          </li>
          <li>
            <para>third</para>
          </li>
        </ul>
      </doc>,
    );
  });

  test('outdents to an empty para if enter on empty non-nested list', async () => {
    updateDoc(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ul>
        <para>end</para>
      </doc>,
    );

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
        </ul>
        <para>[]</para>
        <para>end</para>
      </doc>,
    );
  });

  test('outdents to first list if enter on empty 2nd nest list', async () => {
    updateDoc(
      <doc>
        <ul>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>[]</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    );
  });

  test('preserves the type of parent list (ul) if enter on empty 2nd nest ol list', async () => {
    updateDoc(
      <doc>
        <ul>
          <li>
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

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Markdown shortcuts Input rules', () => {
  test('-<Space> should create list', async () => {
    const { editorView } = await testEditor(
      <doc>
        <para>first</para>
        <para>[]</para>
      </doc>,
    );

    typeText(editorView, '- kj');
    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <para>first</para>
        <ul>
          <li>
            <para>kj[]</para>
          </li>
        </ul>
      </doc>,
    );
  });
  test('*<Space> should create list', async () => {
    const { editorView } = await testEditor(
      <doc>
        <para>first</para>
        <para>[]</para>
      </doc>,
    );

    typeText(editorView, '* kj');
    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <para>first</para>
        <ul>
          <li>
            <para>kj[]</para>
          </li>
        </ul>
      </doc>,
    );
  });
  test.skip('*<Space> merge list if a list is already at bottom', async () => {
    const { editorView } = await testEditor(
      <doc>
        <para>[]</para>
        <ul>
          <li>
            <para>second</para>
          </li>
        </ul>
      </doc>,
    );

    typeText(editorView, '* k');
    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>k</para>
          </li>
          <li>
            <para>second</para>
          </li>
        </ul>
      </doc>,
    );
  });

  test('*<Space> merge list if near a list', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
        </ul>
        <para>[]</para>
      </doc>,
    );

    typeText(editorView, '* kj');
    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>kj</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it.skip('should convert to a bullet list item after shift+enter ', async () => {
    const { editorView, sel } = await testEditor(
      <doc>
        <para>
          test
          <br />
          []
        </para>
      </doc>,
    );
    typeText(editorView, '* ', sel);

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <para>test</para>
        <ul>
          <li>
            <para></para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('should be not be possible to convert a code to a list item', async () => {
    const testEditor = renderTestEditor({});

    const { editorView, sel } = await testEditor(
      <doc>
        <codeBlock>[]</codeBlock>
      </doc>,
    );
    typeText(editorView, '* ', sel);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <codeBlock>* </codeBlock>
      </doc>,
    );
  });

  test.skip('1.<space> should create ordered list', async () => {
    const { editorView } = await testEditor(
      <doc>
        <para>first[]</para>
      </doc>,
    );
    sendKeyToPm(editorView, 'Enter');
    typeText(editorView, '1. k');

    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <para>first</para>
        <ol>
          (
          <li>
            <para>k[]</para>
          </li>
        </ol>
      </doc>,
    );
  });
  it('should not convert "2. " to a ordered list item', async () => {
    const { editorView, sel } = await testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    typeText(editorView, '2. ', sel);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <para>2. </para>
      </doc>,
    );
  });

  it('should not convert "2. " after shift+enter to a ordered list item', async () => {
    const { editorView, sel } = await testEditor(
      <doc>
        <para>
          test
          <br />
          []
        </para>
      </doc>,
    );
    typeText(editorView, '2. ', sel);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <para>
          test
          <br />
          2.{' '}
        </para>
      </doc>,
    );
  });
});

test('Typing works', async () => {
  const { view } = await testEditor(
    <doc>
      <ul>
        <li>
          <para>foo[]bar</para>
        </li>
      </ul>
    </doc>,
  );

  typeText(view, 'hello');

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <ul>
        <li>
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
        <li>
          <para>foo[]bar</para>
        </li>
      </ul>
    </doc>,
  );

  sendKeyToPm(view, 'Enter');

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <ul>
        <li>
          <para>foo</para>
        </li>
        <li>
          <para>[]bar</para>
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
          <li>
            <para>foo[]bar</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Tab');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
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
          <li>
            <para>first</para>
          </li>
          <li>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(view, 'Tab');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
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
});

describe('Pressing Backspace', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Backspace');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('should outdent a first level list item to paragraph', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ol>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
        </ol>
        <para>[]</para>
      </doc>,
    );
  });

  it('should outdent a first level list item to paragraph, with content', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
          <li>
            <para>[]second text</para>
          </li>
        </ol>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
        </ol>
        <para>[]second text</para>
      </doc>,
    );
  });

  it('should outdent a second level list item to first level', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>text</para>
            <ol>
              <li>
                <para>[]</para>
              </li>
            </ol>
          </li>
        </ol>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ol>
      </doc>,
    );
  });

  it('should outdent a second level list item to first level, with content', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>text</para>
            <ol>
              <li>
                <para>[]subtext</para>
              </li>
            </ol>
          </li>
        </ol>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
          <li>
            <para>[]subtext</para>
          </li>
        </ol>
      </doc>,
    );
  });

  it('should move paragraph content back to previous (nested) list item', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>text</para>
            <ol>
              <li>
                <para>text</para>
              </li>
            </ol>
          </li>
        </ol>
        <para>[]after</para>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>text</para>
            <ol>
              <li>
                <para>text[]after</para>
              </li>
            </ol>
          </li>
        </ol>
      </doc>,
    );
  });

  it('keeps nodes same level as backspaced list item together in same list', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>[]A</para>
            <ol>
              <li>
                <para>B</para>
              </li>
            </ol>
          </li>
          <li>
            <para>C</para>
          </li>
        </ol>
        <para>after</para>
      </doc>,
      <doc>
        <para>[]A</para>
        <ol>
          <li>
            <para>B</para>
          </li>
          <li>
            <para>C</para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
    );
  });

  it('merges two single-level lists when the middle paragraph is backspaced', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>A</para>
          </li>
          <li>
            <para>B</para>
          </li>
        </ol>

        <para>[]middle</para>

        <ol>
          <li>
            <para>C</para>
          </li>
          <li>
            <para>D</para>
          </li>
        </ol>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>A</para>
          </li>
          <li>
            <para>B[]middle</para>
          </li>
          <li>
            <para>C</para>
          </li>
          <li>
            <para>D</para>
          </li>
        </ol>
      </doc>,
    );
  });

  it('merges two double-level lists when the middle paragraph is backspaced', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>A</para>
            <ol>
              <li>
                <para>B</para>
              </li>
            </ol>
          </li>
          <li>
            <para>C</para>
          </li>
        </ol>

        <para>[]middle</para>

        <ol>
          <li>
            <para>D</para>
            <ol>
              <li>
                <para>E</para>
              </li>
            </ol>
          </li>
          <li>
            <para>F</para>
          </li>
        </ol>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>A</para>
            <ol>
              <li>
                <para>B</para>
              </li>
            </ol>
          </li>
          <li>
            <para>C[]middle</para>
          </li>
          <li>
            <para>D</para>
            <ol>
              <li>
                <para>E</para>
              </li>
            </ol>
          </li>
          <li>
            <para>F</para>
          </li>
        </ol>
      </doc>,
    );
  });

  it('moves directly to previous list item if it was empty', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>nice</para>
          </li>
          <li>
            <para></para>
          </li>
          <li>
            <para>[]text</para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>nice</para>
          </li>
          <li>
            <para>[]text</para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
    );
  });

  it('moves directly to previous list item if it was empty, but with two paragraphs', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>nice</para>
          </li>
          <li>
            <para></para>
          </li>
          <li>
            <para>[]text</para>
            <para>double</para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>nice</para>
          </li>
          <li>
            <para>[]text</para>
            <para>double</para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
    );
  });

  it('backspaces paragraphs within a list item rather than the item itself', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para></para>
          </li>
          <li>
            <para>nice</para>
            <para>[]two</para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
      <doc>
        <ol>
          <li>
            <para></para>
          </li>
          <li>
            <para>nice[]two</para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
    );
  });

  it('backspaces line breaks correctly within list items, with content after', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para></para>
          </li>
          <li>
            <para>nice</para>
            <para>
              two
              <br />
              []three
            </para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
      <doc>
        <ol>
          <li>
            <para></para>
          </li>
          <li>
            <para>nice</para>
            <para>two[]three</para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
    );
  });

  it('backspaces line breaks correctly within list items, with content before', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para></para>
          </li>
          <li>
            <para>nice</para>
            <para>
              two
              <br />
              <br />
              []
            </para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
      <doc>
        <ol>
          <li>
            <para></para>
          </li>
          <li>
            <para>nice</para>
            <para>
              two
              <br />
              []
            </para>
          </li>
        </ol>

        <para>after</para>
      </doc>,
    );
  });
});

// TODO fix these edge cases
describe('Pressing Forward delete', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Delete');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it.skip('Should handle empty paragraph', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ol>
        <para></para>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ol>
        )
      </doc>,
    );
  });

  it.skip('Should handle non-empty paragraph', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ol>
        <para>hello</para>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
          <li>
            <para>[]hello</para>
          </li>
        </ol>
        )
      </doc>,
    );
  });
});

describe('Pressing Shift-Tab', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Shift-Tab');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('should outdent the list', async () => {
    await check(
      <doc>
        <ol>
          <li>
            <para>One</para>
            <ul>
              <li>
                <para>Two[]</para>
              </li>
            </ul>
          </li>
        </ol>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>One</para>
          </li>
          <li>
            <para>Two[]</para>
          </li>
        </ol>
      </doc>,
    );
  });
});

describe('Pressing Shift-Ctrl-8', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Shift-Ctrl-8');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('should indent the list', async () => {
    await check(
      <doc>
        <para>One[]</para>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>One</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('should outdent the list', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>One[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <para>One[]</para>
      </doc>,
    );
  });

  it('works with nested list', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>One[]</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <para>One[]</para>
        <ul>
          <li>
            <para>nested:1</para>
          </li>
        </ul>
      </doc>,
    );
  });

  // TODO this is a bug
  it.skip('works with nested list with empty content', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>One[]</para>
            <ul>
              <li>
                <para></para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <para>One[]</para>
        <ul>
          <li>
            <para></para>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Pressing Shift-Ctrl-9', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Shift-Ctrl-9');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('should outdent the list', async () => {
    await check(
      <doc>
        <para>One[]</para>
      </doc>,
      <doc>
        <ol>
          <li>
            <para>One</para>
          </li>
        </ol>
      </doc>,
    );
  });
});

describe('Press Alt-Up / Down to move list', () => {
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
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>second[]</para>
          </li>
          <li>
            <para>first</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('if item above exists and selection is in between', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>sec[]ond</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>sec[]ond</para>
          </li>
          <li>
            <para>first</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('if item above exists and selection is at start', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>[]second</para>
          </li>
          <li>
            <para>first</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('if  first item is very big', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>first is really big</para>
          </li>
          <li>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>[]second</para>
          </li>
          <li>
            <para>first is really big</para>
          </li>
        </ul>
      </doc>,
    );
  });
  it('if second item is very big', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>f</para>
          </li>
          <li>
            <para>[]second is really big</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>[]second is really big</para>
          </li>
          <li>
            <para>f</para>
          </li>
        </ul>
      </doc>,
    );
  });
  it('if second item is empty', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
          <li>
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
          <li>
            <para></para>
          </li>
          <li>
            <para>sec[]ond</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>sec[]ond</para>
          </li>
          <li>
            <para></para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('works for nested ul list', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2[]</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:2[]</para>
              </li>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Move up for first item in their level', () => {
  const checkUp = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Up');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('apex item is outdented', async () => {
    await checkUp(
      <doc>
        <ul>
          <li>
            <para>first[]</para>
          </li>
          <li>
            <para>second</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <para>first</para>
        <ul>
          <li>
            <para>second</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('simple', async () => {
    await checkUp(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1[]</para>
              </li>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>nested:1</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('any nested children also move along', async () => {
    await checkUp(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1[]</para>
                <ul>
                  <li>
                    <para>nested-child:1</para>
                  </li>
                </ul>
              </li>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>nested:1</para>
            <ul>
              <li>
                <para>nested-child:1</para>
              </li>
            </ul>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('deeply nested list works', async () => {
    await checkUp(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
                <ul>
                  <li>
                    <para>nested-child:1[]</para>
                  </li>
                </ul>
              </li>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested-child:1</para>
              </li>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('encounters uncle', async () => {
    await checkUp(
      <doc>
        <ul>
          <li>
            <para>uncle</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1[]</para>
              </li>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>uncle</para>
          </li>
          <li>
            <para>nested:1</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('encounters uncle with children', async () => {
    await checkUp(
      <doc>
        <ul>
          <li>
            <para>uncle</para>
            <ul>
              <li>
                <para>uncles child:1</para>
              </li>
              <li>
                <para>uncles child:2</para>
              </li>
            </ul>
          </li>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>nested:1[]</para>
              </li>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>uncle</para>
            <ul>
              <li>
                <para>uncles child:1</para>
              </li>
              <li>
                <para>uncles child:2</para>
              </li>
            </ul>
          </li>
          <li>
            <para>nested:1</para>
          </li>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Move down for last item in their level', () => {
  const checkDown = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Down');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('rock bottom item is outdented', async () => {
    await checkDown(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
        </ul>
        <para>second</para>
      </doc>,
    );
  });

  it('simple', async () => {
    await checkDown(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2[]</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
          <li>
            <para>nested:2</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('any nested children also move along', async () => {
    await checkDown(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2[]</para>
                <ul>
                  <li>
                    <para>nested-child:1</para>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
          <li>
            <para>nested:2</para>
            <ul>
              <li>
                <para>nested-child:1</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('deeply nested list works', async () => {
    await checkDown(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2</para>
                <ul>
                  <li>
                    <para>nested-child:1[]</para>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2</para>
              </li>
              <li>
                <para>nested-child:1</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('encounters uncle', async () => {
    await checkDown(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2[]</para>
              </li>
            </ul>
          </li>
          <li>
            <para>uncle</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
          <li>
            <para>uncle</para>
          </li>
          <li>
            <para>nested:2</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('encounters uncle with children', async () => {
    await checkDown(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2[]</para>
              </li>
            </ul>
          </li>
          <li>
            <para>uncle</para>
            <ul>
              <li>
                <para>uncles child:1</para>
              </li>
              <li>
                <para>uncles child:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
          <li>
            <para>uncle</para>
            <ul>
              <li>
                <para>uncles child:1</para>
              </li>
              <li>
                <para>uncles child:2</para>
              </li>
            </ul>
          </li>
          <li>
            <para>nested:2</para>
          </li>
        </ul>
      </doc>,
    );
  });
  it('encounters uncles with children', async () => {
    await checkDown(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2[]</para>
              </li>
            </ul>
          </li>
          <li>
            <para>uncle</para>
            <ul>
              <li>
                <para>uncles child:1</para>
              </li>
              <li>
                <para>uncles child:2</para>
              </li>
            </ul>
          </li>
          <li>
            <para>uncle2</para>
            <ul>
              <li>
                <para>uncles2 child:1</para>
              </li>
              <li>
                <para>uncles2 child:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
          <li>
            <para>uncle</para>
            <ul>
              <li>
                <para>uncles child:1</para>
              </li>
              <li>
                <para>uncles child:2</para>
              </li>
            </ul>
          </li>
          <li>
            <para>nested:2</para>
          </li>
          <li>
            <para>uncle2</para>
            <ul>
              <li>
                <para>uncles2 child:1</para>
              </li>
              <li>
                <para>uncles2 child:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('outdents to list', async () => {
    await checkDown(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
          <li>
            <para>thir[]d</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
        </ul>
        <para>third</para>
      </doc>,
    );
  });

  it('outdents to list if other elements below', async () => {
    await checkDown(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
          <li>
            <para>third[]</para>
          </li>
        </ul>
        <ol>
          <li>
            <para>1</para>
          </li>
        </ol>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
            </ul>
          </li>
        </ul>
        <para>third</para>
        <ol>
          <li>
            <para>1</para>
          </li>
        </ol>
      </doc>,
    );
  });
});

describe('Press Alt-Down to move list', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Down');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('outdents single item', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>first[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <para>first[]</para>
      </doc>,
    );
  });

  it('works if running on last item', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
        </ul>
        <para>second[]</para>
      </doc>,
    );
  });

  it('if item above exists and selection is in between', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>sec[]ond</para>
          </li>
          <li>
            <para>first</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>sec[]ond</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('if item below exists and selection is at end', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>second[]</para>
          </li>
          <li>
            <para>first</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second[]</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('if item below exists and selection is in between', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>sec[]ond</para>
          </li>
          <li>
            <para>first</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>sec[]ond</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('if item below exists and selection is at start', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>[]second</para>
          </li>
          <li>
            <para>first</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('if  last item is very big', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>[]second</para>
          </li>
          <li>
            <para>first is really big</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first is really big</para>
          </li>
          <li>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );
  });
  it('if first item is very big', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>[]second is really big</para>
          </li>
          <li>
            <para>f</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>f</para>
          </li>
          <li>
            <para>[]second is really big</para>
          </li>
        </ul>
      </doc>,
    );
  });
  it('if first item is empty', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
          <li>
            <para>first</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('works for nested ul list', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1[]</para>
              </li>
              <li>
                <para>nested:2</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:2</para>
              </li>
              <li>
                <para>nested:1[]</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });

  it('works for 2x nested ul list', async () => {
    await check(
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2</para>
                <ul>
                  <li>
                    <para>nested:1:1[]</para>
                  </li>
                  <li>
                    <para>nested:2:2</para>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
            <ul>
              <li>
                <para>nested:1</para>
              </li>
              <li>
                <para>nested:2</para>
                <ul>
                  <li>
                    <para>nested:2:2</para>
                  </li>
                  <li>
                    <para>nested:1:1[]</para>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Meta-c on empty selections', () => {
  it('should work', async () => {
    document.execCommand = jest.fn(() => {});

    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>magic</para>
          </li>
          <li>
            <para>k[]j</para>
            <ul>
              <li>
                <para>foobar</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
    sendKeyToPm(editorView, 'Cmd-c');
    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>magic</para>
          </li>
          <li>
            <para>k[]j</para>
            <ul>
              <li>
                <para>foobar</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );
    expect(document.execCommand).toBeCalledTimes(1);
    expect(document.execCommand).toBeCalledWith('copy');
  });
});

describe('Meta-x on empty selections', () => {
  test('should cut a document', async () => {
    document.execCommand = jest.fn(() => {});

    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>magic</para>
          </li>
          <li>
            <para>fooba[]r</para>
          </li>
        </ul>
      </doc>,
    );
    sendKeyToPm(editorView, 'Cmd-x');
    expect(editorView.state.selection).toMatchInlineSnapshot(`
          Object {
            "anchor": 10,
            "type": "node",
          }
        `);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li>
            <para>magic</para>
          </li>
          <li>
            <para>foobar</para>
          </li>
        </ul>
      </doc>,
    );
    expect(document.execCommand).toBeCalledTimes(1);
  });
});

describe('Toggling the list', () => {
  const toggleOrderedList = (editorView) =>
    toggleList(editorView.state.schema.nodes['ordered_list'])(
      editorView.state,
      editorView.dispatch,
      editorView,
    );
  const toggleBulletList = (editorView) =>
    toggleList(editorView.state.schema.nodes['bullet_list'])(
      editorView.state,
      editorView.dispatch,
      editorView,
    );
  it('should allow toggling between normal text and ordered list', async () => {
    const { editorView } = await testEditor(
      <doc>
        <para>t[ex]t</para>
      </doc>,
    );

    toggleOrderedList(editorView);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ol>
          <li>
            <para>text</para>
          </li>
        </ol>
      </doc>,
    );
    toggleOrderedList(editorView);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <para>text</para>
      </doc>,
    );
  });

  it('should allow toggling between normal text and bullet list', async () => {
    const { editorView } = await testEditor(
      <doc>
        <para>t[ex]t</para>
      </doc>,
    );

    toggleBulletList(editorView);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li>
            <para>text</para>
          </li>
        </ul>
      </doc>,
    );
    toggleBulletList(editorView);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <para>text</para>
      </doc>,
    );
  });

  it('should allow toggling between ordered and bullet list', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ol>
          <li>
            <para>t[ex]t</para>
          </li>
        </ol>
      </doc>,
    );

    toggleBulletList(editorView);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li>
            <para>text</para>
          </li>
        </ul>
      </doc>,
    );
    toggleBulletList(editorView);
    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <para>text</para>
      </doc>,
    );
  });

  describe('toggling a list', () => {
    it("shouldn't affect text selection", async () => {
      const { editorView } = await testEditor(
        <doc>
          <para>hello[]</para>
        </doc>,
      );

      toggleBulletList(editorView);
      // If the text is not selected, pressing enter will
      // create a new paragraph. If it is selected the
      // 'hello' text will be removed
      sendKeyToPm(editorView, 'Enter');

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ul>
            <li>
              <para>hello</para>
            </li>
            <li>
              <para></para>
            </li>
          </ul>
        </doc>,
      );
    });
  });

  describe('untoggling a list', () => {
    const expectedOutput = (
      <doc>
        <ol>
          <li>
            <para>One</para>
          </li>
        </ol>
        <para>Two</para>
        <para>Three</para>
        <ol>
          <li>
            <para>Four</para>
          </li>
        </ol>
      </doc>
    );

    it('should allow untoggling part of a list based on selection', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>[Two</para>
            </li>
            <li>
              <para>Three]</para>
            </li>
            <li>
              <para>Four</para>
            </li>
          </ol>
        </doc>,
      );
      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should untoggle empty paragraphs in a list', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>[One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para></para>
            </li>
            <li>
              <para>Three]</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <para>One</para>
          <para>Two</para>
          <para></para>
          <para>Three</para>
        </doc>,
      );
    });

    it('should untoggle all list items with different ancestors in selection', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>[Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ol>
          <ol>
            <li>
              <para>One]</para>
            </li>
            <li>
              <para>Two</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
          </ol>
          <para>Two</para>
          <para>Three</para>
          <para>One</para>
          <ol>
            <li>
              <para>Two</para>
            </li>
          </ol>
        </doc>,
      );
    });
  });

  describe('converting a list', () => {
    it('should allow converting part of a list based on selection', async () => {
      const expectedOutput = (
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
          </ol>
          <ul>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ul>
          <ol>
            <li>
              <para>Four</para>
            </li>
          </ol>
        </doc>
      );
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>[Two</para>
            </li>
            <li>
              <para>Three]</para>
            </li>
            <li>
              <para>Four</para>
            </li>
          </ol>
        </doc>,
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should allow converting part of a list based on selection that starts at the end of previous line', async () => {
      const expectedOutput = (
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
          </ol>
          <ul>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ul>
          <ol>
            <li>
              <para>Four</para>
            </li>
          </ol>
        </doc>
      );
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One[</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three]</para>
            </li>
            <li>
              <para>Four</para>
            </li>
          </ol>
        </doc>,
      ); // When selection starts on previous (empty) node

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list when the selection starts with a paragraph and ends inside a list', async () => {
      const expectedOutput = (
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
            <li>
              <para>Four</para>
            </li>
          </ol>
        </doc>
      );
      const { editorView } = await testEditor(
        <doc>
          <para>[One</para>
          <ol>
            <li>
              <para>Two]</para>
            </li>
            <li>
              <para>Three</para>
            </li>
            <li>
              <para>Four</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list when the selection contains a list but starts and end with paragraphs', async () => {
      const expectedOutput = (
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
            <li>
              <para>Four</para>
            </li>
          </ol>
        </doc>
      );
      const { editorView } = await testEditor(
        <doc>
          <para>[One</para>
          <ol>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ol>
          <para>Four]</para>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list when the selection starts inside a list and ends with a paragraph', async () => {
      const expectedOutput = (
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
            <li>
              <para>Four</para>
            </li>
          </ol>
        </doc>
      );
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>[Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ol>
          <para>Four]</para>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list and keep empty paragraphs', async () => {
      const expectedOutput = (
        <doc>
          <ul>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para></para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ul>
        </doc>
      );
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>[One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para></para>
            </li>
            <li>
              <para>Three]</para>
            </li>
          </ol>
        </doc>,
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to list when there is an empty paragraph between non empty two', async () => {
      const expectedOutput = (
        <doc>
          <ul>
            <li>
              <para>One</para>
            </li>
            <li>
              <para></para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ul>
        </doc>
      );
      const { editorView } = await testEditor(
        <doc>
          <para>[One</para>
          <para></para>
          <para>Three]</para>
        </doc>,
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list when it is a paragraph with supported marks', async () => {
      const expectedOutput = (
        <doc>
          <ul>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>
                <underline>Two</underline>
              </para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ul>
        </doc>
      );
      const { editorView } = await testEditor(
        <doc>
          <para>[One</para>
          <para>
            <underline>Two</underline>
          </para>
          <para>Three]</para>
        </doc>,
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });
  });

  describe('joining lists', () => {
    const expectedOutputForPreviousList = (
      <doc>
        <ol>
          <li>
            <para>One</para>
          </li>
          <li>
            <para>Two</para>
          </li>
          <li>
            <para>Three</para>
          </li>
          <li>
            <para>Four</para>
          </li>
          <li>
            <para>Five</para>
          </li>
        </ol>
        <para>Six</para>
      </doc>
    );
    const expectedOutputForNextList = (
      <doc>
        <para>One</para>
        <ol>
          <li>
            <para>Two</para>
          </li>
          <li>
            <para>Three</para>
          </li>
          <li>
            <para>Four</para>
          </li>
          <li>
            <para>Five</para>
          </li>
          <li>
            <para>Six</para>
          </li>
        </ol>
      </doc>
    );
    const expectedOutputForPreviousAndNextList = (
      <doc>
        <ol>
          <li>
            <para>One</para>
          </li>
          <li>
            <para>Two</para>
          </li>
          <li>
            <para>Three</para>
          </li>
          <li>
            <para>Four</para>
          </li>
          <li>
            <para>Five</para>
          </li>
          <li>
            <para>Six</para>
          </li>
        </ol>
      </doc>
    );

    it("should join with previous list if it's of the same type", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ol>
          <para>[Four</para>
          <para>Five]</para>
          <para>Six</para>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        expectedOutputForPreviousList,
      );
    });

    it("should join with previous list if it's of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three[</para>
            </li>
          </ol>
          <para>Four</para>
          <para>Five]</para>
          <para>Six</para>
        </doc>,
      ); // When selection starts on previous (empty) node

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        expectedOutputForPreviousList,
      );
    });

    it("should not join with previous list if it's not of the same type", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ol>
          <para>[Four</para>
          <para>Five]</para>
          <para>Six</para>
        </doc>,
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ol>
          <ul>
            <li>
              <para>Four</para>
            </li>
            <li>
              <para>Five</para>
            </li>
          </ul>
          <para>Six</para>
        </doc>,
      );
    });

    it("should not join with previous list if it's not of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three[</para>
            </li>
          </ol>
          <para>Four</para>
          <para>Five]</para>
          <para>Six</para>
        </doc>,
      ); // When selection starts on previous (empty) node

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ol>
          <ul>
            <li>
              <para>Four</para>
            </li>
            <li>
              <para>Five</para>
            </li>
          </ul>
          <para>Six</para>
        </doc>,
      );
    });

    it("should join with next list if it's of the same type", async () => {
      const { editorView } = await testEditor(
        <doc>
          <para>One</para>
          <para>[Two</para>
          <para>Three]</para>
          <ol>
            <li>
              <para>Four</para>
            </li>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutputForNextList);
    });

    it("should join with next list if it's of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        <doc>
          <para>One[</para>
          <para>Two</para>
          <para>Three]</para>
          <ol>
            <li>
              <para>Four</para>
            </li>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutputForNextList);
    });

    it("should not join with next list if it isn't of the same type", async () => {
      const { editorView } = await testEditor(
        <doc>
          <para>One</para>
          <para>[Two</para>
          <para>Three]</para>
          <ol>
            <li>
              <para>Four</para>
            </li>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <para>One</para>
          <ul>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ul>
          <ol>
            <li>
              <para>Four</para>
            </li>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it("should not join with next list if it isn't of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        <doc>
          <para>One[</para>
          <para>Two</para>
          <para>Three]</para>
          <ol>
            <li>
              <para>Four</para>
            </li>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <para>One</para>
          <ul>
            <li>
              <para>Two</para>
            </li>
            <li>
              <para>Three</para>
            </li>
          </ul>
          <ol>
            <li>
              <para>Four</para>
            </li>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it("should join with previous and next list if they're of the same type", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
          </ol>
          <para>[Three</para>
          <para>Four]</para>
          <ol>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        expectedOutputForPreviousAndNextList,
      );
    });

    it("should join with previous and next list if they're of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two[</para>
            </li>
          </ol>
          <para>Three</para>
          <para>Four]</para>
          <ol>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        expectedOutputForPreviousAndNextList,
      );
    });

    it("should not join with previous and next list if they're not of the same type", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
          </ol>
          <para>[Three</para>
          <para>Four]</para>
          <ol>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
          </ol>
          <ul>
            <li>
              <para>Three</para>
            </li>
            <li>
              <para>Four</para>
            </li>
          </ul>
          <ol>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it("should not join with previous and next list if they're not of the same type and selectoin starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two[</para>
            </li>
          </ol>
          <para>Three</para>
          <para>Four]</para>
          <ol>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>One</para>
            </li>
            <li>
              <para>Two</para>
            </li>
          </ol>
          <ul>
            <li>
              <para>Three</para>
            </li>
            <li>
              <para>Four</para>
            </li>
          </ul>
          <ol>
            <li>
              <para>Five</para>
            </li>
            <li>
              <para>Six</para>
            </li>
          </ol>
        </doc>,
      );
    });
  });

  describe('Nested Lists', () => {
    describe('When gap cursor is inside listItem before codeBlock', () => {
      it.skip('should increase the depth of list item when Tab key press', async () => {
        const { editorView } = await testEditor(
          <doc>
            <ol>
              <li>
                <para>text</para>
              </li>
              <li>
                <codeBlock>[]text</codeBlock>
              </li>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );
        // enable gap cursor
        sendKeyToPm(editorView, 'ArrowLeft');
        // expect(editorView.state.selection instanceof GapCursorSelection).toBe(
        //   true,
        // );
        expect(editorView.state.selection.$from.depth).toEqual(2);

        sendKeyToPm(editorView, 'Tab');

        expect(editorView.state.selection.$from.depth).toEqual(4);
      });

      it.skip('should decrease the depth of list item when Shift-Tab key press', async () => {
        const { editorView } = await testEditor(
          <doc>
            <ol>
              <li>
                <para>text</para>
                <ol>
                  <li>
                    <codeBlock>[]text</codeBlock>
                  </li>
                </ol>
              </li>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );
        // enable gap cursor
        sendKeyToPm(editorView, 'ArrowLeft');
        // expect(editorView.state.selection instanceof GapCursorSelection).toBe(
        //   true,
        // );
        expect(editorView.state.selection.$from.depth).toEqual(4);

        sendKeyToPm(editorView, 'Shift-Tab');

        expect(editorView.state.selection.$from.depth).toEqual(2);
      });
    });

    it('should increase the depth of list item when Tab key press', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>text</para>
            </li>
            <li>
              <para>te[]xt</para>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
      expect(editorView.state.selection.$from.depth).toEqual(3);

      sendKeyToPm(editorView, 'Tab');

      expect(editorView.state.selection.$from.depth).toEqual(5);
    });

    it("shouldn't increase the depth of list item when Tab key press when at 5 levels indentation", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>first</para>
              <ol>
                <li>
                  <para>second</para>
                  <ol>
                    <li>
                      <para>third</para>
                      <ol>
                        <li>
                          <para>fourth</para>
                          <ol>
                            <li>
                              <para>fifth</para>
                              <para>maybe seventh[]</para>
                            </li>
                          </ol>
                        </li>
                      </ol>
                    </li>
                  </ol>
                </li>
              </ol>
            </li>
          </ol>
        </doc>,
      );

      expect(editorView.state.selection.$from.depth).toEqual(11);

      sendKeyToPm(editorView, 'Tab');

      expect(editorView.state.selection.$from.depth).toEqual(11);
    });

    it("shouldn't increase the depth of list item when Tab key press when a child list at 6 levels indentation", async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>first</para>
              <ol>
                <li>
                  <para>second</para>
                  <ol>
                    <li>
                      <para>third</para>
                      <ol>
                        <li>
                          <para>fourth</para>
                          <ol>
                            <li>
                              <para>fifth</para>
                            </li>
                            <li>
                              <para>[fifth]</para>
                              <ol>
                                <li>
                                  <para>sixth</para>
                                </li>
                              </ol>
                            </li>
                          </ol>
                        </li>
                      </ol>
                    </li>
                  </ol>
                </li>
              </ol>
            </li>
          </ol>
        </doc>,
      );

      expect(editorView.state.selection.$from.depth).toEqual(11);

      sendKeyToPm(editorView, 'Tab');

      expect(editorView.state.selection.$from.depth).toEqual(11);
    });

    it('should nest the list item when Tab key press', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>text</para>
            </li>
            <li>
              <para>te[]xt</para>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );

      sendKeyToPm(editorView, 'Tab');

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>text</para>
              <ol>
                <li>
                  <para>te[]xt</para>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it('should decrease the depth of list item when Shift-Tab key press', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>text</para>
              <ol>
                <li>
                  <para>te[]xt</para>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
      expect(editorView.state.selection.$from.depth).toEqual(5);

      sendKeyToPm(editorView, 'Shift-Tab');

      expect(editorView.state.selection.$from.depth).toEqual(3);
    });

    it('should lift the list item when Shift-Tab key press', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>text</para>
              <ol>
                <li>
                  <para>te[]xt</para>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );

      sendKeyToPm(editorView, 'Shift-Tab');

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>text</para>
            </li>
            <li>
              <para>te[]xt</para>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it('should lift nested and same level list items correctly', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>some[]text</para>
              <ol>
                <li>
                  <para>B</para>
                </li>
              </ol>
            </li>
            <li>
              <para>C</para>
            </li>
          </ol>

          <para>after</para>
        </doc>,
      );

      sendKeyToPm(editorView, 'Shift-Tab');

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <para>some[]text</para>
          <ol>
            <li>
              <para>B</para>
            </li>
            <li>
              <para>C</para>
            </li>
          </ol>

          <para>after</para>
        </doc>,
      );
    });

    it('should lift the list item when Enter key press is done on empty list-item', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>text</para>
              <ol>
                <li>
                  <para>[]</para>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );

      sendKeyToPm(editorView, 'Enter');

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>text</para>
            </li>
            <li>
              <para>[]</para>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
    });
  });

  describe('Enter key-press', () => {
    describe('when Enter key is pressed on empty nested list item', () => {
      it('should create new list item in parent list', async () => {
        const { editorView } = await testEditor(
          <doc>
            <ol>
              <li>
                <para>text</para>
                <ol>
                  <li>
                    <para>[]</para>
                  </li>
                </ol>
              </li>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );

        sendKeyToPm(editorView, 'Enter');

        expect(editorView.state.doc).toEqualDocument(
          <doc>
            <ol>
              <li>
                <para>text</para>
              </li>
              <li>
                <para>[]</para>
              </li>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );
      });
    });

    describe('when Enter key is pressed on non-empty nested list item', () => {
      it('should created new nested list item', async () => {
        const { editorView } = await testEditor(
          <doc>
            <ol>
              <li>
                <para>text</para>
                <ol>
                  <li>
                    <para>test[]</para>
                  </li>
                </ol>
              </li>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );

        sendKeyToPm(editorView, 'Enter');

        expect(editorView.state.doc).toEqualDocument(
          <doc>
            <ol>
              <li>
                <para>text</para>
                <ol>
                  <li>
                    <para>test</para>
                  </li>
                  <li>
                    <para>[]</para>
                  </li>
                </ol>
              </li>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );
      });
    });

    describe('when Enter key is pressed on non-empty top level list item', () => {
      it('should created new list item at top level', async () => {
        const { editorView } = await testEditor(
          <doc>
            <ol>
              <li>
                <para>text</para>
              </li>
              <li>
                <para>test[]</para>
              </li>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );

        sendKeyToPm(editorView, 'Enter');

        expect(editorView.state.doc).toEqualDocument(
          <doc>
            <ol>
              <li>
                <para>text</para>
              </li>
              <li>
                <para>test</para>
              </li>
              <li>
                <para>[]</para>
              </li>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );
      });
    });

    describe('when Enter key is pressed on empty top level list item', () => {
      it('should create new paragraph outside the list', async () => {
        const { editorView } = await testEditor(
          <doc>
            <ol>
              <li>
                <para>text</para>
              </li>
              <li>
                <para>[]</para>
              </li>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );

        sendKeyToPm(editorView, 'Enter');

        expect(editorView.state.doc).toEqualDocument(
          <doc>
            <ol>
              <li>
                <para>text</para>
              </li>
            </ol>
            <para>[]</para>
            <ol>
              <li>
                <para>text</para>
              </li>
            </ol>
          </doc>,
        );
      });
    });
  });

  describe('Toggle - nested list scenarios - to lift items out of list', () => {
    it('should be possible to toggle a simple nested list', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>text</para>
              <ol>
                <li>
                  <para>text[]</para>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>text</para>
            </li>
          </ol>
          <para>text[]</para>
          <ol>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it('should be possible to toggle an empty nested list item', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>text</para>
              <ol>
                <li>
                  <para>[]</para>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>text</para>
            </li>
          </ol>
          <para>[]</para>
          <ol>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it('should be possible to toggle a selection across different depths in the list', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>te[xt</para>
              <ol>
                <li>
                  <para>text]</para>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <para>te[xt</para>
          <para>text]</para>
          <ol>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it('should be possible to toggle a selection across lists with different parent lists', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>te[xt</para>
              <ol>
                <li>
                  <para>text</para>
                </li>
              </ol>
            </li>
          </ol>
          <ol>
            <li>
              <para>te]xt</para>
              <ol>
                <li>
                  <para>text</para>
                </li>
              </ol>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <para>te[xt</para>
          <para>text</para>
          <para>te]xt</para>
          <ol>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it('should be create a new list for children of lifted list item', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>text</para>
              <ol>
                <li>
                  <para>te[]xt</para>
                  <ol>
                    <li>
                      <para>text</para>
                    </li>
                  </ol>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>text</para>
            </li>
          </ol>
          <para>te[]xt</para>
          <ol>
            <li>
              <para>text</para>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
    });

    it('should change type to bullet list when toggling orderedList to bulletList', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ol>
            <li>
              <para>text</para>
              <ol>
                <li>
                  <para>text</para>
                  <ol>
                    <li>
                      <para>te[]xt</para>
                    </li>
                  </ol>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );

      toggleBulletList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        <doc>
          <ol>
            <li>
              <para>text</para>
              <ol>
                <li>
                  <para>text</para>
                  <ul>
                    <li>
                      <para>te[]xt</para>
                    </li>
                  </ul>
                </li>
              </ol>
            </li>
            <li>
              <para>text</para>
            </li>
          </ol>
        </doc>,
      );
    });
  });
});

describe('Insert empty list above and below', () => {
  test.each([
    [
      <doc>
        <ul>
          <li>
            <para>top[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
          <li>
            <para>top</para>
          </li>
        </ul>
      </doc>,
    ],
    // empty
    [
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
          <li>
            <para></para>
          </li>
        </ul>
      </doc>,
    ],
    // nested
    [
      <doc>
        <ul>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>[]</para>
              </li>
              <li>
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
          <li>
            <para>first[]</para>
            <ul>
              <li>
                <para>second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    ],
  ])('Case %# insert above', async (input, expected) => {
    const { view } = await testEditor(input);

    sendKeyToPm(view, 'Cmd-Shift-Enter');

    expect(view.state).toEqualDocAndSelection(expected);
  });

  test.each([
    [
      <doc>
        <ul>
          <li>
            <para>top[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    ],
    // empty
    [
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para></para>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    ],
    // nested
    [
      <doc>
        <ul>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>[]second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>second</para>
              </li>
              <li>
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
          <li>
            <para>first[]</para>
            <ul>
              <li>
                <para>second</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>second</para>
              </li>
            </ul>
          </li>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    ],
  ])('Case %# insert below', async (input, expected) => {
    const { view } = await testEditor(input);

    sendKeyToPm(view, 'Cmd-Enter');

    expect(view.state).toEqualDocAndSelection(expected);
  });
});
