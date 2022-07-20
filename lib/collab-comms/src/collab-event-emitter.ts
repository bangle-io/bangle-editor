import { NetworkingError } from './common';

const DEFAULT_TIMEOUT = 1000;

export enum MessageType {
  PING = 'PING',
  PONG = 'PONG',
  BROADCAST = 'BROADCAST',
}

export type CollabListener<R> = (message: Message<R>) => void;

export type Message<T> =
  | {
      to: string;
      from: string;
      id: string;
      messageBody: T;
      type: MessageType.PING;
    }
  | {
      to: string;
      from: string;
      id: string;
      messageBody: T;
      type: MessageType.PONG;
    }
  | {
      to: undefined;
      from: string;
      id: string;
      messageBody: T;
      type: MessageType.BROADCAST;
    };

type WildCard = typeof CollabMessageBus['WILD_CARD'];

const seenMessages = new WeakSet<Message<any>>();

export class CollabMessageBus {
  static WILD_CARD = Symbol('WILD_CARD');

  private _listeners = new Map<string | WildCard, Set<CollabListener<any>>>();

  constructor(
    private _opts: {
      // Slows down message emitter to emulate slow network
      // Good for debugging purposes (non-production) only
      debugSlowdown?: number;
    } = {},
  ) {}

  off(name?: string | WildCard) {
    if (name == null) {
      this._listeners.clear();
    } else {
      this._listeners.delete(name);
    }
  }

  // if name is WILD_CARD, then it will receive every message irrespective of the `to` field.
  receiveMessages(name: string | WildCard, callback: CollabListener<any>) {
    let listeners = this._listeners.get(name);

    if (!listeners) {
      listeners = new Set();
      this._listeners.set(name, listeners);
    }

    listeners.add(callback);

    return () => {
      const listeners = this._listeners.get(name);
      listeners?.delete(callback);
      if (listeners?.size === 0) {
        this._listeners.delete(name);
      }
    };
  }

  // receive messages that specify the give `name` in the `to` field.
  transmit<T>(message: Message<T>) {
    // ignore message if it has already been seen
    if (seenMessages.has(message)) {
      return;
    }
    seenMessages.add(message);

    if (message.type === MessageType.BROADCAST && message.to != null) {
      throw new Error('Broadcast message must not have a `to` field');
    }
    if (
      typeof message.to !== 'string' &&
      (message.type === MessageType.PING || message.type === MessageType.PONG)
    ) {
      throw new Error('PING/PONG message must have a `to` field');
    }

    const _transmit = () => {
      let targetListeners = message.to
        ? this._listeners.get(message.to) || new Set()
        : // if there is no `to` field, then it is a broadcast to all.
          // Using a set to prevent duplicates firing of broadcast if same listener is attached
          // to multiple `to`s.
          new Set([...this._listeners.values()].flatMap((r) => [...r]));

      // Add listeners which listen to any message
      let wildcardListeners =
        this._listeners.get(CollabMessageBus.WILD_CARD) || new Set();

      // Remove duplicate listeners - a listener should only receive a message once
      new Set([...wildcardListeners, ...targetListeners])?.forEach(
        (listener) => {
          listener(message);
        },
      );
    };

    if (this._opts.debugSlowdown == null) {
      _transmit();
    } else {
      setTimeout(_transmit, this._opts.debugSlowdown);
    }
  }
}

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

function generateUUID(): string {
  return (
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16) +
    '-' +
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16) +
    '-' +
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)
  );
}
