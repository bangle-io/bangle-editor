/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { SpecRegistry } from '@bangle.dev/core';
import { heading } from '@bangle.dev/base-components';
import { defaultSpecs, defaultPlugins } from '@bangle.dev/default-components';
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
  typeText,
} from '@bangle.dev/test-helpers';
import { trailingNode } from '../index';

const specRegistry = new SpecRegistry([
  ...defaultSpecs(),
  trailingNode.spec({}),
]);
const plugins = [...defaultPlugins(), trailingNode.plugins({})];

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

test('Trailing node and collapsible heading', async () => {
  const original = (
    <doc>
      <heading level={2}>a[]b</heading>
      <para>hello</para>
      <para>abcd</para>
      <heading level={3}>bye</heading>
      <para>end</para>
      <para></para>
    </doc>
  );
  const { view } = testEditor(original);
  heading.toggleHeadingCollapse()(view.state, view.dispatch);
  heading.toggleHeadingCollapse()(view.state, view.dispatch);
  expect(view.state).toEqualDocAndSelection(original);

  heading.toggleHeadingCollapse()(view.state, view.dispatch);
  heading.toggleHeadingCollapse()(view.state, view.dispatch);
  expect(view.state).toEqualDocAndSelection(original);

  heading.toggleHeadingCollapse()(view.state, view.dispatch);
  heading.toggleHeadingCollapse()(view.state, view.dispatch);
  expect(view.state).toEqualDocAndSelection(original);
});
