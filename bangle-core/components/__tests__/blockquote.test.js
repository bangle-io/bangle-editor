/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
} from 'bangle-core/test-helpers/index';

import { typeText } from 'bangle-core/test-helpers/index';
import { blockquote } from '../index';
const testEditor = renderTestEditor();

const keybindings = blockquote.defaultKeys;

describe('Markdown shorthand works', () => {
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
  it('works on empty para', () => {
    const { view } = testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    sendKeyToPm(view, 'Ctrl-ArrowRight');

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

    sendKeyToPm(view, 'Ctrl-ArrowRight');

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

    sendKeyToPm(view, keybindings.insertEmptyAbove);

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

    sendKeyToPm(view, keybindings.insertEmptyBelow);

    expect(view.state).toEqualDocAndSelection(expected);
  });
});
