/**
 * @jest-environment jsdom
 */

import '../../../../test-helpers/jest-helpers';

import { doc, p, h1 } from '../../../../test-helpers/test-builders';
import {
  renderTestEditor,
  sendKeyToPm,
  typeText,
} from '../../../../test-helpers';
// import { applyCommand } from '../../../../test-helpers/commands-helpers';

import {
  OrderedList,
  BulletList,
  ListItem,
  HardBreak,
  Heading,
} from '../../nodes';
import { Underline } from '../../marks';

import { TrailingNode } from '../trailing-node';

const extensions = [new Heading(), new TrailingNode()];

const testEditor = renderTestEditor({ extensions });

test('Does not add trailing node when typing paragraphs', async () => {
  const { editor } = await testEditor(doc(p('foo{<>}bar')));

  typeText(editor.view, 'hello');
  sendKeyToPm(editor.view, 'Enter');
  typeText(editor.view, 'lastpara');

  expect(editor.state).toEqualDocAndSelection(
    doc(p('foohello'), p('lastpara{<>}bar')),
  );
});

test('creates an empty para below Heading', async () => {
  const { editor } = await testEditor(doc(p('foobar{<>}')));

  sendKeyToPm(editor.view, 'Enter');
  typeText(editor.view, '# heading');

  expect(editor.state).toEqualDocAndSelection(
    doc(p('foobar'), h1('heading'), p('')),
  );
});
