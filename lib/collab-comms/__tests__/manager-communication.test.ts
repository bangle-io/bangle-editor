import { ClientCommunication } from '../src/client-communication';
import { CollabMessageBus } from '../src/collab-message-bus';
import {
  CollabClientRequestType,
  CollabManagerBroadCastType,
  PushEventsResponseBody,
  RequestOkResponse,
} from '../src/common';
import { ManagerCommunication } from '../src/manager-communication';

test('broadcasting new version', () => {
  const onNewVersion = jest.fn();
  const onResetClient = jest.fn();
  const bus = new CollabMessageBus();

  new ClientCommunication({
    docName: 'test-doc-1',
    messageBus: bus,
    clientId: 'client-1',
    signal: new AbortController().signal,
    managerId: 'test-manager',
    onNewVersion,
    onResetClient,
  });

  const manager = new ManagerCommunication(
    'test-manager',
    bus,
    jest.fn(async () => {
      const result: RequestOkResponse<
        CollabClientRequestType.PushEvents,
        PushEventsResponseBody
      > = {
        type: CollabClientRequestType.PushEvents,
        ok: true,
        body: {
          empty: null,
        },
      };

      return result;
    }),
    new AbortController().signal,
  );

  manager.broadcast({
    type: CollabManagerBroadCastType.NewVersion,
    body: {
      docName: 'test-doc-1',
      version: 3,
    },
  });

  expect(onNewVersion).toBeCalledTimes(1);
  expect(onNewVersion).nthCalledWith(1, {
    version: 3,
    docName: 'test-doc-1',
  });

  // broadcasting some other docName
  manager.broadcast({
    type: CollabManagerBroadCastType.NewVersion,
    body: {
      docName: 'test-doc-3',
      version: 4,
    },
  });

  // onNewVersion should not be called
  expect(onNewVersion).toBeCalledTimes(1);
});
