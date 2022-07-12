/**
 * @jest-environment jsdom
 */

import waitForExpect from 'wait-for-expect';

import { defaultSpecs } from '@bangle.dev/all-base-components';
import {
  CollabFail,
  CollabManager,
  GET_DOCUMENT,
  ManagerRequest,
  MAX_STEP_HISTORY,
  PUSH_EVENTS,
} from '@bangle.dev/collab-server';
import { paragraph, SpecRegistry } from '@bangle.dev/core';
import { renderTestEditor, sleep } from '@bangle.dev/test-helpers';
import { Emitter, uuid } from '@bangle.dev/utils';

import { plugins } from '../src/collab-extension';

waitForExpect.defaults.timeout = 500;
const specRegistry = new SpecRegistry([...defaultSpecs()]);
const docName = 'test-doc';

const setupClient = (
  server: ReturnType<typeof setupServer>,
  clientID = uuid(),
  _docName = docName,
) => {
  const { manager, docChangeEmitter } = server;
  const { editor, debugString } = renderTestEditor({
    specRegistry: specRegistry,
    plugins: [
      paragraph.plugins(),
      plugins({
        docName: _docName,
        clientID: clientID,
        docChangeEmitter,
        retryWaitTime: 0,
        sendManagerRequest: manager.handleRequest2.bind(manager),
      }),
    ],
  })(undefined);

  const typeText = (text: string, pos?: number) => {
    const editorState = editor.view.state;

    const tr = editorState.tr.insertText(
      text,
      pos == null ? editorState.selection.head : pos,
    );
    editor.view.dispatch(tr);
  };

  return {
    docName: _docName,
    clientID,
    editor,
    view: editor.view,
    debugString,
    typeText,
    pullFromServer() {
      docChangeEmitter.emit('doc_changed', {});
    },
  };
};

const setupServer = ({
  rawDoc = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'hello world!',
          },
        ],
      },
    ],
  },
}: {
  rawDoc?: {
    type: 'doc';
    content: Array<any>;
  };
} = {}) => {
  let emitDocChangeEvent = true;

  const docChangeEmitter = new Emitter();

  const manager = new CollabManager({
    schema: specRegistry.schema,
    getDoc: async (dName) => {
      if (dName === docName) {
        return specRegistry.schema.nodeFromJSON(rawDoc);
      }

      return undefined;
    },
    applyCollabState: () => {
      queueMicrotask(() => {
        if (emitDocChangeEvent) {
          docChangeEmitter.emit('doc_changed', {});
        }
      });
      return true;
    },
  });

  let handleRequest = manager.handleRequest2;

  let requestProxy:
    | undefined
    | ((
        request: Parameters<CollabManager['handleRequest2']>[0],
      ) => Parameters<CollabManager['handleRequest2']>[0]);

  let responseProxy:
    | undefined
    | ((
        request: Parameters<CollabManager['handleRequest2']>[0],
        response: Awaited<ReturnType<CollabManager['handleRequest2']>>,
      ) => Awaited<ReturnType<CollabManager['handleRequest2']>>);

  const originalHandleRequest = async (payload: any) => {
    if (requestProxy) {
      payload = requestProxy(payload);
    }
    const resp = await handleRequest.call(manager, payload);

    if (responseProxy) {
      return responseProxy(payload, resp);
    }

    return resp;
  };

  const mockedHandleRequest = jest.mocked(jest.fn(originalHandleRequest));

  const getCalls = (): ManagerRequest[] => {
    return mockedHandleRequest.mock.calls.map((r) => r[0]);
  };
  const getReturns = async (): Promise<
    Awaited<ReturnType<CollabManager['handleRequest2']>>[]
  > => {
    const results = mockedHandleRequest.mock.results;

    if (results.some((r) => r.type !== 'return')) {
      throw new Error('Expected all calls to be returns');
    }

    return Promise.all(
      results.filter((r) => r.type === 'return').map((r) => r.value) as any,
    );
  };

  manager.handleRequest2 = mockedHandleRequest as any;

  return {
    docChangeEmitter,
    manager,
    async getNotOkayRequests() {
      const returns = await getReturns();

      return returns.filter((r) => r.ok === false);
    },

    async getPushRequests() {
      const requests = await getCalls();
      return requests.filter((r) => r.type === PUSH_EVENTS);
    },
    alterRequest(cb: typeof requestProxy) {
      requestProxy = cb;
    },
    alterResponse(cb: typeof responseProxy) {
      responseProxy = cb;
    },
    blockDocChangeEvent() {
      emitDocChangeEvent = false;
    },
    allowDocChangeEvent() {
      emitDocChangeEvent = true;
    },
  };
};

