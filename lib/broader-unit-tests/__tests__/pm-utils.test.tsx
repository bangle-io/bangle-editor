/**
 * @jest-environment jsdom
 */
/** @jsx psx */

import { findCutBefore, isFirstChildOfParent } from '@bangle.dev/utils';
import { psx, renderTestEditor } from '@bangle.dev/test-helpers';
import { defaultSpecs, defaultPlugins } from '@bangle.dev/default-components';
import { SpecRegistry } from '@bangle.dev/core';

const testEditor = renderTestEditor({
  specRegistry: new SpecRegistry(defaultSpecs()),
  plugins: defaultPlugins(),
});

describe('isFirstChildOfParent', () => {
  describe('top level paragraphs', () => {
    it('returns true for first paragraph at top level', async () => {
      const { editorView } = await testEditor(
        <doc>
          <para>[]hello</para>
          <para>world</para>
        </doc>,
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });

    it('returns true for second paragraph at top level', async () => {
      const { editorView } = await testEditor(
        <doc>
          <para>hello</para>
          <para>wo[]rld</para>
        </doc>,
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });
  });

  describe('list item with two paragraphs', () => {
    it('returns true with selection in first', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ul>
            <li>
              <para>[]hello</para>
              <para>world</para>
            </li>
          </ul>
        </doc>,
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });

    it('returns false with selection in second', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ul>
            <li>
              <para>hello</para>
              <para>wo[]rld</para>
            </li>
          </ul>
        </doc>,
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(false);
    });
  });

  describe('multiple list items', () => {
    it('returns true with selection in start of second li', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ul>
            <li>
              <para>first</para>
            </li>
            <li>
              <para>[]hello</para>
            </li>
          </ul>
        </doc>,
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });

    it('returns true with selection in first p of first nested li', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ul>
            <li>
              <para>first</para>
              <ul>
                <li>
                  <para>[]hello</para>
                  <para>world</para>
                </li>
              </ul>
            </li>
          </ul>
        </doc>,
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });

    it('returns false with selection in second p of first nested li', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ul>
            <li>
              <para>first</para>
              <ul>
                <li>
                  <para>hello</para>
                  <para>[]world</para>
                </li>
              </ul>
            </li>
          </ul>
        </doc>,
      );
      expect(isFirstChildOfParent(editorView.state)).toBe(false);
    });

    it('returns true with selection at start of first p of second nested li', async () => {
      const { editorView } = await testEditor(
        <doc>
          <ul>
            <li>
              <para>first</para>
              <ul>
                <li>
                  <para>hello</para>
                  <para>world</para>
                </li>
                <li>
                  <para>[]second</para>
                </li>
              </ul>
            </li>
          </ul>
        </doc>,
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });
  });
});

describe('findCutBefore', () => {
  it('finds a split in a balanced tree', async () => {
    const { editorView } = await testEditor(
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

    const { $from } = editorView.state.selection;
    const { listItem } = editorView.state.schema.nodes;

    const $cut = findCutBefore($from);
    expect($cut).not.toBeNull();

    expect($cut?.nodeBefore?.type).toBe(listItem);
    expect($cut?.nodeAfter?.type).toBe(listItem);

    expect($cut?.nodeBefore?.firstChild?.textContent).toBe('first');
    expect($cut?.nodeAfter?.firstChild?.textContent).toBe('second');
  });

  it('finds a split in an unbalanced tree above', async () => {
    const { editorView } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>nested</para>
              </li>
            </ul>
          </li>
          <li>
            <para>[]second</para>
          </li>
        </ul>
      </doc>,
    );

    const { $from } = editorView.state.selection;
    const { listItem } = editorView.state.schema.nodes;

    const $cut = findCutBefore($from);
    expect($cut).not.toBeNull();

    expect($cut?.nodeBefore?.type).toBe(listItem);
    expect($cut?.nodeAfter?.type).toBe(listItem);

    expect($cut?.nodeBefore?.firstChild?.textContent).toBe('first');
    expect($cut?.nodeAfter?.firstChild?.textContent).toBe('second');
  });

  it('finds a split in an unbalanced tree below', async () => {
    const { editorView, posLabels } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>first</para>
            <ul>
              <li>
                <para>nested</para>
              </li>
            </ul>
          </li>
          <li>
            <para>second</para>
            <para>nested</para>
            <ul>
              <li>
                <para>[]child</para>
              </li>
            </ul>
          </li>
        </ul>
      </doc>,
    );

    const { $from } = editorView.state.selection;
    const $cut = findCutBefore($from);
    expect($cut).not.toBeNull();

    expect($cut?.nodeBefore).toBeDefined();
    expect($cut?.nodeAfter).toBeDefined();
    expect($cut?.pos).toBe(posLabels?.['[]'] - 3);
  });
});
