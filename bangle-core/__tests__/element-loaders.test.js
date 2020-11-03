import { MarkType, NodeType } from 'prosemirror-model';
import { hardBreak, doc, paragraph, text } from '../nodes/index';
import { bold } from '../marks/index';
import { SpecSheet } from 'bangle-core/spec-sheet';

test('Loads node and marks schema correctly', () => {
  const schema = new SpecSheet([
    doc.spec(),
    text.spec(),
    hardBreak.spec(),
    paragraph.spec(),
    bold.spec(),
  ]).schema;
  expect(schema.nodes).toMatchObject({
    doc: expect.any(NodeType),
    hard_break: expect.any(NodeType),
    paragraph: expect.any(NodeType),
    text: expect.any(NodeType),
  });

  expect(schema.topNodeType.name).toBe('doc');

  expect(schema.marks).toEqual({
    bold: expect.any(MarkType),
  });
});
