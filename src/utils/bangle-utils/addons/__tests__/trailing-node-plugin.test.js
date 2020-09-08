/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import '../../../../test-helpers/jest-helpers';
import { psx } from '../../../../test-helpers/schema-builders';
import { sendKeyToPm, typeText } from '../../../../test-helpers';
import { renderTestEditor } from '../../../../test-helpers/render-helper';
// import { applyCommand } from '../../../../test-helpers/commands-helpers';

import { Heading } from '../../nodes';

import { TrailingNode } from '../trailing-node';

const extensions = [new Heading(), new TrailingNode()];

const testEditor = renderTestEditor({ extensions });

test('Does not add trailing node when typing paragraphs', async () => {
  const { editor } = await testEditor(
    <doc>
      <para>foo[]bar</para>
    </doc>,
  );

  typeText(editor.view, 'hello');
  sendKeyToPm(editor.view, 'Enter');
  typeText(editor.view, 'lastpara');

  expect(editor.state).toEqualDocAndSelection(
    <doc>
      <para>foohello</para>
      <para>lastpara[]bar</para>
    </doc>,
  );
});

test('creates an empty para below Heading', async () => {
  const { editor } = await testEditor(
    <doc>
      <para>foobar[]</para>
    </doc>,
  );

  sendKeyToPm(editor.view, 'Enter');
  typeText(editor.view, '# heading');

  expect(editor.state).toEqualDocAndSelection(
    <doc>
      <para>foobar</para>
      <heading>heading</heading>
      <para></para>
    </doc>,
  );
});
