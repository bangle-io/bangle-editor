/// <reference path="../missing-types.d.ts" />

import { SpecRegistry } from '@bangle.dev/core';
import { defaultSpecs } from '@bangle.dev/core/test-helpers/default-components';
import { Disk } from '@bangle.dev/disk';
import { Manager } from '../manager';
import { Node } from 'prosemirror-model';
import { sleep } from '../utils';

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

class SimpleDisk implements Disk {
  constructor() {
    this.load = jest.fn(this.load.bind(this));
    this.update = jest.fn(this.update.bind(this));
    this.flush = jest.fn(this.flush.bind(this));
  }

  async load(_key: string): Promise<Node> {
    return specRegistry.schema.nodeFromJSON(rawDoc) as Node;
  }

  async update(
    _key: string,
    _getLatestDoc: () => { doc: Node; version: number },
  ) {}

  async flush(_key: string, _doc: Node, version: number) {}
}

const setup = (arg: any = {}) => {
  const { managerOpts } = arg;

  const disk = new SimpleDisk();
  const manager = new Manager(specRegistry.schema, {
    disk,
    collectUsersTimeout: 1 * 30,
    userWaitTimeout: 1 * 20,
    instanceCleanupTimeout: 1 * 30,
    ...managerOpts,
  });

  return {
    disk,
    manager,
  };
};

