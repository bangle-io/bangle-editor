import { sleep } from '@bangle.dev/test-helpers';

import {
  CollabMessageBus,
  Message,
  MessageType,
} from '../src/collab-message-bus';

beforeEach(() => {
  jest.spyOn(Map.prototype, 'delete');
  jest.spyOn(Map.prototype, 'clear');
  jest.spyOn(Set.prototype, 'delete');
  jest.spyOn(Set.prototype, 'clear');
});

const samplePingMessage = (
  message: Partial<Message<string>> = {},
): Message<any> =>
  Object.assign(
    {
      to: 'test-a',
      from: 'from-test-b',
      id: 'test-id',
      messageBody: 'test-message',
      type: MessageType.PING,
    },
    message,
  );

const sampleBroadcastMessage = ({ id }: { id?: string } = {}): Message<any> =>
  Object.assign({
    to: undefined,
    from: 'from-test-b',
    id: id || 'test-id',
    messageBody: 'test-message',
    type: MessageType.BROADCAST,
  });

test('basic operations works', () => {
  const messageBus = new CollabMessageBus();

  const receiveMessage = jest.fn();
  const unregister = messageBus.receiveMessages('test-a', receiveMessage);
  messageBus.transmit(samplePingMessage());

  expect(receiveMessage).toBeCalledTimes(1);
  expect(receiveMessage).nthCalledWith(1, {
    to: 'test-a',
    from: 'from-test-b',
    id: 'test-id',
    messageBody: 'test-message',
    type: MessageType.PING,
  });

  unregister();

  messageBus.transmit(samplePingMessage({ id: 'test-id-2' }));
  expect(receiveMessage).toBeCalledTimes(1);
  expect(Map.prototype.delete).toBeCalledTimes(1);
  expect(Set.prototype.delete).toBeCalledTimes(1);
  expect(Map.prototype.delete).nthCalledWith(1, 'test-a');
});

test('unregistering two listeners to same message', () => {
  const messageBus = new CollabMessageBus();

  const receiveMessage1 = jest.fn();
  const receiveMessage2 = jest.fn();
  const unregister1 = messageBus.receiveMessages('test-a', receiveMessage1);
  const unregister2 = messageBus.receiveMessages('test-a', receiveMessage2);

  let message = samplePingMessage();
  messageBus.transmit(message);

  expect(receiveMessage1).toBeCalledTimes(1);
  expect(receiveMessage2).toBeCalledTimes(1);

  expect(receiveMessage1.mock.calls[0][0]).toBe(message);
  expect(receiveMessage2.mock.calls[0][0]).toBe(message);

  // sending to wrong name
  messageBus.transmit(samplePingMessage({ to: 'test-b' }));
  expect(receiveMessage1).toBeCalledTimes(1);
  expect(receiveMessage2).toBeCalledTimes(1);

  unregister1();
  expect(Set.prototype.delete).toBeCalledTimes(1);
  // Map delete should not be called yet! since there is still one active listener for this message
  expect(Map.prototype.delete).toBeCalledTimes(0);

  unregister2();
  expect(Set.prototype.delete).toBeCalledTimes(2);
  expect(Map.prototype.delete).toBeCalledTimes(1);
});

test('destroy works', () => {
  const messageBus = new CollabMessageBus();
  const receiveMessage = jest.fn();
  const unregister = messageBus.receiveMessages('test-a', receiveMessage);

  messageBus.destroy();
  messageBus.transmit(samplePingMessage());

  // should not transmit messages
  expect(receiveMessage).toBeCalledTimes(0);
  expect(Map.prototype.clear).toBeCalledTimes(1);

  // should not register more listeners
  const receiveMessage2 = jest.fn();
  const unregister2 = messageBus.receiveMessages('test-b', receiveMessage2);

  messageBus.transmit(samplePingMessage());
  expect(receiveMessage2).toBeCalledTimes(0);
  unregister2();
  expect(receiveMessage2).toBeCalledTimes(0);
  expect(Map.prototype.clear).toBeCalledTimes(1);
  expect(Map.prototype.delete).toBeCalledTimes(0);
});

