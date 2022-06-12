/**
 * @jest-environment jsdom
 */
/** @jsx pjsx */
import { act, fireEvent } from '@testing-library/react';

import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { SpecRegistry } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';
import {
  pjsx,
  reactTestEditor,
} from '@bangle.dev/react/__tests__/helpers/index';
import { sendKeyToPm } from '@bangle.dev/test-helpers';

import { stopwatch } from '../src/index';
import { Stopwatch } from '../src/stopwatch';

const specRegistry = new SpecRegistry([...defaultSpecs(), stopwatch.spec({})]);
const plugins = () => [...defaultPlugins(), stopwatch.plugins({})];

const renderNodeViews = jest.fn(({ node, ...args }) => {
  if (node.type.name === 'stopwatch') {
    return <Stopwatch node={node} {...args} />;
  }
  throw new Error('Unknown node');
});

const testEditor = reactTestEditor({
  specRegistry,
  plugins,
  renderNodeViews,
});

const dateNow = Date.now;
beforeEach(() => {
  Date.now = dateNow;
});

test('Keyboard shortcut works', async () => {
  Date.now = jest.fn(() => 0);
  const { view } = await testEditor(
    <doc>
      <ul>
        <li>
          <para>foo[]bar</para>
        </li>
      </ul>
    </doc>,
  );

  act(() => {
    sendKeyToPm(view, 'Shift-Ctrl-s');
  });

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <ul>
        <li>
          <para>
            foo
            <stopwatch startTime={0} />
            bar
          </para>
        </li>
      </ul>
    </doc>,
  );
});

test('Renders react component correctly', async () => {
  Date.now = jest.fn(() => 0);
  const { container, view } = await testEditor(
    <doc>
      <ul>
        <li>
          <para>foo[]bar</para>
        </li>
      </ul>
    </doc>,
  );
  act(() => {
    sendKeyToPm(view, 'Shift-Ctrl-s');
  });
  expect(container.querySelector(`.stopwatch`)).toMatchSnapshot();
});

test('Renders clicking correctly', async () => {
  Date.now = jest.fn(() => 1);
  const { view, renderResult } = await testEditor(
    <doc>
      <ul>
        <li>
          <para>
            foo
            <stopwatch startTime={10} />
            bar
          </para>
        </li>
      </ul>
    </doc>,
  );

  let item = await renderResult.findByText(/⏲/);

  expect(view.state.doc.nodeAt(6).attrs).toEqual({
    startTime: 10,
    stopTime: 0,
  });

  Date.now = jest.fn(() => 150);
  fireEvent.click(item);

  expect(view.state.doc.nodeAt(6).attrs).toEqual({
    startTime: 11,
    stopTime: null,
  });
});

describe('markdown', () => {
  const serialize = async (doc) => {
    let content = doc;
    if (typeof doc === 'function') {
      content = doc(specRegistry.schema);
    }
    return markdownSerializer(specRegistry).serialize(content);
  };

  test('markdown serialization', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <stopwatch startTime={10} />
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(
      `"hello world[$stopwatch](bangle://v1?data=%7B%22startTime%22%3A10%2C%22stopTime%22%3A0%7D"`,
    );
  });
});
