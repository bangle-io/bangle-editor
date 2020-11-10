/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { fireEvent, wait } from '@testing-library/react';
import { psx } from 'bangle-react/test-helpers/psx';
import { sendKeyToPm } from 'bangle-core/test-helpers/index';
import { markdownSerializer } from 'bangle-plugins/markdown/markdown-serializer';
import { corePlugins, coreSpec } from 'bangle-core/components/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { stopwatch } from '../index';
import { Stopwatch } from '../stopwatch';
import { reactTestEditor } from 'bangle-react/test-helpers/react-test-editor';

const specSheet = new SpecSheet([...coreSpec(), stopwatch.spec({})]);
const plugins = [...corePlugins(), stopwatch.plugins({})];

const renderNodeViews = jest.fn(({ node, ...args }) => {
  if (node.type.name === 'stopwatch') {
    return <Stopwatch node={node} {...args} />;
  }
  throw new Error('Unknown node');
});

const testEditor = reactTestEditor({
  specSheet,
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
            <stopwatch data-stopwatch-time="0" />
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
            <stopwatch data-stopwatch-time="10" />
            bar
          </para>
        </li>
      </ul>
    </doc>,
  );

  let item = await renderResult.findByText(/⏲/);

  expect(view.state.doc.nodeAt(6).attrs).toEqual({
    'data-stopwatch': {
      startTime: 0,
      stopTime: 0,
    },
    'data-type': 'stopwatch',
  });

  Date.now = jest.fn(() => 150);
  fireEvent.click(item);

  expect(view.state.doc.nodeAt(6).attrs).toEqual({
    'data-stopwatch': {
      startTime: 1,
      stopTime: null,
    },
    'data-type': 'stopwatch',
  });
});

describe('markdown', () => {
  const serialize = async (doc) => {
    let content = doc;
    if (typeof doc === 'function') {
      content = doc(specSheet.schema);
    }
    return markdownSerializer(specSheet).serialize(content);
  };

  test('markdown serialization', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <stopwatch data-stopwatch-time="10" />
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(
      `"hello world[$stopwatch](bangle://data-stopwatch=%7B%22startTime%22%3A0%2C%22stopTime%22%3A0%7D&data-type=%22stopwatch%22)"`,
    );
  });
});
