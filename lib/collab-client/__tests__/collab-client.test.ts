/**
 * @jest-environment jsdom
 */

import waitForExpect from 'wait-for-expect';

import { defaultSpecs } from '@bangle.dev/all-base-components';
import {
  CollabFail,
  CollabManager,
  CollabMessageBus,
  CollabRequest2,
  CollabRequestType,
  CollabServerState,
  MANAGER_ID,
  MAX_STEP_HISTORY,
  MessageType,
} from '@bangle.dev/collab-server';
import { paragraph, SpecRegistry } from '@bangle.dev/core';
import { renderTestEditor, sleep } from '@bangle.dev/test-helpers';
import { Emitter, uuid } from '@bangle.dev/utils';

import { CollabExtensionOptions, plugins } from '../src/collab-extension';
import {
  hardResetClient,
  onUpstreamChanges,
  queryFatalError,
} from '../src/commands';
import { collabMonitorKey } from '../src/common';

waitForExpect.defaults.timeout = 500;
const specRegistry = new SpecRegistry([...defaultSpecs()]);
const docName = 'test-doc';
jest.setTimeout(30000);

const clientMessagingSetup = ({
  managerId,
  clientID,
  collabMessageBus,
  serverMessageBus,
}: {
  managerId: string;
  clientID: string;
  collabMessageBus: CollabMessageBus;
  serverMessageBus: CollabMessageBus;
}) => {
  let unregister1 = collabMessageBus.receiveMessages(managerId, (message) => {
    serverMessageBus.transmit(message);
  });
  let unregister2 = serverMessageBus.receiveMessages(clientID, (message) => {
    collabMessageBus.transmit(message);
  });

  return () => {
    unregister1();
    unregister2();
  };
};