const consoleError = console.error;

beforeEach(() => {
  console.error = consoleError;
});

test('loads the document', async () => {
  const server = setupServer();
  const { docName, debugString, editor } = setupClient(server);
  // starts with no document
  expect(editor.toHTMLString()).toEqual(`<p></p>`);
  await waitForExpect(async () => {
    expect(debugString()).toEqual(`doc(paragraph("hello world!"))`);
  });
  expect(server.manager.getCollabState(docName)?.version).toEqual(0);
  expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
    `doc(paragraph("hello world!"))`,
  );
});

test('can edit the document', async () => {
  const server = setupServer();
  const client1 = setupClient(server, 'client1');

  await waitForExpect(async () => {
    expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
  });

  client1.typeText('bye world ');

  expect(client1.debugString()).toEqual(
    `doc(paragraph("bye world hello world!"))`,
  );

  await waitForExpect(async () => {
    expect(server.manager.getCollabState(client1.docName)?.version).toEqual(1);
    expect(
      server.manager.getCollabState(client1.docName)?.doc.toString(),
    ).toEqual('doc(paragraph("bye world hello world!"))');
  });
});

test('newer client get updated document', async () => {
  const server = setupServer();
  const client1 = setupClient(server, 'client1');

  await waitForExpect(async () => {
    expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
  });

  client1.typeText('bye world ');

  expect(client1.debugString()).toEqual(
    `doc(paragraph("bye world hello world!"))`,
  );
  await waitForExpect(async () => {
    expect(server.manager.getCollabState(client1.docName)?.version).toEqual(1);
    expect(
      server.manager.getCollabState(client1.docName)?.doc.toString(),
    ).toEqual('doc(paragraph("bye world hello world!"))');
  });

  const client2 = setupClient(server, 'client2');

  await waitForExpect(async () => {
    expect(client2.debugString()).toEqual(
      `doc(paragraph("bye world hello world!"))`,
    );
  });
});

