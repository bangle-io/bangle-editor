/**
 * @jest-environment jsdom
 */
/** @jsx pjsx */
import { fireEvent } from '@testing-library/react';
import { pjsx, reactTestEditor } from '../../__tests__/helpers/index';
import { sendKeyToPm } from 'bangle-core/test-helpers/index';
import { markdownSerializer } from 'bangle-plugins/markdown/markdown-serializer';
import { SpecRegistry } from 'bangle-core/spec-registry';
import { stopwatch } from '../index';
import { Stopwatch } from '../stopwatch';
import {
  defaultPlugins,
  defaultSpecs,
} from 'bangle-core/test-helpers/default-components';

const specRegistry = new SpecRegistry([...defaultSpecs(), stopwatch.spec({})]);
const plugins = [...defaultPlugins(), stopwatch.plugins({})];

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

  sendKeyToPm(view, 'Shift-Ctrl-s');

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
  sendKeyToPm(view, 'Shift-Ctrl-s');
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
