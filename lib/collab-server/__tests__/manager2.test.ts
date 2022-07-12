import { defaultSpecs } from '@bangle.dev/all-base-components';
import { SpecRegistry } from '@bangle.dev/core';
import { Node } from '@bangle.dev/pm';

import { Manager2 } from '../src/take2/manager';

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

const setup = () => {
  const manager = new Manager2({
    schema: specRegistry.schema,
    getDoc: async (docName: string): Promise<Node> => {
      return specRegistry.schema.nodeFromJSON(rawDoc);
    },
  });

  return { manager };
};

describe('get_document', () => {
  test('works', async () => {
    const { manager } = setup();

    const resp = await manager.handleRequest('get_document', {
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      body: {
        doc: rawDoc,
        users: 1,
        version: expect.any(Number),
        managerId: expect.any(String),
      },
      status: 'ok',
    });
  });

  test('throws error when document is not found', async () => {
    const manager = new Manager2({
      schema: specRegistry.schema,
      getDoc: async (docName) => {
        return undefined;
      },
    });

    const resp = await manager.handleRequest('get_document', {
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      body: {
        errorCode: 404,
        message: 'Document not found',
      },
      status: 'error',
    });
  });
});

test('getCollabState', async () => {
  const { manager } = setup();

  await manager.handleRequest('get_document', {
    docName: 'test-doc-1',
    userId: 'test-user-1',
  });

  const { steps, version, doc } = manager.getCollabState('test-doc-1')!;
  expect(steps).toEqual([]);
  expect(version).toEqual(0);
  expect(doc.toString()).toMatchInlineSnapshot(
    `"doc(paragraph(\\"hello world!\\"))"`,
  );
});

describe('push events', () => {
  test('push events', async () => {
    const { manager } = setup();

    await manager.handleRequest('get_document', {
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    const resp = await manager.handleRequest('push_events', {
      clientID: 'client-test-1',
      version: manager.getCollabState('test-doc-1')?.version,
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
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      body: {
        empty: null,
      },
      status: 'ok',
    });

    const { steps, version, doc } = manager.getCollabState('test-doc-1')!;
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
  });

  test('errors invalid manager id on push', async () => {
    const { manager } = setup();

    await manager.handleRequest('get_document', {
      docName: 'test-doc-1',
      userId: 'test-user-1',
      managerId: 'invalid-manager-id',
    });

    const resp = await manager.handleRequest('push_events', {
      clientID: 'client-test-1',
      version: manager.getCollabState('test-doc-1')?.version,
      managerId: 'wrong-manager-id',
      steps: [],
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      body: {
        errorCode: 410,
        message: 'Incorrect manager',
      },
      status: 'error',
    });
  });

  test('errors if invalid version', async () => {
    const { manager } = setup();

    await manager.handleRequest('get_document', {
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    const resp = await manager.handleRequest('push_events', {
      clientID: 'client-test-1',
      version: -1,
      managerId: manager.managerId,
      steps: [],
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    expect(resp).toEqual({
      body: {
        errorCode: 400,
        message: 'Invalid version',
      },
      status: 'error',
    });
  });

  test('invalid version on push', async () => {
    const { manager } = setup();

    await manager.handleRequest('get_document', {
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    const resp = await manager.handleRequest('push_events', {
      docName: 'test-doc-1',
      userId: 'test-user-3',
      version: 1,
      steps: [],
      managerId: manager.managerId,
    });

    expect(resp).toEqual({
      body: {
        errorCode: 400,
        message: 'Invalid version',
      },
      status: 'error',
    });
  });
});

describe('pull events', () => {
  test('pull events', async () => {
    const { manager } = setup();

    await manager.handleRequest('get_document', {
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    await manager.handleRequest('push_events', {
      clientID: 'client-test-1',
      version: manager.getCollabState('test-doc-1')?.version,
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
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    await manager.handleRequest('push_events', {
      clientID: 'client-test-2',
      version: manager.getCollabState('test-doc-1')?.version,
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
      docName: 'test-doc-1',
      userId: 'test-user-2',
    });

    const resp = await manager.handleRequest('pull_events', {
      docName: 'test-doc-1',
      userId: 'test-user-3',
      version: 0,
      managerId: manager.managerId,
    });

    expect(resp).toEqual({
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
      status: 'ok',
    });
  });
  test('invalid manager id on pull', async () => {
    const { manager } = setup();

    await manager.handleRequest('get_document', {
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    const resp = await manager.handleRequest('pull_events', {
      docName: 'test-doc-1',
      userId: 'test-user-3',
      version: 0,
      managerId: 'wrong-manager-id',
    });

    expect(resp).toEqual({
      body: {
        errorCode: 410,
        message: 'Incorrect manager',
      },
      status: 'error',
    });
  });

  test('invalid version on pull', async () => {
    const { manager } = setup();

    await manager.handleRequest('get_document', {
      docName: 'test-doc-1',
      userId: 'test-user-1',
    });

    const resp = await manager.handleRequest('pull_events', {
      docName: 'test-doc-1',
      userId: 'test-user-3',
      version: 1,
      managerId: manager.managerId,
    });

    expect(resp).toEqual({
      body: {
        errorCode: 400,
        message: 'Invalid version',
      },
      status: 'error',
    });
  });
});
