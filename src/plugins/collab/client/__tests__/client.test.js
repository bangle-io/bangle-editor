/**
 * @jest-environment jsdom
 */
import '../../../../test-helpers/jest-helpers';
import { fireEvent, wait, screen } from '@testing-library/react';

import {
  renderTestEditor,
  sendKeyToPm,
  sleep,
  typeText,
} from '../../../../test-helpers';

import { Underline } from '../../../../utils/bangle-utils/marks';
import {
  OrderedList,
  BulletList,
  ListItem,
  Heading,
  HardBreak,
  TodoList,
  TodoItem,
} from '../../../../utils/bangle-utils/nodes';
import {
  doc,
  p,
  todoList,
  todoItem,
  nodeFactory,
} from '../../../../test-helpers/test-builders';
import { EditorConnection } from '../client';
import { CollabExtension } from '../collab-extension';

test('removes chars', async () => {
  let editor;
  let pullTimes = 0;
  const handlers = {
    getDocument: () => {
      return {
        version: 0,
        doc: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'hello world',
                },
              ],
            },
          ],
        },
      };
    },
    pullEvents: async () => {
      if (pullTimes++ > 0) {
        return promiseNever();
      }
      return {
        version: 2,
        steps: [{ stepType: 'replace', from: 5, to: 7 }],
        clientIDs: [478450983],
        comment: [],
      };
    },
    pushEvents: async () => {},
    createEditorState: async (document, version) => {
      const extensions = [
        new CollabExtension({
          version,
        }),
      ];
      ({ editor } = await renderTestEditor({
        extensions,
        content: document,
      })());
      return editor.state;
    },
    updateState: jest.fn((state) => {
      editor.view.updateState(state);
    }),
    onDispatchTransaction: (cb) => {
      editor.on('transaction', ({ transaction }) => cb(transaction));
    },
    destroyView: () => {
      editor.destroy();
    },
    onSleep: () => promiseNever(),
  };
  const connection = new EditorConnection('ole', handlers);
  await sleep(100);
  expect(handlers.updateState.mock.calls[1][0].doc.toString()).toBe(
    'doc(paragraph("hellworld"))',
  );
  expect(editor.state.doc.toString()).toMatchInlineSnapshot(
    `"doc(paragraph(\\"hellworld\\"))"`,
  );

  connection.close();
});

test('adds multiple char', async () => {
  let editor;
  let pullTimes = 0;
  const handlers = {
    getDocument: async () => {
      return {
        doc: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'hello world',
                },
              ],
            },
          ],
        },
        version: 0,
      };
    },
    pullEvents: async () => {
      if (pullTimes++ > 0) {
        return promiseNever();
      }

      return {
        version: 4,
        steps: 'add '.split('').map((key, i) => ({
          stepType: 'replace',
          from: 7 + i,
          to: 7 + i,
          slice: { content: [{ type: 'text', text: key }] },
        })),
        clientIDs: [2, 2, 2, 2],
      };
    },
    pushEvents: async () => {},
    createEditorState: async (document, version) => {
      const extensions = [
        new CollabExtension({
          version,
        }),
      ];
      ({ editor } = await renderTestEditor({
        extensions,
        content: document,
      })());
      return editor.state;
    },

    updateState: jest.fn((state) => {
      editor.view.updateState(state);
    }),
    onDispatchTransaction: (cb) => {
      editor.on('transaction', ({ transaction }) => cb(transaction));
    },
    destroyView: () => {
      editor.destroy();
    },
    onSleep: () => new Promise((res) => {}),
  };
  const connection = new EditorConnection('ole', handlers);
  await sleep(16);
  expect(handlers.updateState.mock.calls[1][0].doc.toString()).toBe(
    'doc(paragraph("hello add world"))',
  );
  connection.close();
});

test('pushes changes to server', async () => {
  let editor;
  let pullTimes = 0;
  const handlers = {
    getDocument: async () => {
      return {
        doc: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'hello world',
                },
              ],
            },
          ],
        },
        version: 2,
      };
    },
    pullEvents: async () => {
      if (pullTimes++ > 0) {
        return promiseNever();
      }

      return {
        version: 4,
        steps: 'add '.split('').map((key, i) => ({
          stepType: 'replace',
          from: 7 + i,
          to: 7 + i,
          slice: { content: [{ type: 'text', text: key }] },
        })),
        clientIDs: [2, 2, 2, 2],
      };
    },
    pushEvents: jest.fn(async (payload) => {
      console.log(payload);
    }),
    createEditorState: async (document, version) => {
      const extensions = [
        new CollabExtension({
          version,
          clientID: 'test',
        }),
      ];
      ({ editor } = await renderTestEditor({
        extensions,
        content: document,
      })());
      return editor.state;
    },

    updateState: jest.fn((state) => {
      editor.view.updateState(state);
    }),
    onDispatchTransaction: (cb) => {
      editor.on('transaction', ({ transaction }) => cb(transaction));
    },
    destroyView: () => {
      editor.destroy();
    },
    onSleep: () => promiseNever(),
  };
  const connection = new EditorConnection('ole', handlers);
  await sleep(16);

  typeText(editor.view, 'X');
  expect(handlers.pushEvents).toBeCalledTimes(1);
  expect(handlers.pushEvents).toBeCalledTimes(1);
  expect(handlers.pushEvents).toHaveBeenNthCalledWith(1, {
    clientID: 'test',
    steps: [
      {
        from: 1,
        slice: {
          content: [
            {
              text: 'X',
              type: 'text',
            },
          ],
        },
        stepType: 'replace',
        to: 1,
      },
    ],
    version: 6,
  });

  expect(editor.state.doc.toString()).toMatchInlineSnapshot(
    `"doc(paragraph(\\"Xhello add world\\"))"`,
  );
});

function promiseNever() {
  return new Promise((res) => {});
}