let manager: Manager;
let disk;
afterEach(() => {
  manager.destroy();
});
test('gets document', async () => {
  ({ disk, manager } = setup());
  const resp: any = await manager.handleRequest('get_document', {
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
  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(0);
  expect(disk.flush).toBeCalledTimes(0);
  await sleep(150);
  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(0);
  expect(disk.flush).toBeCalledTimes(0);
});

test('destroy doesnt call flush on an untouched doc when destroying', async () => {
  ({ disk, manager } = setup());
  const resp: any = await manager.handleRequest('get_document', {
    docName: 'test-doc-1',
    userId: 'test-user-1',
  });

  expect(manager.instanceCount).toBe(1);
  manager.destroy();
  expect(manager.instanceCount).toBe(0);
  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(0);
  expect(disk.flush).toBeCalledTimes(0);
  await sleep(150);
  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(0);
  expect(disk.flush).toBeCalledTimes(0);
});

test('instance is shut down after timer', async () => {
  const { manager } = setup({ instanceCleanupTimeout: 50 });
  await manager.handleRequest('get_document', {
    docName: 'test-doc-1',
    userId: 'test-user-1',
  });
  expect(manager.instanceCount).toBe(1);
  await sleep(150);
  expect(manager.instanceCount).toBe(0);
});

test('handles push events', async () => {
  const docName = 'test-doc-1';
  ({ disk, manager } = setup());
  const { body } = (await manager.handleRequest('get_document', {
    docName,
    userId: 'test-user-1',
  })) as any;

  const managerId = body.managerId;
  expect(managerId).toBe(manager.managerId);

  const version = manager.instances[docName]?.version;
  const resp = await manager.handleRequest('push_events', {
    clientID: 'client-test-1',
    version: version,
    managerId,
    steps: [
      {
        stepType: 'replace',
        from: 1,
        to: 1,
        slice: {
          content: [
            {
              type: 'text',
              text: 'hello',
            },
          ],
        },
      },
    ],
    docName: 'test-doc-1',
    userId: 'test-user-1',
  });

  expect(resp).toMatchInlineSnapshot(`
    Object {
      "body": Object {},
      "status": "ok",
    }
  `);

  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(1);
  expect(disk.flush).toBeCalledTimes(0);
});

test('correct error when push events have older version', async () => {
  const docName = 'test-doc-1';
  ({ disk, manager } = setup());
  await manager.handleRequest('get_document', {
    docName,
    userId: 'test-user-1',
  });
  const managerId = manager.managerId;

  const version = manager.instances[docName]!.version;

  await manager.handleRequest('push_events', {
    clientID: 'client-test-1',
    version: version,
    managerId,
    steps: [
      {
        stepType: 'replace',
        from: 1,
        to: 1,
        slice: {
          content: [
            {
              type: 'text',
              text: 'hello',
            },
          ],
        },
      },
    ],
    docName: 'test-doc-1',
    userId: 'test-user-1',
  });

  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(1);
  expect(disk.flush).toBeCalledTimes(0);

  const resp = await manager.handleRequest('push_events', {
    clientID: 'client-test-1',
    version: version,
    managerId,
    steps: [
      {
        stepType: 'replace',
        from: 1,
        to: 1,
        slice: {
          content: [
            {
              type: 'text',
              text: 'different',
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
      errorCode: 409,
      message: `Version 0 not current. Currently on 1`,
    },
    status: 'error',
  });

  await sleep(0);

  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(1);
  expect(disk.flush).toBeCalledTimes(0);
});

test('correct error when push events are newer version', async () => {
  const docName = 'test-doc-1';
  ({ disk, manager } = setup());
  await manager.handleRequest('get_document', {
    docName,
    userId: 'test-user-1',
  });
  const managerId = manager.managerId;

  const version = manager.instances[docName]!.version;

  const resp = await manager.handleRequest('push_events', {
    clientID: 'client-test-1',
    version: version + 1,
    managerId,
    steps: [
      {
        stepType: 'replace',
        from: 1,
        to: 1,
        slice: {
          content: [
            {
              type: 'text',
              text: 'hello',
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
      errorCode: 400,
      message: `Invalid version 1`,
    },
    status: 'error',
  });
});

test('push_events : correct error when managerId are different version', async () => {
  const docName = 'test-doc-1';
  ({ disk, manager } = setup());

  await manager.handleRequest('get_document', {
    docName,
    userId: 'test-user-1',
  });

  const version = manager.instances[docName]!.version;

  const resp = await manager.handleRequest('push_events', {
    clientID: 'client-test-1',
    version: version + 1,
    managerId: 'something-else-1',
    steps: [
      {
        stepType: 'replace',
        from: 1,
        to: 1,
        slice: {
          content: [
            {
              type: 'text',
              text: 'hello',
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
      errorCode: 410,
      message: 'Incorrect manager id something-else-1',
    },
    status: 'error',
  });

  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(0);
  expect(disk.flush).toBeCalledTimes(0);
});

test('pull_events: correct error when managerId are different version', async () => {
  const docName = 'test-doc-1';
  ({ disk, manager } = setup());
  await manager.handleRequest('get_document', {
    docName,
    userId: 'test-user-1',
  });

  const version = manager.instances[docName]!.version;

  const resp = await manager.handleRequest('pull_events', {
    version: version + 1,
    managerId: 'something-else-1',
    docName: 'test-doc-1',
    userId: 'test-user-1',
  });

  expect(resp).toEqual({
    body: {
      errorCode: 410,
      message: 'Incorrect manager id something-else-1',
    },
    status: 'error',
  });

  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(0);
  expect(disk.flush).toBeCalledTimes(0);
});

test('pull_events: terminates connection immediately when called destroy', async () => {
  ({ disk, manager } = setup({
    managerOpts: {
      collectUsersTimeout: 200,
      userWaitTimeout: 200,
      instanceCleanupTimeout: 500,
    },
  }));
  await manager.handleRequest('get_document', {
    docName: 'test-doc-1',
    userId: 'test-user-1',
  });
  expect(disk.load).toBeCalledTimes(1);

  let promise = manager.handleRequest('pull_events', {
    docName: 'test-doc-1',
    userId: 'test-user-1',
    version: 0,
    managerId: manager.managerId,
  });
  let time = Date.now();
  manager.destroy();
  expect(manager.destroyed).toBe(true);
  expect(manager.instanceCount).toBe(0);
  await promise;
  expect(manager.instanceCount).toBe(0);
  const diff = Date.now() - time;
  expect(diff < 50).toBe(true);
  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(0);
  expect(disk.flush).toBeCalledTimes(0);
});

test('pull_events: waits userWaitTimeout', async () => {
  ({ disk, manager } = setup({
    managerOpts: {
      collectUsersTimeout: 500,
      userWaitTimeout: 150,
      instanceCleanupTimeout: 500,
    },
  }));
  await manager.handleRequest('get_document', {
    docName: 'test-doc-1',
    userId: 'test-user-1',
  });

  let promise = manager.handleRequest('pull_events', {
    docName: 'test-doc-1',
    userId: 'test-user-1',
    version: 0,
    managerId: manager.managerId,
  });
  let time = Date.now();
  expect(manager.instanceCount).toBe(1);
  await promise;
  const diff = Date.now() - time;
  expect(diff > 140).toBe(true);
  expect(manager.instanceCount).toBe(1);

  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(0);
  expect(disk.flush).toBeCalledTimes(0);
});

test('cleans up instance after timer expire', async () => {
  ({ disk, manager } = setup({
    managerOpts: {
      instanceCleanupTimeout: 150,
    },
  }));
  await manager.handleRequest('get_document', {
    docName: 'test-doc-1',
    userId: 'test-user-1',
  });

  await manager.handleRequest('pull_events', {
    docName: 'test-doc-1',
    userId: 'test-user-1',
    version: 0,
    managerId: manager.managerId,
  });

  expect(manager.instanceCount).toBe(1);
  await sleep(50);
  expect(manager.instanceCount).toBe(1);

  await sleep(100);

  expect(manager.instanceCount).toBe(0);

  expect(disk.load).toBeCalledTimes(1);
  expect(disk.update).toBeCalledTimes(0);
  expect(disk.flush).toBeCalledTimes(0);
});
