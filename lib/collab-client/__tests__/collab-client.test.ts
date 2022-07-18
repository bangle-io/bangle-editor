/**
 * @jest-environment jsdom
 */

import waitForExpect from 'wait-for-expect';

import { defaultSpecs } from '@bangle.dev/all-base-components';
import {
  CollabFail,
  CollabManager,
  CollabRequestType,
  CollabServerState,
  ManagerRequest,
  MAX_STEP_HISTORY,
  PullEventsResponse,
} from '@bangle.dev/collab-server';
import { paragraph, SpecRegistry } from '@bangle.dev/core';
import { renderTestEditor, sleep } from '@bangle.dev/test-helpers';
import { Emitter, uuid } from '@bangle.dev/utils';

import { plugins } from '../src/collab-extension';
import { hardResetClient, onUpstreamChanges } from '../src/commands';
import { collabMonitorKey } from '../src/common';

waitForExpect.defaults.timeout = 500;
const specRegistry = new SpecRegistry([...defaultSpecs()]);
const docName = 'test-doc';

const setupClient = (
  server: ReturnType<typeof setupServer>,
  clientID = uuid(),
  _docName = docName,
) => {
  let ref: { manager?: CollabManager; docChangeEmitter?: Emitter } = {
    manager: undefined,
    docChangeEmitter: undefined,
  };

  ref.manager = server.manager;
  ref.docChangeEmitter = server.docChangeEmitter;

  const { editor, debugString } = renderTestEditor({
    specRegistry: specRegistry,
    plugins: [
      paragraph.plugins(),
      plugins({
        docName: _docName,
        clientID: clientID,
        retryWaitTime: 0,
        sendManagerRequest: (...args) => {
          return ref.manager!.handleRequest(...args);
        },
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

  const cb = ({ version }: { version: number }) => {
    onUpstreamChanges(version)(editor.view.state, editor.view.dispatch);
  };

  ref.docChangeEmitter.on('doc_changed', cb);

  return {
    docName: _docName,
    clientID,
    editor,
    view: editor.view,
    debugString,
    typeText,
    changeServer(server: ReturnType<typeof setupServer>) {
      ref.docChangeEmitter?.off('doc_changed', cb);
      ref.docChangeEmitter = server.docChangeEmitter;
      ref.manager = server.manager;
      ref.docChangeEmitter.on('doc_changed', cb);
    },
  };
};

const setupServer = ({
  managerId = 'test-manager-id',
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
  managerId?: string;
  rawDoc?: {
    type: 'doc';
    content: Array<any>;
  };
} = {}) => {
  let ref: { rawDoc: any } = {
    rawDoc,
  };

  let emitDocChangeEvent = true;

  const docChangeEmitter = new Emitter();

  const manager = new CollabManager({
    managerId,
    schema: specRegistry.schema,
    getInitialState: async (dName) => {
      if (dName === docName) {
        return new CollabServerState(
          specRegistry.schema.nodeFromJSON(ref.rawDoc),
        );
      }
      return undefined;
    },
    applyState: (docName, newCollabState) => {
      queueMicrotask(() => {
        if (emitDocChangeEvent) {
          docChangeEmitter.emit('doc_changed', {
            docName,
            version: newCollabState.version,
          });
        }
      });
      return true;
    },
  });

  let handleRequest = manager.handleRequest;

  let requestProxy:
    | undefined
    | ((
        request: Parameters<CollabManager['handleRequest']>[0],
      ) => Parameters<CollabManager['handleRequest']>[0]);

  let responseProxy:
    | undefined
    | ((
        request: Parameters<CollabManager['handleRequest']>[0],
        response: Awaited<ReturnType<CollabManager['handleRequest']>>,
      ) => Awaited<ReturnType<CollabManager['handleRequest']>>);

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
    Array<{
      userId: string;
      result: Awaited<ReturnType<CollabManager['handleRequest']>>;
    }>
  > => {
    const results = mockedHandleRequest.mock.results;

    const calls = mockedHandleRequest.mock.calls.map((r) => r[0]);

    if (results.some((r) => r.type !== 'return')) {
      throw new Error('Expected all calls to be returns');
    }
    return (await Promise.all(results.map((r) => r.value) as any)).map(
      (val, i) => {
        return {
          userId: calls[i].payload.userId,
          // call: calls[i],
          result: val,
        };
      },
    );
  };

  manager.handleRequest = mockedHandleRequest as any;

  return {
    docChangeEmitter,
    manager,
    async getNotOkayRequests() {
      const returns = await getReturns();

      return returns.filter((r) => r.result.ok === false);
    },

    async getReturns() {
      const returns = await getReturns();

      return returns;
    },
    async getCalls() {
      return await getCalls();
    },

    async getPushRequests() {
      const requests = await getCalls();
      return requests.filter((r) => r.type === CollabRequestType.PushEvents);
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
    changeRawDoc(rawDoc: any) {
      ref.rawDoc = rawDoc;
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

  await sleep(10);

  expect(await server.getCalls()).toEqual([
    {
      payload: expect.anything(),
      type: 'CollabRequestType.GetDocument',
    },
  ]);
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

  expect(await server.getCalls()).toEqual([
    {
      payload: expect.anything(),
      type: 'CollabRequestType.GetDocument',
    },
    {
      payload: expect.anything(),
      type: 'CollabRequestType.PushEvents',
    },
    {
      payload: expect.anything(),
      type: 'CollabRequestType.PullEvents',
    },
  ]);
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

  expect(await server.getCalls()).toEqual([
    {
      payload: expect.objectContaining({
        userId: 'user-client1',
      }),
      type: 'CollabRequestType.GetDocument',
    },
    {
      payload: expect.objectContaining({
        userId: 'user-client1',
      }),
      type: 'CollabRequestType.PushEvents',
    },
    {
      payload: expect.objectContaining({
        userId: 'user-client1',
      }),
      type: 'CollabRequestType.PullEvents',
    },
    {
      payload: expect.objectContaining({
        userId: 'user-client2',
      }),
      type: 'CollabRequestType.GetDocument',
    },
  ]);
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
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'A',
              },
            ],
          },
        ],
      },
    });

    const client1 = setupClient(server, 'client1');
    const client2 = setupClient(server, 'client2');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("A"))`);
      expect(client2.debugString()).toEqual(`doc(paragraph("A"))`);
    });

    client1.typeText('hi', 1);
    client2.typeText('bye', 1);
    await sleep();

    expect(await server.getNotOkayRequests()).toEqual([
      {
        userId: 'user-client2',
        result: {
          body: CollabFail.OutdatedVersion,
          ok: false,
        },
      },
    ]);
    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hibyeA"))`);
      expect(client2.debugString()).toEqual(`doc(paragraph("hibyeA"))`);
    });

    client2.typeText('hello', 6);
    await sleep();

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hibyehelloA"))`);
      expect(client2.debugString()).toEqual(`doc(paragraph("hibyehelloA"))`);
    });

    // should not produce any new not-ok requests
    expect(await server.getNotOkayRequests()).toHaveLength(1);
  });
});

