/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
  typeChar,
  typeText,
} from '../../test-helpers/test-helpers';
import { heading } from '../components';

const testEditor = renderTestEditor();
const keybindings = heading.defaultKeys;

describe('Basic', () => {
  it('test markdown # shortcut', () => {
    const { view } = testEditor(
      <doc>
        <para>test</para>
        <para>[]</para>
      </doc>,
    );
    typeChar(view, '#');
    typeChar(view, ' ');
    typeText(view, 'Hello');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>test</para>
        <heading level={1}>Hello</heading>
      </doc>,
    );
  });

  it('test markdown ## shortcut', () => {
    const { view } = testEditor(
      <doc>
        <para>test</para>
        <para>[]</para>
      </doc>,
    );
    typeChar(view, '#');
    typeChar(view, '#');
    typeChar(view, ' ');
    typeText(view, 'Hello');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>test</para>
        <heading level={2}>Hello</heading>
      </doc>,
    );
  });

  it('test markdown ### shortcut', () => {
    const { view } = testEditor(
      <doc>
        <para>test</para>
        <para>[]</para>
      </doc>,
    );
    typeChar(view, '#');
    typeChar(view, '#');
    typeChar(view, '#');
    typeChar(view, ' ');
    typeText(view, 'Hello');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>test</para>
        <heading level={3}>Hello</heading>
      </doc>,
    );
  });

  test('movingUp works', () => {
    const { view } = testEditor(
      <doc>
        <para>hello world</para>
        <heading>Hel[]lo</heading>
      </doc>,
    );
    sendKeyToPm(view, keybindings.moveUp);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <heading>Hel[]lo</heading>
        <para>hello world</para>
      </doc>,
    );
  });

  test('movingDown works', () => {
    const { view } = testEditor(
      <doc>
        <heading>[]Hello</heading>
        <para>hello world</para>
      </doc>,
    );
    sendKeyToPm(view, keybindings.moveDown);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>hello world</para>
        <heading>[]Hello</heading>
      </doc>,
    );
  });
});

describe('Jump selection start and end', () => {
  it('Moves selection to the start', async () => {
    const { view } = testEditor(
      <doc>
        <heading level={1}>foo[]bar</heading>
      </doc>,
    );

    sendKeyToPm(view, keybindings.jumpToStartOfHeading);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <heading level={1}>[]foobar</heading>
      </doc>,
    );

    sendKeyToPm(view, keybindings.jumpToEndOfHeading);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <heading level={1}>foobar[]</heading>
      </doc>,
    );
  });
});

describe('Insert empty paragraph above and below', () => {
  test.each([
    [
      <doc>
        <heading level={1}>foo[]bar</heading>
      </doc>,
      <doc>
        <para>[]</para>
        <heading level={1}>foobar</heading>
      </doc>,
    ],
    [
      <doc>
        <para>top</para>
        <heading level={1}>hello[]</heading>
      </doc>,
      <doc>
        <para>top</para>
        <para>[]</para>
        <heading level={1}>hello</heading>
      </doc>,
    ],
    [
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <heading level={1}>hello[]</heading>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>[]</para>
        <heading level={1}>hello</heading>
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
        <heading level={1}>foo[]bar</heading>
      </doc>,
      <doc>
        <heading level={1}>foobar</heading>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <para>top</para>
        <heading level={1}>hello[]</heading>
      </doc>,
      <doc>
        <para>top</para>
        <heading level={1}>hello</heading>
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
        <heading level={1}>hello[]</heading>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <heading level={1}>hello</heading>
        <para>[]</para>
      </doc>,
    ],
  ])('Case %# insert empty paragraph below', async (input, expected) => {
    const { view } = testEditor(input);

    sendKeyToPm(view, keybindings.insertEmptyParaBelow);

    expect(view.state).toEqualDocAndSelection(expected);
  });
});
