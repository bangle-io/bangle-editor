/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  renderTestEditor,
  psx,
  typeText,
  sendKeyToPm,
} from 'bangle-core/test-helpers';

import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import { ListItem } from '../list-item/list-item';
import { Underline } from '../../marks';

import { CodeBlock } from '../code-block';
import { Heading } from '../heading';
import { HardBreak } from '../hard-break';

import { Blockquote } from '../blockquote';
import { TodoList } from '../todo-list';
import { TodoItem } from '../todo-item';
import { Paragraph } from '../paragraph';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new HardBreak(),
  new Heading(),
  new Underline(),
  new TodoList(),
  new TodoItem(),
  new Blockquote(),
  new CodeBlock(),
];

const testEditor = renderTestEditor({ extensions, type: 'new' });

describe('Basics', () => {
  test('is able to type paragraph', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    typeText(editor.view, 'hello');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>foohello[]bar</para>
      </doc>,
    );
  });

  test('is able to create a new paragraph', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>foo</para>
        <para>[]bar</para>
      </doc>,
    );
  });

  test('is able to create a new paragraph', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>foobar[]</para>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>foobar</para>
        <para>[]</para>
      </doc>,
    );
  });

  // TODO this is broken for some reason
  test.skip('is able to backspace', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>foobar[]</para>
      </doc>,
    );

    sendKeyToPm(editor.view, 'Backspace');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>fooba[]</para>
      </doc>,
    );
  });
});

describe('Moving selection start and end', () => {
  const { keys } = new Paragraph().options;
  it('Moves selection to the start', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>foobar[]</para>
      </doc>,
    );

    sendKeyToPm(editor.view, keys.jumpToStartOfLine);

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>[]foobar</para>
      </doc>,
    );
  });

  it('Moves selection to the start', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>f[]oobar</para>
      </doc>,
    );

    sendKeyToPm(editor.view, keys.jumpToStartOfLine);

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>[]foobar</para>
      </doc>,
    );
  });

  it('Moves selection to the start', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>[]foobar</para>
      </doc>,
    );

    sendKeyToPm(editor.view, keys.jumpToStartOfLine);

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>[]foobar</para>
      </doc>,
    );
  });

  it('Moves selection to start when inside a list', async () => {
    const { editor } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>foobar[]</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editor.view, keys.jumpToStartOfLine);

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>[]foobar</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('Moves selection to the end', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>[]foobar</para>
      </doc>,
    );

    sendKeyToPm(editor.view, keys.jumpToEndOfLine);

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>foobar[]</para>
      </doc>,
    );
  });

  it('Moves selection to the end', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>fooba[]r</para>
      </doc>,
    );

    sendKeyToPm(editor.view, keys.jumpToEndOfLine);

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>foobar[]</para>
      </doc>,
    );
  });

  it('Moves selection to end when inside a list', async () => {
    const { editor } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>[]foobar</para>
          </li>
        </ul>
      </doc>,
    );

    sendKeyToPm(editor.view, keys.jumpToEndOfLine);

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>foobar[]</para>
          </li>
        </ul>
      </doc>,
    );
  });
});

test.todo('Bold italics etc');
test.todo('Convert to different node type to para');

