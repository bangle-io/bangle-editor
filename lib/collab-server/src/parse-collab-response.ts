import { CollabError, ValidErrorCodes } from './collab-error';
import { Manager } from './manager';

export function parseCollabResponse(
  payload: Awaited<ReturnType<Manager['handleRequest']>>,
) {
  if (payload.status === 'ok') {
    return payload.body;
  }
  if (payload.status === 'error') {
    throw new CollabError(
      payload.body.errorCode as ValidErrorCodes,
      payload.body.message,
    );
  }
  throw new Error('Unknown status');
}
