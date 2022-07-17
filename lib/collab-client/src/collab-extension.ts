import { collab } from 'prosemirror-collab';

import { CollabManager } from '@bangle.dev/collab-server';
import { uuid } from '@bangle.dev/utils';

import { collabClientPlugin } from './collab-client';
import {
  hardResetClient,
  onUpstreamChanges,
  queryFatalError,
} from './commands';

const LOG = false;
const LOG_VERBOSE = false;
let log = LOG ? console.log.bind(console, 'collab/collab-extension') : () => {};

let logVerbose = LOG_VERBOSE
  ? console.log.bind(console, 'collab/collab-extension')
  : () => {};

export const plugins = pluginsFactory;
export const commands = { onUpstreamChanges, queryFatalError, hardResetClient };

export const RECOVERY_BACK_OFF = 50;

function pluginsFactory({
  clientID = 'client-' + uuid(),
  docName,
  sendManagerRequest,
  retryWaitTime = 100,
}: {
  clientID: string;
  docName: string;
  sendManagerRequest: CollabManager['handleRequest'];
  retryWaitTime?: number;
}) {
  const userId = 'user-' + clientID;
  return [
    collab({
      clientID,
    }),
    collabClientPlugin({
      clientID,
      docName,
      retryWaitTime,
      sendManagerRequest,
      userId,
    }),
  ];
}
