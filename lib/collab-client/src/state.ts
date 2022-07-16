import { getVersion, sendableSteps } from 'prosemirror-collab';

import { CollabFail, CollabRequestType } from '@bangle.dev/collab-server';
import { EditorView, Node, TextSelection } from '@bangle.dev/pm';
import { abortableSetTimeout } from '@bangle.dev/utils';

import { dispatchCollabPluginEvent, isOutdatedVersion } from './commands';
import {
  ClientInfo,
  CollabPluginContext,
  CollabStateName,
  EventType,
  FatalErrorEvent,
  InitDocEvent,
  InitErrorEvent,
  PullEvent,
  PushEvent,
  PushPullErrorEvent,
  ReadyEvent,
  RestartEvent,
  ValidEvents,
} from './common';
import { applyDoc, applySteps } from './helpers';

interface ActionParam {
  clientInfo: ClientInfo;
  context: CollabPluginContext;
  logger: (...args: any[]) => void;
  signal: AbortSignal;
  view: EditorView;
}

export type ValidCollabStates2 =
  | FatalErrorState2
  | InitDocState2
  | InitErrorState2
  | InitState2
  | PullState2
  | PushPullErrorState2
  | PushState2
  | ReadyState2;

export abstract class BaseState {
  abstract name: CollabStateName;
  abstract runAction(param: ActionParam): Promise<void>;

  // must be kept pure , sync and no side-effects
  abstract transition(event: ValidEvents): ValidCollabStates2;
}

export class FatalErrorState2 implements BaseState {
  name = CollabStateName.FatalError;

  constructor(
    public state: {
      message: string;
    },
  ) {}

  async runAction({ signal, clientInfo, logger }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    logger(
      `Freezing document(${clientInfo.docName}) to prevent further edits due to FatalError`,
    );
    return;
  }

  transition(event: any) {
    return this;
  }
}

export class InitState2 implements BaseState {
  name = CollabStateName.Init;

  constructor(public state = null) {}

