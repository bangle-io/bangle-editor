import { collab } from 'prosemirror-collab';

import { CollabMessageBus, DEFAULT_MANAGER_ID } from '@bangle.dev/collab-comms';
import { Plugin } from '@bangle.dev/pm';
import { uuid } from '@bangle.dev/utils';

import { collabClientPlugin } from './collab-client';
import { hardResetClient, queryCollabState, queryFatalError } from './commands';

export const plugins = pluginsFactory;
export const commands = { queryFatalError, hardResetClient, queryCollabState };

export interface CollabExtensionOptions {
  requestTimeout?: number;
  clientID: string;
  collabMessageBus: CollabMessageBus;
  docName: string;
  managerId?: string;
  cooldownTime?: number;
  warmupTime?: number;
}

/**
 *
 * @param param0
 * @param param0.requestTimeout - timeout for the requests to the server.
 * @param param0.cooldownTime - time to wait before retrying after failure.
 * @param param0.warmupTime - time to wait before starting the collab session. Use this to avoid a bunch
 *                            of redundant getDocument request if you editor state
 *                            is modified a bunch of time on startup.
 */
function pluginsFactory({
  requestTimeout,
  clientID = 'client-' + uuid(),
  collabMessageBus,
  docName,
  managerId = DEFAULT_MANAGER_ID,
  cooldownTime = 100,
  warmupTime = 0,
}: CollabExtensionOptions) {
  const userId = 'user-' + clientID;
  return [
    collab({
      clientID,
    }) as Plugin,
    collabClientPlugin({
      requestTimeout,
      clientID,
      collabMessageBus,
      docName,
      managerId,
      cooldownTime,
      userId,
      warmupTime,
    }),
  ];
}
