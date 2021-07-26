/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx, typeText } from '@bangle.dev/test-helpers';
import { defaultTestEditor } from './test-editor';

describe('Markdown shorthand works', () => {
  const testEditor = defaultTestEditor();

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

  it('type --- above a paragraph', () => {
    const { view } = testEditor(
      <doc>
        <para>[]</para>
        <para>test</para>
      </doc>,
    );

    typeText(view, '---');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <hr />
        <para>[]test</para>
      </doc>,
    );
  });

  it('type --- above a hr', () => {
    const { view } = testEditor(
      <doc>
        <para>[]</para>
        <hr />
      </doc>,
    );

    typeText(view, '---');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <hr />
        <para>[]</para>
        <hr />
      </doc>,
    );
  });

  it('type --- inisde a nested blockquote', () => {
    const { view } = testEditor(
      <doc>
        <blockquote>
          <blockquote>
            <para>[]</para>
          </blockquote>
        </blockquote>
      </doc>,
    );

    typeText(view, '---');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <blockquote>
          <blockquote>
            <hr />
            <para>[]</para>
          </blockquote>
        </blockquote>
      </doc>,
    );
  });

  it('type --- inisde a paragraph with more text', () => {
    const { view } = testEditor(
      <doc>
        <para>[]abc</para>
      </doc>,
    );

    typeText(view, '---');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <hr />
        <para>[]abc</para>
      </doc>,
    );
  });
});