describe('multiplayer collab', () => {
  test('case0: two clients are able to sync', async () => {
    const server = setupServer();
    const client1 = setupClient(server, 'client1');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });
    const client2 = setupClient(server, 'client2');
    client1.typeText('bye world ');
    // client 2 will not immediately get the update
    expect(client2.debugString()).toEqual(`doc(paragraph)`);

    await waitForExpect(async () => {
      expect(client2.debugString()).toEqual(
        `doc(paragraph("bye world hello world!"))`,
      );
    });

    client2.typeText('one ');
    expect(client2.debugString()).toEqual(
      `doc(paragraph("bye world one hello world!"))`,
    );

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.version).toEqual(2);
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("bye world one hello world!"))',
      );
    });

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(
        `doc(paragraph("bye world one hello world!"))`,
      );
    });
  });

  test('case 1: two clients are able to sync', async () => {
    const server = setupServer();
    const client1 = setupClient(server, 'client1');
    const client2 = setupClient(server, 'client2');
    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
      expect(client2.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });
    client1.typeText('A');
    client2.typeText('B');
    client1.typeText('C');
    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(
        `doc(paragraph("ACBhello world!"))`,
      );
    });

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("ACBhello world!"))',
      );
    });
  });

  test('case 2', async () => {
    const server = setupServer({
      rawDoc: {
        type: 'doc',
        content: [],
      },
    });

    const client1 = setupClient(server, 'client1');
    const client2 = setupClient(server, 'client2');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph)`);
      expect(client2.debugString()).toEqual(`doc(paragraph)`);
    });

    client1.typeText('hi', 0);
    await sleep(0);
    client2.typeText('bye', 3);
    await sleep(0);

    expect(await server.getNotOkayRequests()).toEqual([]);
    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(
        `doc(paragraph("hibye"), paragraph)`,
      );
      expect(client2.debugString()).toEqual(
        `doc(paragraph("hibye"), paragraph)`,
      );
    });
  });
});

describe('failures', () => {
  test('handles ApplyFailed', async () => {
    console.error = jest.fn();
    const server = setupServer();

    const client1 = setupClient(server, 'client1');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    let done = false;
    server.alterRequest((req) => {
      if (req.type === PUSH_EVENTS && !done) {
        done = true;
        return {
          ...req,
          payload: {
            ...req.payload,
            steps: [
              {
                stepType: 'replace',
                from: 1,
                to: 10000,
                slice: {
                  content: [
                    {
                      type: 'text',
                      text: 'very ',
                    },
                  ],
                },
              },
            ],
          },
        };
      }
      return req;
    });

    client1.typeText('wow ');

    await sleep(10);

    expect(await server.getNotOkayRequests()).toEqual([
      {
        body: CollabFail.ApplyFailed,
        ok: false,
      },
    ]);

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("wow hello world!"))',
      );
    });
  });

  test('handles DocumentNotFound', async () => {
    const server = setupServer();
    const client1 = setupClient(server, 'client1', 'some-wrong-doc');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph)`);
    });

    // typing should not have any effect
    client1.typeText('wow ');
    expect(client1.debugString()).toEqual(`doc(paragraph)`);

    expect(await server.getNotOkayRequests()).toEqual([
      {
        body: CollabFail.DocumentNotFound,
        ok: false,
      },
    ]);
  });

  test('handles HistoryNotAvailable', async () => {
    const server = setupServer();
    const client1 = setupClient(server, 'client1');
    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    server.blockDocChangeEvent();

    const { manager } = server;
    const fakeClientId = 'fakeClientId';
    await manager.handleRequest2({
      type: PUSH_EVENTS,
      payload: {
        clientID: fakeClientId,
        version: manager.getCollabState(docName)?.version!,
        managerId: manager.managerId,
        steps: Array.from({ length: MAX_STEP_HISTORY + 1 }, () => ({
          stepType: 'replace',
          from: 1,
          to: 1,
          slice: {
            content: [
              {
                type: 'text',
                text: 'A',
              },
            ],
          },
        })),
        docName,
        userId: 'test-' + fakeClientId,
      },
    });

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.version).toEqual(
        MAX_STEP_HISTORY + 1,
      );
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        `doc(paragraph("${Array.from(
          { length: MAX_STEP_HISTORY + 1 },
          () => 'A',
        ).join('')}hello world!"))`,
      );
    });

    server.allowDocChangeEvent();

    client1.typeText('A');

    await sleep(10);

    expect(await server.getNotOkayRequests()).toEqual([
      {
        body: CollabFail.OutdatedVersion,
        ok: false,
      },
      {
        body: CollabFail.HistoryNotAvailable,
        ok: false,
      },
    ]);
  });

  test('handles IncorrectManager', async () => {
    const server = setupServer();

    server.alterResponse((req, resp) => {
      if (req.type === GET_DOCUMENT && resp.ok) {
        return {
          ...resp,
          body: {
            ...resp.body,
            managerId: 'wrong-id',
          },
        };
      }
      return resp;
    });

    const client1 = setupClient(server, 'client1');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    client1.typeText('wow ');
    expect(client1.debugString()).toEqual(`doc(paragraph("wow hello world!"))`);

    await sleep(10);

    expect(await server.getNotOkayRequests()).toEqual([
      {
        body: CollabFail.IncorrectManager,
        ok: false,
      },
    ]);

    // Editor should reset
    expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
  });

  test('handles InvalidVersion', async () => {
    const server = setupServer();

    const client1 = setupClient(server, 'client1');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    server.alterRequest((req) => {
      if (req.type === PUSH_EVENTS) {
        return {
          ...req,
          payload: {
            ...req.payload,
            version: 100,
          },
        };
      }
      return req;
    });

    client1.typeText('wow ');
    expect(client1.debugString()).toEqual(`doc(paragraph("wow hello world!"))`);

    await sleep(10);

    expect(await server.getNotOkayRequests()).toEqual([
      {
        body: CollabFail.InvalidVersion,
        ok: false,
      },
    ]);

    // Editor should reset
    expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
  });

  test('handles OutdatedVersion', async () => {
    const server = setupServer();
    const client1 = setupClient(server, 'client1');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    const { manager } = server;

    server.blockDocChangeEvent();

    const fakeClientId = 'fakeClientId';
    await manager.handleRequest2({
      type: PUSH_EVENTS,
      payload: {
        clientID: fakeClientId,
        version: manager.getCollabState(docName)?.version!,
        managerId: manager.managerId,
        steps: [
          {
            stepType: 'replace',
            from: 1,
            to: 1,
            slice: {
              content: [
                {
                  type: 'text',
                  text: 'very ',
                },
              ],
            },
          },
        ],
        docName,
        userId: 'test-' + fakeClientId,
      },
    });

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("very hello world!"))',
      );
    });

    expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    server.allowDocChangeEvent();

    client1.typeText('wow ');
    expect(client1.debugString()).toEqual(`doc(paragraph("wow hello world!"))`);

    // client should now try to sync and resolve conflict
    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(
        'doc(paragraph("very wow hello world!"))',
      );
    });

    expect(await server.getNotOkayRequests()).toEqual([
      {
        body: CollabFail.OutdatedVersion,
        ok: false,
      },
    ]);
  });
});