  async runAction({ clientInfo, signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { docName, userId, sendManagerRequest } = clientInfo;
    const debugSource = `initStateAction:`;

    const result = await sendManagerRequest({
      type: CollabRequestType.GetDocument,
      payload: {
        docName: docName,
        userId: userId,
      },
    });

    if (signal.aborted) {
      return;
    }

    if (!result.ok) {
      dispatchCollabPluginEvent({
        collabEvent: {
          type: EventType.InitError,
          payload: { failure: result.body },
        },
        context: { debugInfo: debugSource },
      })(view.state, view.dispatch);
      return;
    }

    const { doc, managerId, version } = result.body;
    dispatchCollabPluginEvent({
      context: { debugInfo: debugSource },
      collabEvent: {
        type: EventType.InitDoc,
        payload: {
          doc: view.state.schema.nodeFromJSON(doc),
          version,
          managerId,
          selection: undefined,
        },
      },
    })(view.state, view.dispatch);

    return;
  }

  transition(event: InitDocEvent | InitErrorEvent) {
    const type = event.type;
    if (type === EventType.InitDoc) {
      const { payload } = event;
      return new InitDocState2({
        initialDoc: payload.doc,
        initialSelection: payload.selection,
        initialVersion: payload.version,
        managerId: payload.managerId,
      });
    } else if (type === EventType.InitError) {
      return new InitErrorState2({
        failure: event.payload.failure,
      });
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class InitDocState2 implements BaseState {
  name = CollabStateName.InitDoc;

  constructor(
    public state: {
      initialDoc: Node;
      initialVersion: number;
      initialSelection?: TextSelection;
      managerId: string;
    },
  ) {}

  async runAction({ signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { initialDoc, initialVersion, initialSelection } = this.state;

    if (!signal.aborted) {
      applyDoc(view, initialDoc, initialVersion, initialSelection);
      dispatchCollabPluginEvent({
        collabEvent: {
          type: EventType.Ready,
        },
        context: {
          debugInfo: `runAction:${this.name}`,
        },
      })(view.state, view.dispatch);
    }
  }

  transition(event: ReadyEvent) {
    const type = event.type;
    if (type === EventType.Ready) {
      return new ReadyState2(this.state);
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class InitErrorState2 implements BaseState {
  name = CollabStateName.InitError;

  constructor(
    public state: {
      failure: CollabFail;
    },
  ) {}

  async runAction(param: ActionParam) {
    await handleErrorStateAction({ ...param, collabState: this });
  }

  transition(event: RestartEvent | FatalErrorEvent) {
    const type = event.type;
    if (type === EventType.Restart) {
      return new InitState2();
    } else if (type === EventType.FatalError) {
      return new FatalErrorState2({ message: event.payload.message });
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class ReadyState2 implements BaseState {
  name = CollabStateName.Ready;

  constructor(public state: InitDocState2['state']) {}

  async runAction({ context, signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const debugString = `runActions:${this.name}`;

    if (!signal.aborted) {
      if (isOutdatedVersion()(view.state)) {
        dispatchCollabPluginEvent({
          context: {
            ...context,
            debugInfo: debugString + '(outdated-local-version)',
          },
          collabEvent: {
            type: EventType.Pull,
          },
        })(view.state, view.dispatch);
      } else if (sendableSteps(view.state)) {
        dispatchCollabPluginEvent({
          context: {
            ...context,
            debugInfo: debugString + '(sendable-steps)',
          },
          collabEvent: {
            type: EventType.Push,
          },
        })(view.state, view.dispatch);
      }
    }
    return;
  }

  transition(event: PullEvent | PushEvent) {
    const type = event.type;
    if (type === EventType.Push) {
      return new PushState2(this.state);
    } else if (type === EventType.Pull) {
      return new PullState2(this.state);
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class PushState2 implements BaseState {
  name = CollabStateName.Push;

  constructor(public state: InitDocState2['state']) {}

  async runAction({ clientInfo, signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { docName, userId, sendManagerRequest } = clientInfo;
    const debugSource = `pushStateAction:`;

    const steps = sendableSteps(view.state);

    if (!steps) {
      dispatchCollabPluginEvent({
        collabEvent: {
          type: EventType.Ready,
        },
        context: { debugInfo: debugSource + '(no steps):' },
      })(view.state, view.dispatch);
      return;
    }

    const { managerId } = this.state;

    const response = await sendManagerRequest({
      type: CollabRequestType.PushEvents,
      payload: {
        version: getVersion(view.state),
        steps: steps ? steps.steps.map((s) => s.toJSON()) : [],
        // TODO  the default value numerical 0 before
        clientID: (steps ? steps.clientID : 0) + '',
        docName: docName,
        userId: userId,
        managerId: managerId,
      },
    });

    if (signal.aborted) {
      return;
    }

    if (response.ok) {
      // Pull changes to confirm our steps and also
      // get any new steps from other clients
      dispatchCollabPluginEvent({
        collabEvent: {
          type: EventType.Pull,
        },
        context: { debugInfo: debugSource },
      })(view.state, view.dispatch);
    } else {
      dispatchCollabPluginEvent({
        collabEvent: {
          type: EventType.PushPullError,
          payload: { failure: response.body },
        },
        context: { debugInfo: debugSource },
      })(view.state, view.dispatch);
    }
    return;
  }

  transition(event: ReadyEvent | PullEvent | PushPullErrorEvent) {
    const type = event.type;
    if (type === EventType.Ready) {
      return new ReadyState2(this.state);
    } else if (type === EventType.Pull) {
      return new PullState2(this.state);
    } else if (type === EventType.PushPullError) {
      return new PushPullErrorState2({
        failure: event.payload.failure,
        initDocState: this.state,
      });
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class PullState2 implements BaseState {
  name = CollabStateName.Pull;

  constructor(public state: InitDocState2['state']) {}

  async runAction({ logger, clientInfo, signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { docName, userId, sendManagerRequest } = clientInfo;
    const { managerId } = this.state;
    const response = await sendManagerRequest({
      type: CollabRequestType.PullEvents,
      payload: {
        version: getVersion(view.state),
        docName: docName,
        userId: userId,
        managerId: managerId,
      },
    });
    if (signal.aborted) {
      return;
    }
    const debugSource = `pullStateAction:`;

    if (response.ok) {
      applySteps(view, response.body, logger);
      dispatchCollabPluginEvent({
        context: { debugInfo: debugSource },
        collabEvent: {
          type: EventType.Ready,
        },
      })(view.state, view.dispatch);
    } else {
      dispatchCollabPluginEvent({
        context: { debugInfo: debugSource },
        collabEvent: {
          type: EventType.PushPullError,
          payload: { failure: response.body },
        },
      })(view.state, view.dispatch);
    }
    return;
  }

  transition(event: ReadyEvent | PushPullErrorEvent) {
    const type = event.type;
    if (type === EventType.Ready) {
      return new ReadyState2(this.state);
    } else if (type === EventType.PushPullError) {
      return new PushPullErrorState2({
        failure: event.payload.failure,
        initDocState: this.state,
      });
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class PushPullErrorState2 implements BaseState {
  name = CollabStateName.PushPullError;

  constructor(
    public state: {
      failure: CollabFail;
      initDocState: InitDocState2['state'];
    },
  ) {}

  async runAction(param: ActionParam) {
    await handleErrorStateAction({ ...param, collabState: this });
  }

  transition(event: RestartEvent | PullEvent | FatalErrorEvent) {
    const type = event.type;
    if (type === EventType.Restart) {
      return new InitState2();
    } else if (type === EventType.Pull) {
      return new PullState2(this.state.initDocState);
    } else if (type === EventType.FatalError) {
      return new FatalErrorState2({ message: event.payload.message });
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

const handleErrorStateAction = async ({
  clientInfo,
  view,
  logger,
  signal,
  collabState,
}: ActionParam & { collabState: InitErrorState2 | PushPullErrorState2 }) => {
  if (signal.aborted) {
    return;
  }
  const failure = collabState.state.failure;
  logger('Recovering failure', failure);

  const debugSource = `pushPullErrorStateAction:${failure}:`;

  switch (failure) {
    case CollabFail.InvalidVersion:
    case CollabFail.IncorrectManager: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            dispatchCollabPluginEvent({
              context: { debugInfo: debugSource },
              collabEvent: {
                type: EventType.Restart,
              },
            })(view.state, view.dispatch);
          }
        },
        signal,
        clientInfo.retryWaitTime,
      );
      return;
    }
    case CollabFail.HistoryNotAvailable: {
      logger('History/Server not available');
      if (!signal.aborted) {
        dispatchCollabPluginEvent({
          context: { debugInfo: debugSource },
          collabEvent: {
            type: EventType.FatalError,
            payload: {
              message: 'History/Server not available',
            },
          },
        })(view.state, view.dispatch);
      }
      return;
    }
    case CollabFail.DocumentNotFound: {
      logger('Document not found');
      if (!signal.aborted) {
        dispatchCollabPluginEvent({
          collabEvent: {
            type: EventType.FatalError,
            payload: {
              message: 'Document not found',
            },
          },
          context: { debugInfo: debugSource },
        })(view.state, view.dispatch);
      }
      return;
    }
    // 409
    case CollabFail.OutdatedVersion: {
      dispatchCollabPluginEvent({
        collabEvent: {
          type: EventType.Pull,
        },
        context: { debugInfo: debugSource },
      })(view.state, view.dispatch);
      return;
    }

    // 500
    case CollabFail.ApplyFailed: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            dispatchCollabPluginEvent({
              collabEvent: {
                type: EventType.Pull,
              },
              context: { debugInfo: debugSource },
            })(view.state, view.dispatch);
          }
        },
        signal,
        clientInfo.retryWaitTime,
      );

      return;
    }

    default: {
      let val: never = failure;
      throw new Error(`Unknown failure ${failure}`);
    }
  }
};
