import { CollabMessageBus, MessageType } from './collab-message-bus';
import { NetworkingError } from './common';

const DEFAULT_TIMEOUT = 1000;

// wraps the message in a request form - ie sends the message and waits for a response
// if it doesn't get any response within the `requestTimeout`, rejects with a  NetworkingError.Timeout
export function wrapRequest(
  payload: unknown,
  {
    emitter,
    to,
    from,
    requestTimeout = DEFAULT_TIMEOUT,
  }: {
    to: string;
    from: string;
    requestTimeout?: number;
    emitter: CollabMessageBus;
  },
): Promise<unknown> {
  return new Promise((res, rej) => {
    const id = generateUUID();
    // NOTE: the field `id` of a PONG message will be the same as the PING message
    const removeListener = emitter.receiveMessages(from, (message) => {
      if (message.type !== MessageType.PONG || message.id !== id) {
        return;
      }

      clearTimeout(timer);
      removeListener();
      return res(message.messageBody);
    });

    const timer = setTimeout(() => {
      removeListener();
      rej(new Error(NetworkingError.Timeout));
    }, requestTimeout);

    emitter.transmit({
      to,
      from,
      id,
      messageBody: payload,
      type: MessageType.PING,
    });
  });
}

export function generateUUID(): string {
  return (
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16) +
    '-' +
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16) +
    '-' +
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)
  );
}
