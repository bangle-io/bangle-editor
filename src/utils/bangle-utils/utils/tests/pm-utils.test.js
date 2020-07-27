import {
  doc,
  ul,
  li,
  p,
  ol,
  br,
  codeBlock,
} from '../../../../../src/test-helpers/test-builders';
import { renderTestEditor } from '../../../../../src/test-helpers/render-test-editor';

import { BulletList, ListItem, OrderedList, HardBreak } from '../../nodes';
import { isFirstChildOfParent, findCutBefore } from '../pm-utils';
const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new HardBreak(),
];
const testEditor = renderTestEditor({ extensions });

describe('isFirstChildOfParent', () => {
  describe('top level paragraphs', () => {
    it('returns true for first paragraph at top level', async () => {
      const { editorView } = await testEditor(doc(p('{<>}hello'), p('world')));

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });

    it('returns true for second paragraph at top level', async () => {
      const { editorView } = await testEditor(doc(p('hello'), p('wo{<>}rld')));

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });
  });

  describe('list item with two paragraphs', () => {
    it('returns true with selection in first', async () => {
      const { editorView } = await testEditor(
        doc(ul(li(p('{<>}hello'), p('world')))),
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });

    it('returns false with selection in second', async () => {
      const { editorView } = await testEditor(
        doc(ul(li(p('hello'), p('wo{<>}rld')))),
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(false);
    });
  });

  describe('multiple list items', () => {
    it('returns true with selection in start of second li', async () => {
      const { editorView } = await testEditor(
        doc(ul(li(p('first')), li(p('{<>}hello')))),
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });

    it('returns true with selection in first p of first nested li', async () => {
      const { editorView } = await testEditor(
        doc(ul(li(p('first'), ul(li(p('{<>}hello'), p('world')))))),
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });

    it('returns false with selection in second p of first nested li', async () => {
      const { editorView } = await testEditor(
        doc(ul(li(p('first'), ul(li(p('hello'), p('{<>}world')))))),
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(false);
    });

    it('returns true with selection at start of first p of second nested li', async () => {
      const { editorView } = await testEditor(
        doc(
          ul(
            li(p('first'), ul(li(p('hello'), p('world')), li(p('{<>}second')))),
          ),
        ),
      );

      expect(isFirstChildOfParent(editorView.state)).toBe(true);
    });
  });
});

describe('findCutBefore', () => {
  it('finds a split in a balanced tree', async () => {
    const { editorView } = await testEditor(
      doc(ul(li(p('first')), li(p('{<>}second')))),
    );

    const { $from } = editorView.state.selection;
    const { list_item: listItem } = editorView.state.schema.nodes;

    const $cut = findCutBefore($from);
    expect($cut).not.toBeNull();

    expect($cut.nodeBefore.type).toBe(listItem);
    expect($cut.nodeAfter.type).toBe(listItem);

    expect($cut.nodeBefore.firstChild.textContent).toBe('first');
    expect($cut.nodeAfter.firstChild.textContent).toBe('second');
  });

  it('finds a split in an unbalanced tree above', async () => {
    const { editorView } = await testEditor(
      doc(ul(li(p('first'), ul(li(p('nested')))), li(p('{<>}second')))),
    );

    const { $from } = editorView.state.selection;
    const { list_item: listItem } = editorView.state.schema.nodes;

    const $cut = findCutBefore($from);
    expect($cut).not.toBeNull();

    expect($cut.nodeBefore.type).toBe(listItem);
    expect($cut.nodeAfter.type).toBe(listItem);

    expect($cut.nodeBefore.firstChild.textContent).toBe('first');
    expect($cut.nodeAfter.firstChild.textContent).toBe('second');
  });

  it('finds a split in an unbalanced tree below', async () => {
    const { editorView, refs } = await testEditor(
      doc(
        ul(
          li(p('first'), ul(li(p('nested')))),
          li(p('second'), p('nested'), ul(li(p('{<>}child')))),
        ),
      ),
    );

    const { $from } = editorView.state.selection;

    const $cut = findCutBefore($from);
    expect($cut).not.toBeNull();

    expect($cut.nodeBefore).toBeDefined();
    expect($cut.nodeAfter).toBeDefined();
    expect($cut.pos).toBe(refs['<>'] - 3);
  });

  //   it.skip('does not search across isolating boundaries', async () => {
  //     const { editorView } = await testEditor(
  //       doc(table()(tr(td()(p('{<>}hey'))))),
  //       (editorProps: { allowTables: true }),
  //     );

  //     const { $from } = editorView.state.selection;

  //     const $cut = findCutBefore($from);
  //     expect($cut).toBeNull();
  //   });
});