describe('Moving up and down', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Up');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
    sendKeyToPm(editorView, 'Alt-Down');
    expect(editorView.state).toEqualDocAndSelection(beforeDoc);
  };

  it('basic', async () => {
    await check(
      <doc>
        <para>foobar</para>
        <para>hello[]</para>
      </doc>,
      <doc>
        <para>hello[]</para>
        <para>foobar</para>
      </doc>,
    );
  });

  it('works with underline ', async () => {
    await check(
      <doc>
        <para>foobar</para>
        <para>
          he<underline>lo[]</underline>
        </para>
      </doc>,
      <doc>
        <para>
          he<underline>lo[]</underline>
        </para>
        <para>foobar</para>
      </doc>,
    );
  });

  it('works with hard break', async () => {
    await check(
      <doc>
        <para>foobar</para>
        <para>
          hello[]
          <br />
          why
        </para>
      </doc>,
      <doc>
        <para>
          hello[]
          <br />
          why
        </para>
        <para>foobar</para>
      </doc>,
    );
  });

  it('works with hard break', async () => {
    await check(
      <doc>
        <para>foobar</para>
        <para>
          hello
          <br />
          []why
        </para>
      </doc>,
      <doc>
        <para>
          hello
          <br />
          []why
        </para>
        <para>foobar</para>
      </doc>,
    );
  });

  it('swaps with ul list', async () => {
    await check(
      <doc>
        <para>foobar</para>
        <ul>
          <li>
            <para>
              hello
              <br />
            </para>
          </li>
          <li>
            <para>why</para>
          </li>
        </ul>
        <para>[]lorem</para>
      </doc>,
      <doc>
        <para>foobar</para>
        <para>[]lorem</para>
        <ul>
          <li>
            <para>
              hello
              <br />
            </para>
          </li>
          <li>
            <para>why</para>
          </li>
        </ul>
      </doc>,
    );
  });

  it('swaps with ol list', async () => {
    await check(
      <doc>
        <para>foobar</para>
        <ol>
          <li>
            <para>
              hello
              <br />
            </para>
          </li>
          <li>
            <para>why</para>
          </li>
        </ol>
        <para>[]lorem</para>
      </doc>,
      <doc>
        <para>foobar</para>
        <para>[]lorem</para>
        <ol>
          <li>
            <para>
              hello
              <br />
            </para>
          </li>
          <li>
            <para>why</para>
          </li>
        </ol>
      </doc>,
    );
  });

  it('swaps with ol list', async () => {
    await check(
      <doc>
        <para>foobar</para>
        <ol>
          <li>
            <para>
              hello
              <br />
            </para>
          </li>
          <li>
            <para>why</para>
          </li>
        </ol>
        <para>[]lorem</para>
      </doc>,
      <doc>
        <para>foobar</para>
        <para>[]lorem</para>
        <ol>
          <li>
            <para>
              hello
              <br />
            </para>
          </li>
          <li>
            <para>why</para>
          </li>
        </ol>
      </doc>,
    );
  });

  it('swaps with heading', async () => {
    await check(
      <doc>
        <para>foobar</para>
        <heading level="1">hi</heading>
        <para>[]lorem</para>
      </doc>,
      <doc>
        <para>foobar</para>
        <para>[]lorem</para>
        <heading level="1">hi</heading>
      </doc>,
    );
  });

  it('swaps with codeBlock', async () => {
    await check(
      <doc>
        <para>foobar</para>
        <codeBlock>hi</codeBlock>
        <para>[]lorem</para>
      </doc>,
      <doc>
        <para>foobar</para>
        <para>[]lorem</para>
        <codeBlock>hi</codeBlock>
      </doc>,
    );
  });
});

describe('Insert empty paragraph above and below', () => {
  test.each([
    [
      <doc>
        <para>foo[]bar</para>
      </doc>,
      <doc>
        <para>[]</para>
        <para>foobar</para>
      </doc>,
    ],
    [
      <doc>
        <para>[]foobar</para>
      </doc>,
      <doc>
        <para>[]</para>
        <para>foobar</para>
      </doc>,
    ],
    [
      <doc>
        <para>[]</para>
      </doc>,
      <doc>
        <para>[]</para>
        <para></para>
      </doc>,
    ],
    [
      <doc>
        <para>other paragraph</para>
        <para>hello[]</para>
      </doc>,
      <doc>
        <para>other paragraph</para>
        <para>[]</para>
        <para>hello</para>
      </doc>,
    ],
    [
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>hello[]</para>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>[]</para>
        <para>hello</para>
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
        <para>foo[]bar</para>
      </doc>,
      <doc>
        <para>foobar</para>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <para>[]foobar</para>
      </doc>,
      <doc>
        <para>foobar</para>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <para>[]</para>
      </doc>,
      <doc>
        <para></para>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <para>other paragraph</para>
        <para>hello[]</para>
      </doc>,
      <doc>
        <para>other paragraph</para>
        <para>hello</para>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>hello[]</para>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>hello</para>
        <para>[]</para>
      </doc>,
    ],
  ])('Case %# insert below', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });
});
