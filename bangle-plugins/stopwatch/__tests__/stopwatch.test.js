/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { fireEvent, wait } from '@testing-library/react';
import { psx, sendKeyToPm, renderTestEditor } from 'bangle-core/test-helpers/';
import {
  OrderedList,
  BulletList,
  ListItem,
  Heading,
  HardBreak,
  TodoList,
  TodoItem,
} from 'bangle-core/nodes';
import StopwatchExtension from '../stopwatch';
import { markdownSerializer } from 'bangle-plugins/markdown/markdown-serializer';
import { markdownParser } from 'bangle-plugins/markdown/index';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new TodoList(),
  new TodoItem(),
  new HardBreak(),
  new Heading(),
  new StopwatchExtension(),
];
const testEditor = renderTestEditor({ extensions });
const dateNow = Date.now;
beforeEach(() => {
  Date.now = dateNow;
});

test('Keyboard shortcut works', async () => {
  Date.now = jest.fn(() => 0);
  const { editor } = await testEditor(
    <doc>
      <todoList>
        <todoItem>
          <para>foo[]bar</para>
        </todoItem>
      </todoList>
    </doc>,
  );

  sendKeyToPm(editor.view, 'Shift-Ctrl-s');

  expect(editor.state).toEqualDocAndSelection(
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
  const { container, editor } = await testEditor(
    <doc>
      <todoList>
        <todoItem>
          <para>foo[]bar</para>
        </todoItem>
      </todoList>
    </doc>,
  );
  sendKeyToPm(editor.view, 'Shift-Ctrl-s');
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
  let schemaPromise;
  const serialize = async (doc) => {
    let content = doc;
    if (typeof doc === 'function') {
      content = doc(await schemaPromise);
    }
    return markdownSerializer(extensions).serialize(content);
  };

  const parse = async (md) =>
    markdownParser(extensions, await schemaPromise).parse(md);

  beforeAll(async () => {
    schemaPromise = renderTestEditor({ extensions })().then((r) => r.schema);
  });

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
