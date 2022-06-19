import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { collabClient } from '@bangle.dev/collab-client';
import type { CollabRequestType } from '@bangle.dev/collab-server';
import { Manager, parseCollabResponse } from '@bangle.dev/collab-server';
import { SpecRegistry } from '@bangle.dev/core';
import { Node } from '@bangle.dev/pm';
import { uuid } from '@bangle.dev/utils';

import { setupReactEditor } from '../../setup/entry-helpers';

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

class SimpleDisk {
  constructor(public specRegistry: SpecRegistry) {}

  async flush(_key: string, _doc: Node, version: number) {}
  async load(_key: string): Promise<Node> {
    return this.specRegistry.schema.nodeFromJSON(rawDoc) as Node;
  }

  async update(
    _key: string,
    _getLatestDoc: () => { doc: Node; version: number },
  ) {}
}

export default function setup() {
  const specRegistry = new SpecRegistry(defaultSpecs());
  const disk = new SimpleDisk(specRegistry);

  const editorManager = new Manager(specRegistry.schema, {
    disk,
    collectUsersTimeout: 200,
    userWaitTimeout: 200,
    instanceCleanupTimeout: 500,
  });

  setupReactEditor({
    id: 'pm-root',
    specRegistry,
    plugins: () => [...defaultPlugins(), collabPlugin(editorManager)],
  });
}

function collabPlugin(editorManager: Manager) {
  // TODO fix types of collab plugin
  const sendRequest = (type: CollabRequestType, payload: any): any =>
    editorManager.handleRequest(type, payload).then((obj) => {
      return parseCollabResponse(obj);
    });

  return collabClient.plugins({
    docName: 'test-doc',
    clientID: 'client-' + uuid(4),
    async getDocument({ docName, userId }) {
      return sendRequest('get_document', {
        docName,
        userId,
      });
    },

    async pullEvents({ version, docName, userId, managerId }) {
      return sendRequest('pull_events', {
        docName,
        version,
        userId,
        managerId,
      });
    },

    async pushEvents({ version, steps, clientID, docName, userId, managerId }) {
      return sendRequest('push_events', {
        clientID,
        version,
        steps,
        docName,
        userId,
        managerId,
      });
    },
    onFatalError(error) {
      if (error.errorCode >= 500) {
        console.log(
          'editor received fatal error not restarting',
          error.message,
        );

        return false;
      }

      return true;
    },
  });
}
