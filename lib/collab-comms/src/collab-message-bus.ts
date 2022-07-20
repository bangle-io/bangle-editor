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

export class CollabMessageBus {
  static WILD_CARD = Symbol('WILD_CARD');
  private _destroyed = false;
  private _listeners = new Map<string | WildCard, Set<CollabListener<any>>>();
  private _seenMessages = new WeakSet<Message<any>>();

  constructor(
    private _opts: {
      // Slows down message emitter to emulate slow network
      // Good for debugging purposes (non-production) only
      debugSlowdown?: number;
    } = {},
  ) {}

  destroy(name?: string | WildCard) {
    if (name == null) {
      this._listeners.clear();
    } else {
      this._listeners.delete(name);
    }
    this._destroyed = true;
  }

  // if name is WILD_CARD, then it will receive every message irrespective of the `to` field.
  receiveMessages(name: string | WildCard, callback: CollabListener<any>) {
    if (this._destroyed) {
      return () => {};
    }
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
    if (this._seenMessages.has(message)) {
      return;
    }
    this._seenMessages.add(message);

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
