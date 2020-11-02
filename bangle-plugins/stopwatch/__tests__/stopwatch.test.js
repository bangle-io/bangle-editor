/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { fireEvent, wait } from '@testing-library/react';
import { psx, sendKeyToPm, renderTestEditor } from 'bangle-core/test-helpers/';

import { stopwatch } from '../index';
import { markdownSerializer } from 'bangle-plugins/markdown/markdown-serializer';
import { corePlugins, coreSpec } from 'bangle-core/components';
import { schemaLoader } from 'bangle-core/element-loaders';

const editorSpec = [...coreSpec(), stopwatch.spec({})];
const plugins = [...corePlugins(), stopwatch.plugins({})];

const testEditor = renderTestEditor({
  editorSpec,
  plugins,
});

const dateNow = Date.now;
beforeEach(() => {
  Date.now = dateNow;
});

test('Keyboard shortcut works', async () => {
  Date.now = jest.fn(() => 0);
  const { view } = await testEditor(
    <doc>
      <todoList>
        <todoItem>
          <para>foo[]bar</para>
        </todoItem>
      </todoList>
    </doc>,
  );

  sendKeyToPm(view, 'Shift-Ctrl-s');

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <todoList>
        <todoItem>
          <para>
            foo
            <stopwatch data-stopwatch-time="0" />
            bar
          </para>
        </todoItem>
      </todoList>
    </doc>,
  );
});

test('Renders react component correctly', async () => {
  Date.now = jest.fn(() => 0);
  const { container, view } = await testEditor(
    <doc>
      <todoList>
        <todoItem>
          <para>foo[]bar</para>
        </todoItem>
      </todoList>
    </doc>,
  );
  sendKeyToPm(view, 'Shift-Ctrl-s');
  expect(container.querySelector(`[data-type="stopwatch"]`)).toMatchSnapshot();
});

test('Renders clicking correctly', async () => {
  Date.now = jest.fn(() => 1);
  const { container, findByText } = await testEditor(
    <doc>
      <todoList>
        <todoItem>
          <para>
            foo
            <stopwatch data-stopwatch-time="10" />
            bar
          </para>
        </todoItem>
      </todoList>
    </doc>,
  );

  let item = await findByText(/⏲/);

  Date.now = jest.fn(() => 150);

  fireEvent.click(item);

  await wait(() => {
    expect(
      container.querySelector(`[data-type="stopwatch"]`),
    ).toMatchSnapshot();
  });
});

describe('markdown', () => {
  const serialize = async (doc) => {
    let content = doc;
    if (typeof doc === 'function') {
      content = doc(schemaLoader(editorSpec));
    }
    return markdownSerializer(editorSpec).serialize(content);
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
      `"hello world[$stopwatch](bangle://data-stopwatch=%22%7B%5C%22startTime%5C%22%3A0%2C%5C%22stopTime%5C%22%3A0%7D%22&data-type=%22stopwatch%22)"`,
    );
  });
});
