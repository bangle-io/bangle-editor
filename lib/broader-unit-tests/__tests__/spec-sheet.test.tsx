import { MarkType, NodeType } from '@bangle.dev/pm';
import {
  bold,
  doc,
  hardBreak,
  paragraph,
  text,
} from '@bangle.dev/base-components';
import { SpecRegistry } from '@bangle.dev/core';

test('Loads node and marks schema correctly', () => {
  const schema = new SpecRegistry([
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
  const schema = new SpecRegistry([hardBreak.spec(), bold.spec()]).schema;
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
