/**
 * @jest-environment jsdom
 * @jsx psx
 */

import { CollabError } from '@bangle.dev/collab-server';
import { SpecRegistry, criticalComponents } from '@bangle.dev/core';
import { psx, renderTestEditor, typeText } from '@bangle.dev/test-helpers';
import { Selection } from '@bangle.dev/pm';
import { getVersion } from 'prosemirror-collab';
import * as collab from '../src/collab-extension';

const { paragraph, doc, text } = criticalComponents;
const DEFAULT_SLEEP = 50;

function promiseNever() {
  return new Promise((res) => {});
}

function sleep(t = DEFAULT_SLEEP) {
  return new Promise((res) => setTimeout(res, t));
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
    users: 1,
    managerId: 'test-manager-1',
  };
}

async function setupCollabEditor(handlers) {
  const clientID = 'test';
  const specRegistry = new SpecRegistry([
    doc.spec(),
    text.spec(),
    paragraph.spec(),
    collab.spec(),
  ]);
  const editorPlugins = [
    paragraph.plugins(),
    collab.plugins({
      docName: 'ole',
      clientID: clientID,
      ...handlers,
    }),
  ];

  return renderTestEditor(
    {
      specRegistry,
      plugins: editorPlugins,
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
    let pullTimes = 0;
    const handlers = {
      getDocument: jest.fn(async () => {
        return getInitialDoc(0);
      }),
      pullEvents: jest.fn(async () => {
        if (pullTimes++ > 0) {
          return promiseNever();
        }
        return {
          steps: [{ stepType: 'replace', from: 5, to: 7 }],
          clientIDs: ['someone-else'],
        };
      }),
      pushEvents: jest.fn(async () => {}),
    };
    const { view } = await setupCollabEditor(handlers);

    await sleep();

    expect(handlers.getDocument).toBeCalledTimes(1);
    expect(handlers.pullEvents).toBeCalledTimes(2);
    expect(handlers.pushEvents).toBeCalledTimes(0);

    // o gets deleted by step
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>[]hellworld</para>
      </doc>,
    );
    expect(view.state.collab$).toEqual({
      version: 1,
      unconfirmed: [],
    });
  });

  test('pulls multiple steps', async () => {
    let pullTimes = 0;
    const handlers = {
      getDocument: jest.fn(async () => {
        return getInitialDoc(0);
      }),
      pullEvents: jest.fn(async () => {
        if (pullTimes++ > 0) {
          return promiseNever();
        }
        return {
          steps: 'add '.split('').map((key, i) => ({
            stepType: 'replace',
            from: 7 + i,
            to: 7 + i,
            slice: { content: [{ type: 'text', text: key }] },
          })),
          clientIDs: ['someone', 'someone', 'someone', 'someone'],
        };
      }),
      pushEvents: jest.fn(async () => {}),
    };
    const { view } = await setupCollabEditor(handlers);

    await sleep();

    expect(handlers.getDocument).toBeCalledTimes(1);
    expect(handlers.pullEvents).toBeCalled();
    expect(handlers.pushEvents).toBeCalledTimes(0);
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>[]hello add world</para>
      </doc>,
    );
    expect(view.state.collab$).toEqual({
      version: 4,
      unconfirmed: [],
    });
  });

  test('pulls second time', async () => {
    let pullTimes = 0;
    const handlers = {
      getDocument: jest.fn(async () => {
        return getInitialDoc(2);
      }),
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
    };
    const { view } = await setupCollabEditor(handlers);

    await sleep();

    expect(handlers.pullEvents).toBeCalled();
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>[]heXllo add world</para>
      </doc>,
    );

    expect(view.state.collab$).toEqual({
      version: 7,
      unconfirmed: [],
    });
  });

  test('pull handles empty steps array', async () => {
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
          steps: [],
          clientIDs: [],
        };
      }),
      pushEvents: jest.fn(async (payload) => {}),
    };

    const { view } = await setupCollabEditor(handlers);
    await sleep(0);
    expect(handlers.pullEvents).toBeCalled();
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>[]hello world</para>
      </doc>,
    );
    expect(view.state.collab$).toEqual({
      version: 2,
      unconfirmed: [],
    });
  });

  test('handles invalid version error when pulling event by restarting and preserves selection', async () => {
    console.error = jest.fn();
    let counter = 0;
    let getDocTimes = 0;
    let view;
    const handlers = {
      getDocument: jest.fn(async () => {
        if (getDocTimes++ > 0) {
          return getInitialDoc(3, 'corrected document');
        }
        return getInitialDoc(2);
      }),
      pullEvents: jest.fn(async () => {
        await sleep(5);
        if (counter <= 3) {
          counter++;
        }

        if (counter > 3) {
          return promiseNever();
        }

        if (counter === 3) {
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

        if (counter === 2) {
          const tr = view.state.tr;
          view.dispatch(
            tr.setSelection(
              Selection.near(tr.doc.resolve(tr.doc.content.size - 3)),
            ),
          );

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
    };
    ({ view } = await setupCollabEditor(handlers));

    await sleep();
    expect(counter).toBe(4);
    expect(handlers.pullEvents).toBeCalled();
    expect(handlers.getDocument).toBeCalledTimes(2);

    expect(view.state.selection.toJSON()).toMatchInlineSnapshot(`
      Object {
        "anchor": 10,
        "head": 10,
        "type": "text",
      }
    `);
    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>corrected document new</para>
      </doc>,
    );

    expect(getVersion(view.state)).toBe(7);
  });
});

test('filters transaction when getDocument req is in flight', async () => {
  console.error = jest.fn();
  let view;
  let sendDocument;
  const handlers = {
    getDocument: jest.fn(async () => {
      return new Promise((res, rej) => {
        sendDocument = () => {
          res(getInitialDoc(0));
        };
      });
    }),
    pullEvents: jest.fn(async () => {
      return {
        steps: [],
        clientIDs: [],
      };
    }),
    pushEvents: jest.fn(async (payload) => {}),
  };
  ({ view } = await setupCollabEditor(handlers));

  typeText(view, 'me no go');
  expect(view.state.doc).toEqualDocument(
    <doc>
      <para></para>
    </doc>,
  );

  await sleep(0);

  sendDocument();
  await sleep();

  typeText(view, '👯‍♀️ ');
  expect(view.state.doc).toEqualDocument(
    <doc>
      <para>👯‍♀️ hello world</para>
    </doc>,
  );
  expect(handlers.getDocument).toBeCalledTimes(1);
  expect(getVersion(view.state)).toBe(0);
});

test('pushes changes to server', async () => {
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
  };

  const { view } = await setupCollabEditor(handlers);
  // give editor time to settle, if we donot do this,
  // it sends push Event too soon
  await sleep();

  typeText(view, '😊');

  await sleep();

  expect(handlers.pushEvents).toBeCalledTimes(1);
  expect(handlers.pushEvents).toHaveBeenNthCalledWith(1, {
    clientID: 'test',
    docName: 'ole',
    steps: [
      {
        from: 1,
        slice: {
          content: [
            {
              text: '😊',
              type: 'text',
            },
          ],
        },
        stepType: 'replace',
        to: 1,
      },
    ],
    userId: 'user-test',
    version: 6,
    managerId: 'test-manager-1',
  });

  expect(view.state.doc).toEqualDocument(
    <doc>
      <para>😊hello add world</para>
    </doc>,
  );

  expect(getVersion(view.state)).toBe(6);
});