test('hard reset', async () => {
  let server = setupServer({ managerId: 'manager-test-1' });
  const client1 = setupClient(server, 'client1');
  await waitForExpect(async () => {
    expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
  });

  client1.typeText('one');
  client1.typeText('two');
  client1.typeText('three');

  await waitForExpect(async () => {
    expect(server.manager.getCollabState(docName)?.version).toEqual(3);
  });

  server = setupServer({
    managerId: 'manager-test-1',
    rawDoc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'reset bro!',
            },
          ],
        },
      ],
    },
  });

  client1.changeServer(server);

  hardResetClient()(client1.view.state, client1.view.dispatch);

  // should be reset
  await waitForExpect(async () => {
    expect(client1.debugString()).toEqual(`doc(paragraph("reset bro!"))`);
  });

  expect(collabMonitorKey.getState(client1.view.state)?.serverVersion).toBe(
    undefined,
  );

  // should continue to sync
  client1.typeText('hi again');

  await waitForExpect(async () => {
    expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
      `doc(paragraph("reset bro!hi again"))`,
    );
  });
  expect(client1.debugString()).toEqual(`doc(paragraph("reset bro!hi again"))`);

  expect(collabMonitorKey.getState(client1.view.state)?.serverVersion).toBe(1);
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
      if (req.type === CollabRequestType.PushEvents && !done) {
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
        userId: 'user-client1',
        result: {
          body: CollabFail.ApplyFailed,
          ok: false,
        },
      },
    ]);

    await sleep(500);
    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("wow hello world!"))',
      );
    });

    expect(await server.getCalls()).toEqual([
      {
        payload: expect.anything(),
        type: 'CollabRequestType.GetDocument',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PushEvents',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PushEvents',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
    ]);
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
        userId: 'user-client1',
        result: {
          body: CollabFail.DocumentNotFound,
          ok: false,
        },
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
    await manager.handleRequest({
      type: CollabRequestType.PushEvents,
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
      // we first get CollabFail.OutdatedVersion because the client
      // first tries to push changes ('A') which will fail because
      // the version is outdated. On seeing this, the client will
      // try to pull the latest version and get a failure because the history
      // is not available.
      {
        userId: 'user-client1',
        result: {
          body: CollabFail.OutdatedVersion,
          ok: false,
        },
      },
      {
        userId: 'user-client1',
        result: {
          body: CollabFail.HistoryNotAvailable,
          ok: false,
        },
      },
    ]);
  });

  test('handles IncorrectManager', async () => {
    const server = setupServer();

    server.alterResponse((req, resp) => {
      if (req.type === CollabRequestType.GetDocument && resp.ok) {
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
        userId: 'user-client1',
        result: {
          body: CollabFail.IncorrectManager,
          ok: false,
        },
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
      if (req.type === CollabRequestType.PushEvents) {
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
        userId: 'user-client1',
        result: {
          body: CollabFail.InvalidVersion,
          ok: false,
        },
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
    expect(
      (
        await manager.handleRequest({
          type: CollabRequestType.PushEvents,
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
        })
      ).ok,
    ).toBe(true);

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
        userId: 'user-client1',
        result: {
          body: CollabFail.OutdatedVersion,
          ok: false,
        },
      },
    ]);
  });

  test('handles ManagerDestroyed', async () => {
    let server = setupServer();
    const client1 = setupClient(server, 'client1');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    client1.typeText('wow ');

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("wow hello world!"))',
      );
    });

    const { manager } = server;

    manager.destroy();

    client1.typeText('bow ');

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("wow hello world!"))',
      );
    });

    expect(await server.getNotOkayRequests()).toEqual([
      {
        userId: 'user-client1',
        result: {
          body: CollabFail.ManagerDestroyed,
          ok: false,
        },
      },
    ]);

    expect(
      (await server.getCalls()).filter((r) =>
        r.payload.userId.includes('client1'),
      ),
    ).toEqual([
      {
        payload: expect.anything(),
        type: 'CollabRequestType.GetDocument',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PushEvents',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PushEvents',
      },
    ]);

    server = setupServer();

    client1.changeServer(server);
    client1.typeText('pow ');

    await sleep(10);

    // should get invalid version since server was changed
    expect(await server.getNotOkayRequests()).toEqual([
      {
        result: {
          body: 'CollabFail.InvalidVersion',
          ok: false,
        },
        userId: 'user-client1',
      },
    ]);

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("hello world!"))',
      );
    });

    expect(
      (await server.getCalls()).filter((r) =>
        r.payload.userId.includes('client1'),
      ),
    ).toEqual([
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.GetDocument',
      },
    ]);
  });
  test('server restarts with different managerId and version', async () => {
    console.error = jest.fn();
    let server = setupServer();

    const client1 = setupClient(server, 'client1');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    client1.typeText('wow ');

    await sleep(10);

    expect(await server.getNotOkayRequests()).toEqual([]);

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("wow hello world!"))',
      );
    });

    server = setupServer({ managerId: 'test-manager-new-id' });

    client1.changeServer(server);

    await sleep(10);

    client1.typeText('bye ');

    await sleep(10);

    expect(await server.getNotOkayRequests()).toEqual([
      {
        userId: 'user-client1',
        result: {
          body: CollabFail.IncorrectManager,
          ok: false,
        },
      },
    ]);

    expect(
      (await server.getCalls()).filter((r) =>
        r.payload.userId.includes('client1'),
      ),
    ).toEqual([
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PushEvents',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.GetDocument',
      },
    ]);

    // TODO: Currently if it restarts, it ends up resetting everything
    // this is not desirable.
    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    client1.typeText('new type ');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(
        `doc(paragraph("hello wonew type rld!"))`,
      );
    });
  });

  test('local apply steps fails', async () => {
    console.error = jest.fn();
    const server = setupServer();

    const client1 = setupClient(server, 'client1');
    const client2 = setupClient(server, 'client2');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    let done = false;
    server.alterResponse((req, resp) => {
      if (
        req.type === CollabRequestType.PullEvents &&
        !done &&
        resp.ok &&
        req.payload.userId.includes('client1')
      ) {
        done = true;
        let body = resp.body as PullEventsResponse;
        return {
          ...resp,
          body: {
            ...body,
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
      return resp;
    });

    client2.typeText('wow ');

    await sleep(10);

    expect(await server.getNotOkayRequests()).toEqual([]);

    await sleep(10);

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("wow hello world!"))',
      );
    });

    expect(console.error).toBeCalledTimes(1);
    expect(console.error).nthCalledWith(
      1,
      new RangeError('Position 10000 out of range'),
    );

    expect(
      (await server.getCalls()).filter((r) =>
        r.payload.userId.includes('client1'),
      ),
    ).toEqual([
      {
        payload: expect.anything(),
        type: 'CollabRequestType.GetDocument',
      },
      // two pulls because of the apply error
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
      {
        payload: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
    ]);

    // after recovery client should be syncing correctly
    client1.typeText('new type ');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(
        'doc(paragraph("wow new type hello world!"))',
      );
    });
  });

  test('resets collab-monitor on restart', async () => {
    const server = setupServer();

    const client1 = setupClient(server, 'client1');

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    // send an invalid version to trigger client to restart
    server.alterRequest((req) => {
      if (req.type === CollabRequestType.PushEvents) {
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

    onUpstreamChanges(783)(client1.view.state, client1.view.dispatch);
    expect(collabMonitorKey.getState(client1.view.state)?.serverVersion).toBe(
      783,
    );

    await sleep(10);

    expect(await server.getNotOkayRequests()).toEqual([
      {
        userId: 'user-client1',
        result: {
          body: CollabFail.InvalidVersion,
          ok: false,
        },
      },
    ]);

    // Editor should reset
    expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    // server version should be reset upon restart
    expect(collabMonitorKey.getState(client1.view.state)?.serverVersion).toBe(
      undefined,
    );
  });
});
