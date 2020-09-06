/**
 * @jest-environment jsdom
 */
import '../../../../src/test-helpers/jest-helpers';
import { fireEvent, wait, screen } from '@testing-library/react';

import {
  doc,
  p,
  todoList,
  todoItem,
  nodeFactory,
} from '../../../../src/test-helpers/test-builders';
import { renderTestEditor, sendKeyToPm } from '../../../../src/test-helpers';
import { Underline } from '../../../../src/utils/bangle-utils/marks';
import {
  OrderedList,
  BulletList,
  ListItem,
  Heading,
  HardBreak,
  TodoList,
  TodoItem,
} from '../../../../src/utils/bangle-utils/nodes';
import StopwatchExtension from '../stopwatch';

export const stopWatch = (attrs = {}) =>
  nodeFactory({ name: 'stopwatch' }, attrs)();

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new TodoList(),
  new TodoItem(),
  new HardBreak(),
  new Heading(),
  new Underline(),
  new StopwatchExtension(),
];
const testEditor = renderTestEditor({ extensions });
const dateNow = Date.now;
beforeEach(() => {
  Date.now = dateNow;
});

test('Keyboard shortcut works', async () => {
  Date.now = jest.fn(() => 0);
  const { editor } = await testEditor(doc(todoList(todoItem(p('foo{<>}bar')))));

  sendKeyToPm(editor.view, 'Shift-Ctrl-s');
  const expectedStopwatch = stopWatch({
    'data-stopwatch-time': 0,
  });

  expect(editor.state).toEqualDocAndSelection(
    // prettier-ignore
    doc(todoList(todoItem(
      p('foo', expectedStopwatch, 'bar')
    ))),
  );
});

test('Renders react component correctly', async () => {
  Date.now = jest.fn(() => 0);
  const { container, editor } = await testEditor(
    doc(todoList(todoItem(p('foo{<>}bar')))),
  );
  sendKeyToPm(editor.view, 'Shift-Ctrl-s');
  expect(container.querySelector(`[data-type="stopwatch"]`))
    .toMatchInlineSnapshot(`
    <span
      class="stopwatch-NodeView-Wrap"
      data-stopwatch="{\\"startTime\\":0,\\"stopTime\\":0}"
      data-type="stopwatch"
      draggable="true"
    >
      <span
        contenteditable="false"
        style="background-color: pink; border-radius: 10px; padding: 1px 2px 1px 2px; margin: 1px 2px; font-weight: 500; font-family: monospace;"
      >
        ⏲
        00:00:00
      </span>
    </span>
  `);
});

test('Renders clicking correctly', async () => {
  Date.now = jest.fn(() => 1);
  const { container, findByText } = await testEditor(
    // prettier-ignore
    doc(todoList(todoItem(
        p(
        'foo', 
        stopWatch({
            'data-stopwatch-time': 10,
        }),
        'bar')
    ))),
  );

  let item = await findByText(/⏲/);

  Date.now = jest.fn(() => 150);

  fireEvent.click(item);

  await wait(() => {
    expect(container.querySelector(`[data-type="stopwatch"]`))
      .toMatchInlineSnapshot(`
      <span
        class="stopwatch-NodeView-Wrap"
        data-stopwatch="{\\"stopTime\\":null,\\"startTime\\":1}"
        data-type="stopwatch"
        draggable="true"
      >
        <span
          contenteditable="false"
          style="background-color: rgb(0, 206, 209); border-radius: 10px; padding: 1px 2px 1px 2px; margin: 1px 2px; font-weight: 500; font-family: monospace;"
        >
          ⏲
          00:00:00
        </span>
      </span>
    `);
  });
});
