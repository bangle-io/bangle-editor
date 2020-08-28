/**
 * @jest-environment jsdom
 */
import '../../../../test-helpers/jest-helpers';
import { fireEvent, wait, screen } from '@testing-library/react';

import { renderTestEditor, sleep, typeText } from '../../../../test-helpers';

import { EditorConnection } from '../client';
import { CollabExtension } from '../collab-extension';
import { getVersion } from 'prosemirror-collab';
import { CollabError } from '../../collab-error';

function promiseNever() {
  return new Promise((res) => {});
}

function getInitialDoc(version, text = 'hello world') {
  return {
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text,
            },
          ],
        },
      ],
    },
    version: version,
  };
}

async function setupEditor(document, version) {
  const extensions = [
    new CollabExtension({
      version,
      clientID: 'test',
    }),
  ];
  return renderTestEditor(
    {
      extensions,
      content: document,
    },
    'data-test-' + Math.random(),
  )();
}

const consoleError = console.error;

beforeEach(() => {
  console.error = consoleError;
});

describe('pull events', () => {
  test('pull a step that removes char', async () => {
    let editor;
    let pullTimes = 0;
    const handlers = {
      getDocument: () => {
        return getInitialDoc(0);
      },
      pullEvents: () => {
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
        ({ editor } = await setupEditor(document, version));
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
    };
    const connection = new EditorConnection('ole', handlers);
    await sleep(100);
    expect(handlers.updateState.mock.calls[1][0].doc.toString()).toBe(
      'doc(paragraph("hellworld"))',
    );
    expect(editor.state.doc.toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"hellworld\\"))"`,
    );
    expect(getVersion(editor.state)).toBe(1);

    connection.close();
  });

  test('pulls multiple steps', async () => {
    let editor;
    let pullTimes = 0;
    const handlers = {
      getDocument: async () => {
        return getInitialDoc(0);
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
        ({ editor } = await setupEditor(document, version));
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
    };
    const connection = new EditorConnection('ole', handlers);
    await sleep(16);
    expect(handlers.updateState.mock.calls[1][0].doc.toString()).toBe(
      'doc(paragraph("hello add world"))',
    );
    expect(getVersion(editor.state)).toBe(4);

    connection.close();
  });

  test('pulls second time', async () => {
    let editor;
    let pullTimes = 0;
    const handlers = {
      getDocument: async () => {
        return getInitialDoc(2);
      },
      pullEvents: jest.fn(async () => {
        if (pullTimes++ > 1) {
          return promiseNever();
        }
        if (pullTimes === 2) {
          return {
            version: 8,
            steps: [
              {
                to: 3,
                from: 3,
                slice: {
                  content: [
                    {
                      text: 'X',
                      type: 'text',
                    },
                  ],
                },
                stepType: 'replace',
              },
            ],
            clientIDs: [2],
          };
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
      }),
      pushEvents: jest.fn(async (payload) => {}),
      createEditorState: async (document, version) => {
        ({ editor } = await setupEditor(document, version));
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
    };
    new EditorConnection('ole', handlers);
    await sleep(16);

    expect(handlers.pullEvents).toBeCalledTimes(3); // third calls returns a promise never to stop future calls
    expect(editor.state.doc.toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"heXllo add world\\"))"`,
    );
    expect(getVersion(editor.state)).toBe(7);
  });

  test('pulls handles empty steps array', async () => {
    let editor;
    let pullTimes = 0;
    const handlers = {
      getDocument: async () => {
        return getInitialDoc(2);
      },
      pullEvents: jest.fn(async () => {
        if (pullTimes++ > 0) {
          return promiseNever();
        }

        return {
          version: 4,
          steps: [],
          clientIDs: [],
        };
      }),
      pushEvents: jest.fn(async (payload) => {}),
      createEditorState: async (document, version) => {
        ({ editor } = await setupEditor(document, version));
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
    };
    new EditorConnection('ole', handlers);
    await sleep(16);

    expect(handlers.pullEvents).toBeCalledTimes(2);
    expect(editor.state.doc.toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"hello world\\"))"`,
    );
    expect(getVersion(editor.state)).toBe(2);
  });

  test('handles invalid version error when pulling event  by restarting', async () => {
    console.error = jest.fn();
    let editor;
    let pullTimes = 0;
    let getDocTimes = 0;
    const handlers = {
      getDocument: jest.fn(async () => {
        if (getDocTimes++ > 0) {
          return getInitialDoc(3, 'corrected document');
        }
        return getInitialDoc(2);
      }),
      pullEvents: jest.fn(async () => {
        if (pullTimes++ > 3) {
          return promiseNever();
        }

        if (pullTimes === 3) {
          return {
            version: 10,
            steps: ' new'.split('').map((key, i) => ({
              stepType: 'replace',
              from: 19 + i,
              to: 19 + i,
              slice: { content: [{ type: 'text', text: key }] },
            })),
            clientIDs: [2, 2, 2, 2],
          };
        }

        if (pullTimes === 2) {
          let err = new CollabError(400, 'Invalid version ' + 43);
          throw err;
        }

        return {
          version: 4,
          steps: [],
          clientIDs: [],
        };
      }),
      pushEvents: jest.fn(async (payload) => {}),
      createEditorState: jest.fn(async (document, version) => {
        ({ editor } = await setupEditor(document, version));
        return editor.state;
      }),
      updateState: jest.fn((state) => {
        editor.view.updateState(state);
      }),
      onDispatchTransaction: (cb) => {
        editor.on('transaction', ({ transaction }) => cb(transaction));
      },
      destroyView: () => {
        editor.destroy();
      },
    };
    new EditorConnection('ole', handlers);
    await sleep(100);

    expect(handlers.createEditorState).toBeCalledTimes(2);
    expect(handlers.pullEvents).toBeCalledTimes(5);
    expect(handlers.getDocument).toBeCalledTimes(2);
    expect(editor.state.doc.toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"corrected document new\\"))"`,
    );
    expect(getVersion(editor.state)).toBe(7);
  });
});

