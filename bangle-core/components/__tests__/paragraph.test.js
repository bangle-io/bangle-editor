/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { doc, heading, paragraph, text } from 'bangle-core/components/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import {
  renderTestEditor,
  psx,
  typeText,
  sendKeyToPm,
} from 'bangle-core/test-helpers/index';
import {
  convertToParagraph,
  jumpToEndOfParagraph,
  jumpToStartOfParagraph,
} from '../paragraph';

const testEditor = renderTestEditor();
const keybindings = paragraph.defaultKeys;

describe('Basics', () => {
  test('Snapshot schema', () => {
    expect(paragraph.spec().schema.toDOM()).toEqual(['p', 0]);
    expect(paragraph.spec()).toMatchInlineSnapshot(`
      Object {
        "markdown": Object {
          "parseMarkdown": Object {
            "paragraph": Object {
              "block": "paragraph",
            },
          },
          "toMarkdown": [Function],
        },
        "name": "paragraph",
        "schema": Object {
          "content": "inline*",
          "draggable": false,
          "group": "block",
          "parseDOM": Array [
            Object {
              "tag": "p",
            },
          ],
          "toDOM": [Function],
        },
        "type": "node",
      }
    `);
  });
  test('is able to type paragraph', async () => {
    const { view } = testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    typeText(view, 'hello');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>foohello[]bar</para>
      </doc>,
    );
  });

  test('is able to create a new paragraph', async () => {
    const { view } = testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    sendKeyToPm(view, 'Enter');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>foo</para>
        <para>[]bar</para>
      </doc>,
    );
  });

  test('is able to create a new paragraph', async () => {
    const { view } = testEditor(
      <doc>
        <para>foobar[]</para>
      </doc>,
    );

    sendKeyToPm(view, 'Enter');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>foobar</para>
        <para>[]</para>
      </doc>,
    );
  });

  // TODO this is broken for some reason
  test.skip('is able to backspace', async () => {
    const { view } = testEditor(
      <doc>
        <para>foobar[]</para>
      </doc>,
    );

    sendKeyToPm(view, 'Backspace');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>fooba[]</para>
      </doc>,
    );
  });
});

