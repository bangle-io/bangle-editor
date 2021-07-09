/**
 * @jest-environment jsdom
 */
/** @jsx psx */
/// <reference path="./missing-types.d.ts" />

import { PluginKey, SpecRegistry } from '@bangle.dev/core';
import {
  psx,
  renderTestEditor,
} from '@bangle.dev/core/test-helpers/test-helpers';
import { defaultSpecs } from '@bangle.dev/core/test-helpers/default-components';
import { search } from '../index';

const specRegistry = new SpecRegistry([...defaultSpecs(), search.spec()]);

const searchPluginKey = new PluginKey();
function countOcurrences(string: string, match: string) {
  return string.split(match).length - 1;
}

test('shows decoration', async () => {
  const testEditor = renderTestEditor({
    specRegistry,
    plugins: [search.plugins({ key: searchPluginKey, query: /hello/ })],
  });

  const { container, view } = testEditor(
    <doc>
      <para>hello [world]</para>
    </doc>,
  );

  expect(countOcurrences(container.innerHTML, '"bangle-search-match"')).toBe(1);

  expect(container).toMatchSnapshot();
});

test('1 shows multiple decorations', async () => {
  const testEditor = renderTestEditor({
    specRegistry,
    plugins: [search.plugins({ key: searchPluginKey, query: /hello/ })],
  });

  const { container } = testEditor(
    <doc>
      <para>hello [world] hello world</para>
    </doc>,
  );

  expect(countOcurrences(container.innerHTML, '"bangle-search-match"')).toBe(2);

  expect(container).toMatchSnapshot();
});

test('2 shows multiple decorations', async () => {
  const testEditor = renderTestEditor({
    specRegistry,
    plugins: [search.plugins({ key: searchPluginKey, query: 'o' })],
  });

  const { container } = testEditor(
    <doc>
      <para>hello [world] hello world</para>
    </doc>,
  );

  expect(countOcurrences(container.innerHTML, '"bangle-search-match"')).toBe(4);

  expect(container).toMatchSnapshot();
});

test('respects maxHighlights limit', async () => {
  const testEditor = renderTestEditor({
    specRegistry,
    plugins: [
      search.plugins({ key: searchPluginKey, query: 'o', maxHighlights: 2 }),
    ],
  });

  const { container } = testEditor(
    <doc>
      <para>hello [world] hello world</para>
    </doc>,
  );

  expect(countOcurrences(container.innerHTML, '"bangle-search-match"')).toBe(2);

  expect(container).toMatchSnapshot();
});

test('when caseSensitive is true', async () => {
  const testEditor = renderTestEditor({
    specRegistry,
    plugins: [
      search.plugins({
        key: searchPluginKey,
        query: /hello/,
        caseSensitive: true,
      }),
    ],
  });

  const { container, view } = testEditor(
    <doc>
      <para>Jello [world]</para>
    </doc>,
  );

  expect(countOcurrences(container.innerHTML, '"bangle-search-match"')).toBe(0);
});

test('1 works when no match', async () => {
  const testEditor = renderTestEditor({
    specRegistry,
    plugins: [search.plugins({ key: searchPluginKey, query: /hello/ })],
  });

  const { container } = testEditor(
    <doc>
      <para>bye [world] bye world</para>
    </doc>,
  );

  expect(countOcurrences(container.innerHTML, '"bangle-search-match"')).toBe(0);
});

test('2 works when no match', async () => {
  const testEditor = renderTestEditor({
    specRegistry,
    plugins: [search.plugins({ key: searchPluginKey, query: /hello/ })],
  });

  const { container } = testEditor(
    <doc>
      <para>bye bye world</para>
      <heading>bye bye world</heading>
    </doc>,
  );

  expect(countOcurrences(container.innerHTML, '"bangle-search-match"')).toBe(0);
});