describe('pushing events', () => {
  test('pushes changes to server', async () => {
    let editor;
    let pullTimes = 0;
    const handlers = {
      getDocument: async () => {
        return getInitialDoc(2);
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
      pushEvents: jest.fn(async (payload) => {}),

      createEditorState: async (document, version) => {
        ({ editor } = await setupEditor(document, version));
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
    };
    new EditorConnection('ole', handlers);
    await sleep(16);

    typeText(editor.view, 'X');

    expect(handlers.pushEvents).toBeCalledTimes(1);
    expect(handlers.pushEvents).toHaveBeenNthCalledWith(
      1,
      {
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
      },
      'ole',
    );

    expect(editor.state.doc.toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"Xhello add world\\"))"`,
    );
    expect(getVersion(editor.state)).toBe(6);
  });

  test('handles invalid version error when pushing event  by restarting', async () => {
    console.error = jest.fn();
    let editor;
    let unmount;
    let pullTimes = 0;
    let getDocTimes = 0;
    let pushTimes = 0;
    const handlers = {
      getDocument: jest.fn(async () => {
        if (getDocTimes++ > 0) {
          return getInitialDoc(6, 'corrected document');
        }
        return getInitialDoc(2);
      }),
      pullEvents: jest.fn(async () => {
        if (pullTimes++ > 3) {
          return promiseNever();
        }

        if (pullTimes === 3) {
          return {
            version: 10,
            steps: ' new'.split('').map((key, i) => ({
              stepType: 'replace',
              from: 3 + i,
              to: 3 + i,
              slice: { content: [{ type: 'text', text: key }] },
            })),
            clientIDs: [2, 2, 2, 2],
          };
        }

        return {
          version: 4,
          steps: [],
          clientIDs: [],
        };
      }),
      pushEvents: jest.fn(async (payload) => {
        if (pushTimes++ > 0) {
          return;
        }
        let err = new CollabError(400, 'Invalid version ' + 43);
        throw err;
      }),
      createEditorState: jest.fn(async (document, version) => {
        ({ editor, unmount } = await setupEditor(document, version));
        return editor.state;
      }),
      updateState: jest.fn((state) => {
        editor.view.updateState(state);
      }),
      onDispatchTransaction: (cb) => {
        editor.on('transaction', ({ transaction }) => {
          cb(transaction);
        });
      },
      destroyView: () => {
        editor.destroy();
      },
    };
    new EditorConnection('ole', handlers);
    await sleep(100);
    typeText(editor.view, 'X');
    await sleep(100);
    typeText(editor.view, 'Y');
    expect(handlers.pushEvents).toBeCalledTimes(2);
    expect(handlers.createEditorState).toBeCalledTimes(2);
    expect(handlers.pullEvents).toBeCalledTimes(6);
    expect(handlers.getDocument).toBeCalledTimes(2);
    expect(editor.state.doc.toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"Ycorrected document\\"))"`,
    );
    expect(getVersion(editor.state)).toBe(6);
  });
});
