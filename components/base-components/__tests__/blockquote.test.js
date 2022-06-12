/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx, sendKeyToPm, typeText } from '@bangle.dev/test-helpers';

import { blockquote } from '../src/index';
import { defaultTestEditor } from './test-editor';

const keybindings = blockquote.defaultKeys;

describe('Markdown shorthand works', () => {
  const testEditor = defaultTestEditor();

  it('pressing > on empty paragraph works', () => {
    const { view } = testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    typeText(view, '> kj');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <blockquote>
          <para>kj[]</para>
        </blockquote>
      </doc>,
    );
  });

  it('pressing > on empty heading works', () => {
    const { view } = testEditor(
      <doc>
        <heading>[]</heading>
      </doc>,
    );

    typeText(view, '> kj');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <blockquote>
          <heading>kj[]</heading>
        </blockquote>
      </doc>,
    );
  });

  it('pressing > on empty bullet list doesnt not work', () => {
    const { view } = testEditor(
      <doc>
        <ul>
          <li>
            <para>[]</para>
          </li>
        </ul>
      </doc>,
    );

    typeText(view, '> kj');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>{'> kj'}[]</para>
          </li>
        </ul>
      </doc>,
    );
  });
});

describe('Keyboard shortcut', () => {
  const testEditor = defaultTestEditor();

  test('Empty cut', async () => {
    document.execCommand = jest.fn(() => {});
    const { view } = await testEditor(
      <doc>
        <para>hello world</para>
        <blockquote>
          <para>foobar[]</para>
        </blockquote>
      </doc>,
    );

    sendKeyToPm(view, keybindings.emptyCut);

    expect(document.execCommand).toBeCalledTimes(1);
    expect(document.execCommand).toBeCalledWith('cut');
    expect(view.state.selection).toMatchInlineSnapshot(`
      Object {
        "anchor": 13,
        "type": "node",
      }
    `);
    // The data is the same  because we just set the selection
    // and expect the browser to do the actual cutting.
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>hello world</para>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>,
    );
  });

  test('Empty copy', async () => {
    document.execCommand = jest.fn(() => {});
    const { view } = await testEditor(
      <doc>
        <para>hello world</para>
        <blockquote>
          <para>foobar[]</para>
        </blockquote>
      </doc>,
    );

    sendKeyToPm(view, keybindings.emptyCopy);

    expect(document.execCommand).toBeCalledTimes(1);
    expect(document.execCommand).toBeCalledWith('copy');
    expect(view.state.selection).toMatchInlineSnapshot(`
      Object {
        "anchor": 21,
        "head": 21,
        "type": "text",
      }
    `);
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>hello world</para>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>,
    );
  });

  it('works on empty para', () => {
    const { view } = testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.wrapIn);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <blockquote>
          <para>[]</para>
        </blockquote>
      </doc>,
    );
  });

  it('works with content in the para', () => {
    const { view } = testEditor(
      <doc>
        <para>kj[]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.wrapIn);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <blockquote>
          <para>kj[]</para>
        </blockquote>
      </doc>,
    );
  });
});

describe('Insert empty paragraph above and below', () => {
  const testEditor = defaultTestEditor();

  test.each([
    [
      <doc>
        <blockquote>
          <para>foo[]bar</para>
        </blockquote>
      </doc>,
      <doc>
        <para>[]</para>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>[]foobar</para>
        </blockquote>
      </doc>,
      <doc>
        <para>[]</para>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <para>[]</para>
        <blockquote>
          <para></para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>hello</para>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <para>[]</para>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <para>other paragraph</para>
        <para>[]</para>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>top</para>
        </blockquote>
        <blockquote>
          <para>hello[]</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>top</para>
        </blockquote>
        <para>[]</para>
        <blockquote>
          <para>hello</para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <blockquote>
          <para>hello[]</para>
        </blockquote>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>[]</para>
        <blockquote>
          <para>hello</para>
        </blockquote>
      </doc>,
    ],
  ])('Case %# insert empty paragraph above', async (input, expected) => {
    const { view } = testEditor(input);

    sendKeyToPm(view, keybindings.insertEmptyParaAbove);

    expect(view.state).toEqualDocAndSelection(expected);
  });

  test.each([
    [
      <doc>
        <blockquote>
          <para>foo[]bar</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>foobar</para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>[]foobar</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>foobar</para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para></para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>hello</para>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>top</para>
        </blockquote>
        <blockquote>
          <para>hello[]</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>top</para>
        </blockquote>
        <blockquote>
          <para>hello</para>
        </blockquote>
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
        <blockquote>
          <para>[]hello</para>
        </blockquote>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <blockquote>
          <para>hello</para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
  ])('Case %# insert empty paragraph below', async (input, expected) => {
    const { view } = testEditor(input);

    sendKeyToPm(view, keybindings.insertEmptyParaBelow);

    expect(view.state).toEqualDocAndSelection(expected);
  });
});

describe('Opts', () => {
  test('Setting keybindings to null works', async () => {
    const testEditor = defaultTestEditor({
      plugins: { blockquote: { keybindings: null } },
    });

    const { view } = testEditor(
      <doc>
        <blockquote>
          <para>[]</para>
        </blockquote>
      </doc>,
    );

    sendKeyToPm(view, keybindings.insertEmptyParaAbove);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <blockquote>
          <para>[]</para>
        </blockquote>
      </doc>,
    );
  });
});