test('wildcard listener', () => {
  const messageBus = new CollabMessageBus();

  const receiveMessageA1 = jest.fn();
  const receiveMessageA2 = jest.fn();
  const receiveMessageB1 = jest.fn();
  const wildcardListener = jest.fn();
  const unregisterA1 = messageBus.receiveMessages('test-a', receiveMessageA1);
  const unregisterA2 = messageBus.receiveMessages('test-a', receiveMessageA2);
  const unregisterB1 = messageBus.receiveMessages('test-b', receiveMessageB1);
  let unregisterWildcard = messageBus.receiveMessages(
    CollabMessageBus.WILD_CARD,
    wildcardListener,
  );

  // to `b`
  messageBus.transmit(samplePingMessage({ to: 'test-b' }));
  expect(receiveMessageA1).toBeCalledTimes(0);
  expect(receiveMessageA2).toBeCalledTimes(0);
  expect(receiveMessageB1).toBeCalledTimes(1);
  expect(wildcardListener).toBeCalledTimes(1);
  expect(wildcardListener).nthCalledWith(
    1,
    samplePingMessage({ to: 'test-b' }),
  );

  // to `a`
  messageBus.transmit(samplePingMessage({ to: 'test-a' }));
  expect(receiveMessageA1).toBeCalledTimes(1);
  expect(receiveMessageA2).toBeCalledTimes(1);
  expect(receiveMessageB1).toBeCalledTimes(1);
  expect(wildcardListener).toBeCalledTimes(2);
  expect(wildcardListener).nthCalledWith(
    2,
    samplePingMessage({ to: 'test-a' }),
  );

  // some random to
  messageBus.transmit(samplePingMessage({ to: 'some-to-1' }));
  expect(receiveMessageA1).toBeCalledTimes(1);
  expect(receiveMessageA2).toBeCalledTimes(1);
  expect(receiveMessageB1).toBeCalledTimes(1);
  expect(wildcardListener).toBeCalledTimes(3);
  expect(wildcardListener).nthCalledWith(
    3,
    samplePingMessage({ to: 'some-to-1' }),
  );

  // broadcast
  messageBus.transmit(sampleBroadcastMessage({}));
  expect(receiveMessageA1).toBeCalledTimes(2);
  expect(receiveMessageA2).toBeCalledTimes(2);
  expect(receiveMessageB1).toBeCalledTimes(2);
  expect(wildcardListener).toBeCalledTimes(4);
  expect(wildcardListener).nthCalledWith(4, sampleBroadcastMessage({}));

  unregisterWildcard();
  messageBus.transmit(sampleBroadcastMessage({}));
  expect(wildcardListener).toBeCalledTimes(4);

  const wildcardListener2 = jest.fn();
  messageBus.receiveMessages(CollabMessageBus.WILD_CARD, wildcardListener2);

  expect(wildcardListener2).toBeCalledTimes(0);
  messageBus.transmit(sampleBroadcastMessage({}));
  expect(wildcardListener2).toBeCalledTimes(1);
  expect(wildcardListener2).nthCalledWith(1, sampleBroadcastMessage({}));
});

test('debugSlowdown', async () => {
  const messageBus = new CollabMessageBus({ debugSlowdown: 30 });
  await sleep(10);

  const receiveMessage = jest.fn();
  const unregister = messageBus.receiveMessages('test-a', receiveMessage);
  messageBus.transmit(samplePingMessage());
  expect(receiveMessage).toBeCalledTimes(0);

  await sleep(30);
  expect(receiveMessage).toBeCalledTimes(1);

  // unregister while timeout is still running
  messageBus.transmit(samplePingMessage());
  await sleep(10);
  unregister();
  await sleep(50);
  expect(receiveMessage).toBeCalledTimes(1);
});

test('repeating broadcast is ignored', async () => {
  const messageBus = new CollabMessageBus();

  const message = samplePingMessage();

  const receiveMessageA1 = jest.fn();
  const receiveMessageA2 = jest.fn();
  const receiveMessageB1 = jest.fn();
  const wildcardListener = jest.fn();
  messageBus.receiveMessages('test-a', receiveMessageA1);
  messageBus.receiveMessages('test-a', receiveMessageA2);
  messageBus.receiveMessages('test-b', receiveMessageB1);
  messageBus.receiveMessages(CollabMessageBus.WILD_CARD, wildcardListener);

  messageBus.transmit(message);
  expect(receiveMessageA1).toBeCalledTimes(1);
  expect(receiveMessageA2).toBeCalledTimes(1);
  expect(wildcardListener).toBeCalledTimes(1);

  // repeat transmission should be ignored
  messageBus.transmit(message);
  expect(receiveMessageA1).toBeCalledTimes(1);
  expect(receiveMessageA2).toBeCalledTimes(1);
  expect(wildcardListener).toBeCalledTimes(1);
});