describe('Commands', () => {
  describe('Jump selection start and end', () => {
    it('Moves selection to the start', async () => {
      const { view } = testEditor(
        <doc>
          <para>foobar[]</para>
        </doc>,
      );

      sendKeyToPm(view, keybindings.jumpToStartOfLine);

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <para>[]foobar</para>
        </doc>,
      );
    });

    it('Moves selection to the start', async () => {
      const { view } = testEditor(
        <doc>
          <para>f[]oobar</para>
        </doc>,
      );

      sendKeyToPm(view, keybindings.jumpToStartOfLine);

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <para>[]foobar</para>
        </doc>,
      );
    });

    it('Moves selection to the start', async () => {
      const { view } = testEditor(
        <doc>
          <para>[]foobar</para>
        </doc>,
      );

      sendKeyToPm(view, keybindings.jumpToStartOfLine);

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <para>[]foobar</para>
        </doc>,
      );
    });

    it('Moves selection to start when inside a list', async () => {
      const { view } = testEditor(
        <doc>
          <ul>
            <li>
              <para>foobar[]</para>
            </li>
          </ul>
        </doc>,
      );

      sendKeyToPm(view, keybindings.jumpToStartOfLine);

      expect(view.state).toEqualDocAndSelection(
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
      const { view } = testEditor(
        <doc>
          <para>[]foobar</para>
        </doc>,
      );

      sendKeyToPm(view, keybindings.jumpToEndOfLine);

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <para>foobar[]</para>
        </doc>,
      );
    });

    it('Moves selection to the end', async () => {
      const { view } = testEditor(
        <doc>
          <para>fooba[]r</para>
        </doc>,
      );

      sendKeyToPm(view, keybindings.jumpToEndOfLine);

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <para>foobar[]</para>
        </doc>,
      );
    });

    it('Moves selection to end when inside a list', async () => {
      const { view } = testEditor(
        <doc>
          <ul>
            <li>
              <para>[]foobar</para>
            </li>
          </ul>
        </doc>,
      );

      sendKeyToPm(view, keybindings.jumpToEndOfLine);

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <ul>
            <li>
              <para>foobar[]</para>
            </li>
          </ul>
        </doc>,
      );
    });

    it('Doesnt change selection if not in paragraph', async () => {
      const specSheet = new SpecSheet([
        doc.spec(),
        text.spec(),
        paragraph.spec(),
        heading.spec(),
      ]);
      // Not loading heading plugins to not interfere
      const plugins = [paragraph.plugins()];

      const testEditor = renderTestEditor({ specSheet, plugins });

      const { view } = testEditor(
        <doc>
          <heading>fooba[]r</heading>
        </doc>,
      );

      sendKeyToPm(view, keybindings.jumpToEndOfLine);

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <heading>fooba[]r</heading>
        </doc>,
      );
    });

    it('jumpToEndOfParagraph returns false if selection if not in paragraph', async () => {
      const testEditor = renderTestEditor();

      const { view } = testEditor(
        <doc>
          <heading>fooba[]r</heading>
        </doc>,
      );

      expect(jumpToEndOfParagraph()(view.state, view.dispatch, view)).toBe(
        false,
      );

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <heading>fooba[]r</heading>
        </doc>,
      );
    });

    it('jumpToEndOfParagraph returns true', async () => {
      const testEditor = renderTestEditor();

      const { view } = testEditor(
        <doc>
          <para>fooba[]r</para>
        </doc>,
      );

      expect(jumpToEndOfParagraph()(view.state, view.dispatch, view)).toBe(
        true,
      );

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <para>foobar[]</para>
        </doc>,
      );
    });

    it('jumpToStartOfParagraph returns false if selection if not in paragraph', async () => {
      const testEditor = renderTestEditor();

      const { view } = testEditor(
        <doc>
          <heading>fooba[]r</heading>
        </doc>,
      );

      expect(jumpToStartOfParagraph()(view.state, view.dispatch, view)).toBe(
        false,
      );

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <heading>fooba[]r</heading>
        </doc>,
      );
    });

    it('jumpToStartOfParagraph returns true', async () => {
      const testEditor = renderTestEditor();

      const { view } = testEditor(
        <doc>
          <para>fooba[]r</para>
        </doc>,
      );

      expect(jumpToStartOfParagraph()(view.state, view.dispatch, view)).toBe(
        true,
      );

      expect(view.state).toEqualDocAndSelection(
        <doc>
          <para>[]foobar</para>
        </doc>,
      );
    });
  });

  test.todo('Bold italics etc');
  test.todo('Convert to different node type to para');

  describe('Moving up and down', () => {
    const check = async (beforeDoc, afterDoc) => {
      const { editorView } = testEditor(beforeDoc);
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
      const { view } = testEditor(input);

      sendKeyToPm(view, keybindings.insertEmptyAbove);

      expect(view.state).toEqualDocAndSelection(expected);
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
      const { view } = testEditor(input);

      sendKeyToPm(view, keybindings.insertEmptyBelow);

      expect(view.state).toEqualDocAndSelection(expected);
    });
  });

  test('convert to paragraph', async () => {
    const { view } = testEditor(
      <doc>
        <heading level={1}>foobar[]</heading>
      </doc>,
    );

    expect(convertToParagraph()(view.state, view.dispatch)).toBe(true);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>foobar[]</para>
      </doc>,
    );
  });

  test('Empty cut', async () => {
    document.execCommand = jest.fn(() => {});
    const { view } = await testEditor(
      <doc>
        <para>hello world</para>
        <para>foobar[]</para>
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
        <para>foobar</para>
      </doc>,
    );
  });

  test('Empty copy', async () => {
    document.execCommand = jest.fn(() => {});
    const { view } = await testEditor(
      <doc>
        <para>hello world</para>
        <para>foobar[]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.emptyCopy);

    expect(document.execCommand).toBeCalledTimes(1);
    expect(document.execCommand).toBeCalledWith('copy');
    expect(view.state.selection).toMatchInlineSnapshot(`
      Object {
        "anchor": 20,
        "head": 20,
        "type": "text",
      }
    `);
  });
});
