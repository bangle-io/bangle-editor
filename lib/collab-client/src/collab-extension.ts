import { collab } from 'prosemirror-collab';

import { CollabMessageBus, MANAGER_ID } from '@bangle.dev/collab-server';
import { Plugin } from '@bangle.dev/pm';
import { uuid } from '@bangle.dev/utils';

import { collabClientPlugin } from './collab-client';
import {
  hardResetClient,
  onUpstreamChanges,
  queryFatalError,
} from './commands';

export const plugins = pluginsFactory;
export const commands = { onUpstreamChanges, queryFatalError, hardResetClient };

export interface CollabExtensionOptions {
  requestTimeout?: number;
  clientID: string;
  collabMessageBus: CollabMessageBus;
  docName: string;
  managerId?: string;
  cooldownTime?: number;
}

function pluginsFactory({
  // time to wait for a response from server before rejecting the request
  requestTimeout,
  clientID = 'client-' + uuid(),
  collabMessageBus,
  docName,
  managerId = MANAGER_ID,
  // time to wait before retrying a failed request
  cooldownTime = 100,
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
    }),
  ];
}
