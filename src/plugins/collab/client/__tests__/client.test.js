/**
 * @jest-environment jsdom
 */
import '../../../../test-helpers/jest-helpers';
import { fireEvent, wait, screen } from '@testing-library/react';

import { renderTestEditor, sendKeyToPm, sleep } from '../../../../test-helpers';

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

test('starts the server', async () => {
  let editor;
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
      await sleep(100 + Math.random() * 50);
      return {
        version: 2,
        steps: [{ stepType: 'replace', from: 6, to: 7 }],
        clientIDs: [478450983],
        comment: [],
      };
    },
    pushEvents: async () => {},
    createEditorState: async (document, version) => {
      const extensions = [
        new BulletList(),
        new ListItem(),
        new OrderedList(),
        new TodoList(),
        new TodoItem(),
        new HardBreak(),
        new Heading(),
        new Underline(),
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

    onSetup: async ({ doc, version, dispatch }) => {
      const extensions = [
        new CollabExtension({
          version,
        }),
        new BulletList(),
        new ListItem(),
        new OrderedList(),
        new TodoList(),
        new TodoItem(),
        new HardBreak(),
        new Heading(),
        new Underline(),
      ];
      ({ editor } = await renderTestEditor({ extensions })(document));
      editor.on('transaction', ({ transaction }) => dispatch(transaction));
      return editor.view;
    },
    updateState: (state) => {
      editor.view.updateState(state);
    },
    onDispatchTransaction: (cb) => {
      editor.on('transaction', ({ transaction }) => cb(transaction));
    },
    destroyView: () => {
      editor.destroy();
    },
  };
  const connection = new EditorConnection('ole', handlers);

  await sleep(300);
  connection.close();
});