const setupClient = (
  server: ReturnType<typeof setupServer>,
  options: Partial<CollabExtensionOptions> = {},
) => {
  let ref: {
    manager?: CollabManager;
    docChangeEmitter?: Emitter;
  } = {
    manager: undefined,
    docChangeEmitter: undefined,
  };

  const collabMessageBus = new CollabMessageBus();
  const clientID = options.clientID || 'client-' + uuid();

  let unregisterMessaging = clientMessagingSetup({
    managerId: server.manager.managerId!,
    clientID,
    collabMessageBus,
    serverMessageBus: server.collabMessageBus,
  });

  controller.signal.addEventListener(
    'abort',
    () => {
      collabMessageBus.off();
    },
    { once: true },
  );

  ref.manager = server.manager;
  ref.docChangeEmitter = server.docChangeEmitter;

  const { editor, debugString } = renderTestEditor({
    specRegistry: specRegistry,
    plugins: [
      paragraph.plugins(),
      plugins({
        docName: docName,
        clientID: clientID,
        cooldownTime: 0,
        collabMessageBus: collabMessageBus,
        managerId: server.manager.managerId!,
        ...options,
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
    docName: options.docName || docName,
    clientID,
    editor,
    view: editor.view,
    debugString,
    typeText,
    changeServer(newServer: ReturnType<typeof setupServer>) {
      unregisterMessaging();
      unregisterMessaging = clientMessagingSetup({
        managerId: newServer.manager.managerId!,
        clientID: clientID,
        collabMessageBus,
        serverMessageBus: newServer.collabMessageBus,
      });

      ref.docChangeEmitter?.off('doc_changed', cb);
      ref.docChangeEmitter = newServer.docChangeEmitter;
      ref.manager = newServer.manager;
      ref.docChangeEmitter.on('doc_changed', cb);
    },
  };
};

const setupServer = ({
  managerId = MANAGER_ID,
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
  const collabMessageBus = new CollabMessageBus();

  const queue: Array<{
    id: string;
    request: CollabRequest2['request'];
    response: CollabRequest2['response'] | undefined;
  }> = [];

  let alterRequestRef: {
    current?: (data: CollabRequest2['request']) => CollabRequest2['request'];
  } = {
    current: undefined,
  };

  let alterResponseRef: {
    current?: (
      request: CollabRequest2['request'],
      response: CollabRequest2['response'],
    ) => CollabRequest2['response'];
  } = {
    current: undefined,
  };

  collabMessageBus.receiveMessages(CollabMessageBus.ANY_MESSAGE, (message) => {
    console.log(message);
    if (message.type === MessageType.PING) {
      let alterRequest = alterRequestRef.current;

      if (alterRequest) {
        // since this is the first listener.
        // mutating message body in place will allow us to modify the request
        // for subsequent listeners
        message.messageBody = alterRequest(message.messageBody);
      }
      queue.push({
        id: message.id,
        request: message.messageBody,
        response: undefined,
      });
    } else if (message.type === MessageType.PONG) {
      const match = queue.find((item) => item.id === message.id);
      if (!match) {
        throw new Error(
          'No matching ping found for ' + JSON.stringify(message),
        );
      }

      let alterResp = alterResponseRef.current;
      if (alterResp) {
        // since this is the first listener.
        // mutating message body in place will allow us to modify the request
        // for subsequent listeners
        message.messageBody = alterResp(match.request, message.messageBody);
      }
      match.response = message.messageBody;
    }
  });

  controller.signal.addEventListener(
    'abort',
    () => {
      collabMessageBus.off();
    },
    { once: true },
  );

  const manager = new CollabManager({
    managerId,
    schema: specRegistry.schema,
    collabMessageBus,
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

  const getRequests = () => {
    return queue.map((r) => r.request);
  };
  const getReturns = async (): Promise<
    Array<{
      userId: string;
      result?: CollabRequest2['response'];
    }>
  > => {
    return queue.map((r) => {
      return { userId: r.request.body.userId, result: r.response };
    });
  };

  return {
    collabMessageBus,
    docChangeEmitter,
    manager,

    async getNotOkayRequests() {
      const returns = await getReturns();

      return returns.filter((r) => {
        return r.result?.ok === false;
      });
    },

    async getReturns() {
      return getReturns();
    },
    async getRequests() {
      return getRequests();
    },
    async getCalls() {
      return queue;
    },

    async getPushRequests() {
      const requests = await getRequests();
      return requests.filter((r) => r.type === CollabRequestType.PushEvents);
    },
    alterRequest(cb: typeof alterRequestRef.current) {
      alterRequestRef.current = cb;
    },
    alterResponse(cb: typeof alterResponseRef.current) {
      alterResponseRef.current = cb;
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
let controller = new AbortController();

beforeEach(() => {
  console.error = consoleError;

  controller = new AbortController();
});

afterEach(() => {
  controller.abort();
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

  expect(await server.getRequests()).toEqual([
    {
      body: expect.anything(),
      type: 'CollabRequestType.GetDocument',
    },
  ]);
});

test('can edit the document', async () => {
  const server = setupServer();
  const client1 = setupClient(server, { clientID: 'client1' });

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

  expect(await server.getRequests()).toEqual([
    {
      body: expect.anything(),
      type: 'CollabRequestType.GetDocument',
    },
    {
      body: expect.anything(),
      type: 'CollabRequestType.PushEvents',
    },
    {
      body: expect.anything(),
      type: 'CollabRequestType.PullEvents',
    },
  ]);
});

test('newer client get updated document', async () => {
  const server = setupServer();
  const client1 = setupClient(server, { clientID: 'client1' });

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

  const client2 = setupClient(server, { clientID: 'client2' });

  await waitForExpect(async () => {
    expect(client2.debugString()).toEqual(
      `doc(paragraph("bye world hello world!"))`,
    );
  });

  expect(await server.getRequests()).toEqual([
    {
      body: expect.objectContaining({
        userId: 'user-client1',
      }),
      type: 'CollabRequestType.GetDocument',
    },
    {
      body: expect.objectContaining({
        userId: 'user-client1',
      }),
      type: 'CollabRequestType.PushEvents',
    },
    {
      body: expect.objectContaining({
        userId: 'user-client1',
      }),
      type: 'CollabRequestType.PullEvents',
    },
    {
      body: expect.objectContaining({
        userId: 'user-client2',
      }),
      type: 'CollabRequestType.GetDocument',
    },
  ]);
});

describe('multiplayer collab', () => {
  test('case0: two clients are able to sync', async () => {
    const server = setupServer();
    const client1 = setupClient(server, { clientID: 'client1' });
    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });
    const client2 = setupClient(server, { clientID: 'client2' });
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
    const client1 = setupClient(server, { clientID: 'client1' });
    const client2 = setupClient(server, { clientID: 'client2' });
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

    const client1 = setupClient(server, { clientID: 'client1' });
    const client2 = setupClient(server, { clientID: 'client2' });

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
          type: 'CollabRequestType.PushEvents',
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
  const client1 = setupClient(server, { clientID: 'client1' });
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

    const client1 = setupClient(server, { clientID: 'client1' });

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    let done = false;
    server.alterRequest((req) => {
      if (req.type === CollabRequestType.PushEvents && !done) {
        done = true;
        return {
          ...req,
          body: {
            ...req.body,
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
          type: 'CollabRequestType.PushEvents',
        },
      },
    ]);

    await sleep(500);
    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("wow hello world!"))',
      );
    });

    expect(await server.getRequests()).toEqual([
      {
        body: expect.anything(),
        type: 'CollabRequestType.GetDocument',
      },
      {
        body: expect.anything(),
        type: 'CollabRequestType.PushEvents',
      },
      {
        body: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
      {
        body: expect.anything(),
        type: 'CollabRequestType.PushEvents',
      },
      {
        body: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
    ]);
  });

  test('handles DocumentNotFound', async () => {
    const server = setupServer();
    const client1 = setupClient(server, {
      clientID: 'client1',
      docName: 'some-wrong-doc',
    });

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
          type: 'CollabRequestType.GetDocument',
        },
      },
    ]);
  });

  test('handles HistoryNotAvailable', async () => {
    const server = setupServer();
    const client1 = setupClient(server, { clientID: 'client1' });
    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    server.blockDocChangeEvent();

    const { manager } = server;
    const fakeClientId = 'fakeClientId';

    await server.collabMessageBus.transmit({
      type: MessageType.PING,
      from: fakeClientId,
      to: manager.managerId,
      id: 'some-id-1234',
      messageBody: {
        type: CollabRequestType.PushEvents,
        body: {
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
          type: 'CollabRequestType.PushEvents',
        },
      },
      {
        userId: 'user-client1',
        result: {
          body: CollabFail.HistoryNotAvailable,
          ok: false,
          type: 'CollabRequestType.PullEvents',
        },
      },
    ]);
  });

  test('handles IncorrectManager', async () => {
    const server = setupServer();

    server.alterResponse((req, resp) => {
      if (resp.type === CollabRequestType.GetDocument && resp.ok) {
        return {
          ok: true,
          type: CollabRequestType.GetDocument,
          body: {
            ...resp.body,
            managerId: 'wrong-id',
          },
        };
      }
      return resp;
    });

    const client1 = setupClient(server, { clientID: 'client1' });

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
          type: 'CollabRequestType.PushEvents',
        },
      },
    ]);

    // Editor should enter fatal error
    expect(queryFatalError()(client1.view.state)).toEqual({
      message: 'Incorrect manager',
    });
  });

  test('handles InvalidVersion', async () => {
    const server = setupServer();

    const client1 = setupClient(server, { clientID: 'client1' });

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    server.alterRequest((req) => {
      if (req.type === CollabRequestType.PushEvents) {
        return {
          ...req,
          body: {
            ...req.body,
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
          type: 'CollabRequestType.PushEvents',
        },
      },
    ]);

    // Editor should reset
    expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
  });

  test('handles OutdatedVersion', async () => {
    const server = setupServer();
    const client1 = setupClient(server, { clientID: 'client1' });

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    const { manager } = server;

    server.blockDocChangeEvent();

    const fakeClientId = 'fakeClientId';

    await server.collabMessageBus.transmit({
      type: MessageType.PING,
      from: fakeClientId,
      to: manager.managerId,
      id: 'some-id-1231',
      messageBody: {
        type: CollabRequestType.PushEvents,
        body: {
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
        userId: 'user-client1',
        result: {
          body: CollabFail.OutdatedVersion,
          ok: false,
          type: 'CollabRequestType.PushEvents',
        },
      },
    ]);
  });

  test('handles when manager is destroyed', async () => {
    console.error = jest.fn();
    let server = setupServer();
    const client1 = setupClient(server, {
      clientID: 'client1',
      requestTimeout: 10,
      cooldownTime: 1,
    });

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

    // wait for it to end up in fatal error
    await sleep(500);

    const calls = (await server.getCalls()).map((r) => {
      return [r.request.type, { ok: r.response?.ok }];
    });

    // since there will be many pull events , only check first three calls
    expect(calls.slice(0, 3)).toEqual([
      ['CollabRequestType.GetDocument', { ok: true }],
      ['CollabRequestType.PushEvents', { ok: true }],
      ['CollabRequestType.PullEvents', { ok: true }],
    ]);

    // it should multiple pull calls to server, to retry connection.
    expect(
      calls.filter((r) => r[0] === 'CollabRequestType.PullEvents').length,
    ).toBeGreaterThan(4);

    expect(queryFatalError()(client1.view.state)).toStrictEqual({
      message:
        'Stuck in error loop, last failure: CollabFail.ManagerUnresponsive',
    });

    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "@bangle.dev/collab-client: In FatalErrorState message=Stuck in error loop, last failure: CollabFail.ManagerUnresponsive",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);

    server = setupServer();

    client1.changeServer(server);
    hardResetClient()(client1.view.state, client1.view.dispatch);

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    client1.typeText('pow ', 1);

    await sleep(10);

    expect(await server.getNotOkayRequests()).toEqual([]);

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("pow hello world!"))',
      );
    });

    expect(await server.getRequests()).toEqual([
      {
        body: expect.anything(),
        type: 'CollabRequestType.GetDocument',
      },
      {
        body: expect.anything(),
        type: 'CollabRequestType.PushEvents',
      },
      {
        body: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
    ]);
  });
  test('server restarts with different managerId and version', async () => {
    console.error = jest.fn();
    let server = setupServer();

    const client1 = setupClient(server, {
      clientID: 'client1',
      cooldownTime: 0,
      requestTimeout: 10,
    });

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

    server.manager.destroy();

    server = setupServer();

    client1.changeServer(server);
    hardResetClient()(client1.view.state, client1.view.dispatch);

    await sleep(10);

    client1.typeText('bye ');

    await sleep(100);

    await waitForExpect(async () => {
      expect(server.manager.getCollabState(docName)?.doc.toString()).toEqual(
        'doc(paragraph("hellbye o world!"))',
      );
    });
  });

  test('local apply steps fails', async () => {
    console.error = jest.fn();
    const server = setupServer();

    const client1 = setupClient(server, { clientID: 'client1' });
    const client2 = setupClient(server, { clientID: 'client2' });

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    let done = false;
    server.alterResponse((req, resp) => {
      if (
        req.type === CollabRequestType.PullEvents &&
        !done &&
        resp.ok &&
        req.body.userId.includes('client1')
      ) {
        done = true;
        let body = resp.body;
        return {
          ok: true,
          type: CollabRequestType.PullEvents,
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
      (await server.getRequests()).filter((r) =>
        r.body.userId.includes('client1'),
      ),
    ).toEqual([
      {
        body: expect.anything(),
        type: 'CollabRequestType.GetDocument',
      },
      // two pulls because of the apply error
      {
        body: expect.anything(),
        type: 'CollabRequestType.PullEvents',
      },
      {
        body: expect.anything(),
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

    const client1 = setupClient(server, { clientID: 'client1' });

    await waitForExpect(async () => {
      expect(client1.debugString()).toEqual(`doc(paragraph("hello world!"))`);
    });

    // send an invalid version to trigger client to restart
    server.alterRequest((req) => {
      if (req.type === CollabRequestType.PushEvents) {
        return {
          ...req,
          body: {
            ...req.body,
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
          type: 'CollabRequestType.PushEvents',
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