test('handles invalid version error when pushing event by restarting', async () => {
  console.error = jest.fn();
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
      if (pullTimes > 3) {
        return promiseNever();
      }

      pullTimes++;

      if (pullTimes === 3) {
        return {
          version: 10,
          steps: ' new'.split('').map((key, i) => ({
            stepType: 'replace',
            from: 10 + i,
            to: 10 + i,
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
      if (pushTimes > 0) {
        return;
      }
      pushTimes++;
      let err = new CollabError(400, 'Invalid version ' + 43);
      throw err;
    }),
  };

  const { view } = await setupCollabEditor(handlers);

  await sleep(0);
  typeText(view, 'XX');
  expect(view.state.doc).toEqualDocument(
    <doc>
      <para>XXhello world</para>
    </doc>,
  );

  await sleep();

  expect(view.state.doc).toEqualDocument(
    <doc>
      <para>corrected new document</para>
    </doc>,
  );

  typeText(view, 'YY');

  // The reason YY are placed after `co` is because
  // restarting crudely tries to preserve the selection
  expect(view.state.doc).toEqualDocument(
    <doc>
      <para>coYYrrected new document</para>
    </doc>,
  );

  expect(getVersion(view.state)).toBe(10);

  expect(handlers.pullEvents).toBeCalled();
  expect(handlers.pushEvents).toBeCalledTimes(1);
  expect(handlers.getDocument).toBeCalledTimes(2);
});

test('if getDocument fails it restarts', async () => {
  console.error = jest.fn();
  let view;
  let counter = 0;
  const handlers = {
    getDocument: jest.fn(async () => {
      if (counter++ === 0) {
        return Promise.reject(new CollabError(500, 'something went wrong'));
      }
      return getInitialDoc(0);
    }),
    pullEvents: jest.fn(async () => {
      return {
        steps: [],
        clientIDs: [],
      };
    }),
    pushEvents: jest.fn(async (payload) => {}),
  };
  ({ view } = await setupCollabEditor(handlers));

  await sleep(DEFAULT_SLEEP * 2);

  expect(view.state.doc).toEqualDocument(
    <doc>
      <para>hello world</para>
    </doc>,
  );
  expect(handlers.getDocument).toBeCalledTimes(2);
  expect(getVersion(view.state)).toBe(0);
});
