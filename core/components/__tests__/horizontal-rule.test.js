/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx, renderTestEditor } from '../../test-helpers/index';

import { typeText } from '../../test-helpers/index';

describe('Markdown shorthand works', () => {
  const testEditor = renderTestEditor();

  it('test ---', () => {
    const { view } = testEditor(
      <doc>
        <para>test</para>
        <para>[]</para>
      </doc>,
    );

    typeText(view, '---');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>test</para>
        <hr />
        <para>[]</para>
      </doc>,
    );
  });

  it('test --- empty doc', () => {
    const { view } = testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    typeText(view, '---');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <hr />
        <para>[]</para>
      </doc>,
    );
  });

  it('type ___ without space', () => {
    const { view } = testEditor(
      <doc>
        <para>test</para>
        <para>[]</para>
      </doc>,
    );

    typeText(view, '___');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>test</para>
        <para>___[]</para>
      </doc>,
    );
  });

  it('type ___ with space', () => {
    const { view } = testEditor(
      <doc>
        <para>test</para>
        <para>[]</para>
      </doc>,
    );

    typeText(view, '___ ');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>test</para>
        <hr />
        <para>[]</para>
      </doc>,
    );
  });
});
