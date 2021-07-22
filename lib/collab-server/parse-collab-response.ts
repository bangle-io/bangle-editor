import { CollabError, ValidErrorCodes } from './collab-error';
import { Manager } from './manager';

type UnPromisify<T> = T extends Promise<infer U> ? U : T;

export function parseCollabResponse(
  payload: UnPromisify<ReturnType<Manager['handleRequest']>>,
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
