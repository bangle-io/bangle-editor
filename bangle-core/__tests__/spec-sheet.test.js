import { MarkType, NodeType } from 'prosemirror-model';
import { hardBreak, doc, paragraph, text } from '../components/index';
import { bold } from '../components/index';
import { SpecSheet } from '../spec-sheet';

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
    hardBreak: expect.any(NodeType),
    paragraph: expect.any(NodeType),
    text: expect.any(NodeType),
  });

  expect(schema.topNodeType.name).toBe('doc');

  expect(schema.marks).toEqual({
    bold: expect.any(MarkType),
  });
});

test('Loads default nodes', () => {
  const schema = new SpecSheet([hardBreak.spec(), bold.spec()]).schema;
  expect(schema.nodes).toMatchObject({
    doc: expect.any(NodeType),
    hardBreak: expect.any(NodeType),
    paragraph: expect.any(NodeType),
    text: expect.any(NodeType),
  });

  expect(schema.topNodeType.name).toBe('doc');

  expect(schema.marks).toEqual({
    bold: expect.any(MarkType),
  });
});
