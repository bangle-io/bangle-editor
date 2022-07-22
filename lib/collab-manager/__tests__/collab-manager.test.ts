import { defaultSpecs } from '@bangle.dev/all-base-components';
import {
  ClientCommunication,
  CollabClientRequestType,
  CollabFail,
  CollabMessageBus,
  DEFAULT_MANAGER_ID,
} from '@bangle.dev/collab-comms';
import { SpecRegistry } from '@bangle.dev/core';
import { Node } from '@bangle.dev/pm';

import { CollabServerState } from '../src';
import { CollabManager } from '../src/collab-manager';

export {
  ClientCommunication,
  CollabClientRequestType,
  CollabFail,
} from '@bangle.dev/collab-comms';

const specRegistry = new SpecRegistry([...defaultSpecs()]);

const rawDoc = {
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
};

let controller = new AbortController();
beforeEach(() => {
  controller = new AbortController();
});

afterEach(() => {
  controller.abort();
});

const TEST_DOC_NAME = 'test-doc-1';

const setup = (
  opts: Partial<ConstructorParameters<typeof CollabManager>[0]> = {},
) => {
  // we are creating two buses to simulate real world case of them running in different processes
  const messageBus = new CollabMessageBus();
  const clientBus = new CollabMessageBus();

  const clientId = 'test-client-id';

  let options = Object.assign(
    {
      schema: specRegistry.schema,
      collabMessageBus: messageBus,
      getInitialState: async (docName: string) => {
        return new CollabServerState(
          specRegistry.schema.nodeFromJSON(rawDoc) as Node,
        );
      },
    },
    opts,
  );
  const manager = new CollabManager(options);

  // wire up both the busses, this will flood both of the buses with
  // each others messages, which should be fine since we use from, to, uid
  // to receive the correct message.
  messageBus.receiveMessages(clientId, (message) => {
    clientBus.transmit(message);
  });
  clientBus.receiveMessages(manager.managerId, (message) => {
    messageBus.transmit(message);
  });

  const onNewVersion = jest.fn();
  const client = new ClientCommunication({
    docName: TEST_DOC_NAME,
    messageBus: clientBus,
    clientId,
    signal: controller.signal,
    managerId: DEFAULT_MANAGER_ID,
    onNewVersion,
  });

  return { manager, client, onNewVersion };
};

describe('getDocument', () => {
  test('works', async () => {
    const { client } = setup();

    const resp = await client.getDocument({
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      body: {
        doc: rawDoc,
        users: 1,
        version: expect.any(Number),
        managerId: DEFAULT_MANAGER_ID,
      },
      ok: true,
      type: 'CollabClientRequestType.GetDocument',
    });
  });

  test('throws error when document is not found', async () => {
    const { manager, client } = setup({
      getInitialState: async (docName) => {
        return undefined;
      },
    });

    const resp = await client.getDocument({
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      body: CollabFail.DocumentNotFound,
      ok: false,
      type: 'CollabClientRequestType.GetDocument',
    });
  });
});

test('getCollabState', async () => {
  const { manager, client } = setup();

  await client.getDocument({
    docName: TEST_DOC_NAME,
    userId: 'test-user-1',
  });

  const { steps, version, doc } = manager.getCollabState(TEST_DOC_NAME)!;
  expect(steps).toEqual([]);
  expect(version).toEqual(0);
  expect(doc.toString()).toMatchInlineSnapshot(
    `"doc(paragraph(\\"hello world!\\"))"`,
  );
});

