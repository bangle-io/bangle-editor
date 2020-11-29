/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  typeText,
  sendKeyToPm,
  renderTestEditor,
} from '@banglejs/core/test-helpers/index';

import { corePlugins } from '@banglejs/core/utils/core-components';
import { trailingNode } from '../index';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { defaultSpecs } from '@banglejs/core/test-helpers/default-components';

const specRegistry = new SpecRegistry([
  ...defaultSpecs(),
  trailingNode.spec({}),
]);
const plugins = [...corePlugins(), trailingNode.plugins({})];

const testEditor = renderTestEditor({
  specRegistry,
  plugins,
});

test('Does not add trailing node when typing paragraphs', async () => {
  const { view } = await testEditor(
    <doc>
      <para>foo[]bar</para>
    </doc>,
  );

  typeText(view, 'hello');
  sendKeyToPm(view, 'Enter');
  typeText(view, 'lastpara');

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <para>foohello</para>
      <para>lastpara[]bar</para>
    </doc>,
  );
});

test('creates an empty para below Heading', async () => {
  const { view } = await testEditor(
    <doc>
      <para>foobar[]</para>
    </doc>,
  );

  sendKeyToPm(view, 'Enter');
  typeText(view, '# heading');

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <para>foobar</para>
      <heading>heading</heading>
      <para></para>
    </doc>,
  );
});
