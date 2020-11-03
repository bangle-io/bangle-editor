/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { psx, renderTestEditor, sendKeyToPm } from 'bangle-core/test-helpers';

const testEditor = renderTestEditor();

describe('Insert empty paragraph above and below', () => {
  test.each([
    [
      <doc>
        <heading level="1">foo[]bar</heading>
      </doc>,
      <doc>
        <para>[]</para>
        <heading level="1">foobar</heading>
      </doc>,
    ],
    [
      <doc>
        <para>top</para>
        <heading level="1">hello[]</heading>
      </doc>,
      <doc>
        <para>top</para>
        <para>[]</para>
        <heading level="1">hello</heading>
      </doc>,
    ],
    [
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <heading level="1">hello[]</heading>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>[]</para>
        <heading level="1">hello</heading>
      </doc>,
    ],
  ])('Case %# insert empty paragraph above', async (input, expected) => {
    const { view } = await testEditor(input);

    sendKeyToPm(view, 'Cmd-Shift-Enter');

    expect(view.state).toEqualDocAndSelection(expected);
  });

  test.each([
    [
      <doc>
        <heading level="1">foo[]bar</heading>
      </doc>,
      <doc>
        <heading level="1">foobar</heading>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <para>top</para>
        <heading level="1">hello[]</heading>
      </doc>,
      <doc>
        <para>top</para>
        <heading level="1">hello</heading>
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
        <heading level="1">hello[]</heading>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <heading level="1">hello</heading>
        <para>[]</para>
      </doc>,
    ],
  ])('Case %# insert empty paragraph below', async (input, expected) => {
    const { view } = await testEditor(input);

    sendKeyToPm(view, 'Cmd-Enter');

    expect(view.state).toEqualDocAndSelection(expected);
  });
});