describe('push events', () => {
  test('push events', async () => {
    const { manager, client, onNewVersion } = setup();

    await client.getDocument({
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    const resp = await client.pushEvents({
      clientID: 'client-test-1',
      version: manager.getCollabState(TEST_DOC_NAME)?.version!,
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
                text: 'lovely ',
              },
            ],
          },
        },
      ],
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      type: CollabClientRequestType.PushEvents,
      body: {
        empty: null,
      },
      ok: true,
    });

    const { steps, version, doc } = manager.getCollabState(TEST_DOC_NAME)!;
    expect(steps.map((r) => r.toJSON())).toEqual([
      {
        from: 1,
        slice: {
          content: [
            {
              text: 'lovely ',
              type: 'text',
            },
          ],
        },
        stepType: 'replace',
        to: 1,
      },
    ]);
    expect(version).toEqual(1);
    expect(doc.toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"lovely hello world!\\"))"`,
    );

    expect(onNewVersion).toBeCalledTimes(1);
    expect(onNewVersion).nthCalledWith(1, {
      version: 1,
      docName: TEST_DOC_NAME,
    });
  });

  test('errors invalid manager id on push', async () => {
    const { manager, client, onNewVersion } = setup();

    await client.getDocument({
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    const resp = await client.pushEvents({
      clientID: 'client-test-1',
      version: manager.getCollabState(TEST_DOC_NAME)?.version!,
      managerId: 'wrong-manager-id',
      steps: [],
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      type: CollabClientRequestType.PushEvents,
      body: CollabFail.IncorrectManager,
      ok: false,
    });

    expect(onNewVersion).toBeCalledTimes(0);
  });

  test('errors if invalid version', async () => {
    const { manager, client, onNewVersion } = setup();

    await client.getDocument({
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    const resp = await client.pushEvents({
      clientID: 'client-test-1',
      version: -1,
      managerId: manager.managerId,
      steps: [],
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      type: CollabClientRequestType.PushEvents,
      body: CollabFail.InvalidVersion,
      ok: false,
    });
    expect(onNewVersion).toBeCalledTimes(0);
  });

  test('invalid version on push', async () => {
    const { manager, client, onNewVersion } = setup();

    await client.getDocument({
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    const resp = await client.pushEvents({
      clientID: 'client-test-1',
      docName: TEST_DOC_NAME,
      userId: 'test-user-3',
      version: 1,
      steps: [],
      managerId: manager.managerId,
    });

    expect(resp).toEqual({
      type: CollabClientRequestType.PushEvents,
      body: CollabFail.InvalidVersion,
      ok: false,
    });

    expect(onNewVersion).toBeCalledTimes(0);
  });
});

describe('pull events', () => {
  test('pull events', async () => {
    const { manager, client, onNewVersion } = setup();

    await client.getDocument({
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    await client.pushEvents({
      clientID: 'client-test-1',
      version: manager.getCollabState(TEST_DOC_NAME)?.version!,
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
                text: 'lovely ',
              },
            ],
          },
        },
      ],
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    expect(manager.getCollabState(TEST_DOC_NAME)?.version!).toBe(1);
    expect(onNewVersion).toBeCalledTimes(1);
    expect(onNewVersion).nthCalledWith(1, {
      version: 1,
      docName: TEST_DOC_NAME,
    });
    await client.pushEvents({
      clientID: 'client-test-2',
      version: manager.getCollabState(TEST_DOC_NAME)?.version!,
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
      docName: TEST_DOC_NAME,
      userId: 'test-user-2',
    });

    expect(manager.getCollabState(TEST_DOC_NAME)?.version!).toBe(2);
    expect(onNewVersion).toBeCalledTimes(2);
    expect(onNewVersion).nthCalledWith(2, {
      version: 2,
      docName: TEST_DOC_NAME,
    });

    const resp = await client.pullEvents({
      docName: TEST_DOC_NAME,
      userId: 'test-user-3',
      version: 0,
      managerId: manager.managerId,
    });

    expect(resp).toEqual({
      type: CollabClientRequestType.PullEvents,
      body: {
        users: 1,
        version: 2,
        clientIDs: ['client-test-1', 'client-test-2'],
        steps: [
          {
            from: 1,
            slice: {
              content: [
                {
                  text: 'lovely ',
                  type: 'text',
                },
              ],
            },
            stepType: 'replace',
            to: 1,
          },
          {
            from: 1,
            slice: {
              content: [
                {
                  text: 'very ',
                  type: 'text',
                },
              ],
            },
            stepType: 'replace',
            to: 1,
          },
        ],
      },
      ok: true,
    });
  });

  test('invalid manager id on pull', async () => {
    const { manager, client } = setup();

    await client.getDocument({
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    const resp = await client.pullEvents({
      docName: TEST_DOC_NAME,
      userId: 'test-user-3',
      version: 0,
      managerId: 'wrong-manager-id',
    });

    expect(resp).toEqual({
      type: CollabClientRequestType.PullEvents,
      body: CollabFail.IncorrectManager,
      ok: false,
    });
  });

  test('invalid version on pull', async () => {
    const { manager, client } = setup();

    await client.getDocument({
      docName: TEST_DOC_NAME,
      userId: 'test-user-1',
    });

    const resp = await client.pullEvents({
      docName: TEST_DOC_NAME,
      userId: 'test-user-3',
      version: 1,
      managerId: manager.managerId,
    });

    expect(resp).toEqual({
      type: CollabClientRequestType.PullEvents,
      body: CollabFail.InvalidVersion,
      ok: false,
    });
  });
});
