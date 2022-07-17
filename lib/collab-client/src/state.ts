import { getVersion, sendableSteps } from 'prosemirror-collab';

import { CollabFail, CollabRequestType } from '@bangle.dev/collab-server';
import {
  Command,
  EditorState,
  EditorView,
  Node,
  TextSelection,
} from '@bangle.dev/pm';
import { abortableSetTimeout } from '@bangle.dev/utils';

import { isOutdatedVersion } from './commands';
import {
  ClientInfo,
  collabClientKey,
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
  logger: (...args: any[]) => void;
  signal: AbortSignal;
  view: EditorView;
}

export type ValidCollabStates =
  | FatalErrorState
  | InitDocState
  | InitErrorState
  | InitState
  | PullState
  | PushPullErrorState
  | PushState
  | ReadyState;

export abstract class CollabBaseState {
  // If false, the document is frozen and no edits and _almost_ no transactions are allowed.
  // Some collab tr's are allowed.
  editingAllowed: boolean = true;
  debugInfo?: string;

  protected dispatchCollabPluginEvent(data: {
    collabEvent?: ValidEvents;
    debugInfo?: string;
  }): Command {
    return (state, dispatch) => {
      dispatch?.(state.tr.setMeta(collabClientKey, data));
      return true;
    };
  }

  public isFatalState(): this is FatalErrorState {
    return this instanceof FatalErrorState;
  }

  public isReadyState(): this is ReadyState {
    return this instanceof ReadyState;
  }

  abstract name: CollabStateName;

  abstract runAction(param: ActionParam): Promise<void>;
  // must be kept pure , sync and no side-effects
  abstract transition(event: ValidEvents): ValidCollabStates;
}

export class FatalErrorState extends CollabBaseState {
  name = CollabStateName.FatalError;
  editingAllowed = false;

  constructor(
    public state: {
      message: string;
    },
    public debugInfo?: string,
  ) {
    super();
  }

  dispatch(
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: never,
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

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

export class InitState extends CollabBaseState {
  name = CollabStateName.Init;
  editingAllowed = false;

  constructor(public state = {}, public debugInfo?: string) {
    super();
  }

  dispatch(
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<InitState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

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
      this.dispatch(
        view.state,
        view.dispatch,
        {
          type: EventType.InitError,
          payload: { failure: result.body },
        },
        debugSource,
      );
      return;
    }

    const { doc, managerId, version } = result.body;

    this.dispatch(
      view.state,
      view.dispatch,
      {
        type: EventType.InitDoc,
        payload: {
          doc: view.state.schema.nodeFromJSON(doc),
          version,
          managerId,
          selection: undefined,
        },
      },
      debugSource,
    );
    return;
  }

  transition(event: InitDocEvent | InitErrorEvent) {
    const type = event.type;
    if (type === EventType.InitDoc) {
      const { payload } = event;
      return new InitDocState({
        initialDoc: payload.doc,
        initialSelection: payload.selection,
        initialVersion: payload.version,
        managerId: payload.managerId,
      });
    } else if (type === EventType.InitError) {
      return new InitErrorState({
        failure: event.payload.failure,
      });
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class InitDocState extends CollabBaseState {
  name = CollabStateName.InitDoc;
  editingAllowed = false;

  constructor(
    public state: {
      initialDoc: Node;
      initialVersion: number;
      initialSelection?: TextSelection;
      managerId: string;
    },
    public debugInfo?: string,
  ) {
    super();
  }

  dispatch(
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<InitDocState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction({ signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { initialDoc, initialVersion, initialSelection } = this.state;

    if (!signal.aborted) {
      const success = applyDoc(
        view,
        initialDoc,
        initialVersion,
        initialSelection,
      );

      if (success === false) {
        this.dispatch(view.state, view.dispatch, {
          type: EventType.FatalError,
          payload: {
            message: 'Failed to load initial doc',
          },
        });
      } else {
        this.dispatch(
          view.state,
          view.dispatch,
          {
            type: EventType.Ready,
          },
          `runAction:${this.name}`,
        );
      }
    }
  }

  transition(event: ReadyEvent | FatalErrorEvent) {
    const type = event.type;
    if (type === EventType.Ready) {
      return new ReadyState(this.state);
    } else if (type === EventType.FatalError) {
      return new FatalErrorState({ message: event.payload.message });
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class InitErrorState extends CollabBaseState {
  name = CollabStateName.InitError;

  constructor(
    public state: {
      failure: CollabFail;
    },
    public debugInfo?: string,
  ) {
    super();
  }

  dispatch(
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<InitErrorState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction(param: ActionParam) {
    await handleErrorStateAction({ ...param, collabState: this });
  }

  transition(event: RestartEvent | FatalErrorEvent) {
    const type = event.type;
    if (type === EventType.Restart) {
      return new InitState();
    } else if (type === EventType.FatalError) {
      return new FatalErrorState({ message: event.payload.message });
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class ReadyState extends CollabBaseState {
  name = CollabStateName.Ready;

  constructor(public state: InitDocState['state'], public debugInfo?: string) {
    super();
  }

  dispatch(
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: PullEvent | PushEvent,
    debugInfo?: string,
  ): boolean {
    return this.dispatchCollabPluginEvent({
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction({ signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const debugString = `runActions:${this.name}`;

    if (!signal.aborted) {
      if (isOutdatedVersion()(view.state)) {
        this.dispatch(
          view.state,
          view.dispatch,
          {
            type: EventType.Pull,
          },
          debugString + '(outdated-local-version)',
        );
      } else if (sendableSteps(view.state)) {
        this.dispatch(
          view.state,
          view.dispatch,
          {
            type: EventType.Push,
          },
          debugString + '(sendable-steps)',
        );
      }
    }
    return;
  }

  transition(event: Parameters<ReadyState['dispatch']>[2]) {
    const type = event.type;
    if (type === EventType.Push) {
      return new PushState(this.state);
    } else if (type === EventType.Pull) {
      return new PullState(this.state);
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class PushState extends CollabBaseState {
  name = CollabStateName.Push;

  constructor(public state: InitDocState['state'], public debugInfo?: string) {
    super();
  }

  dispatch(
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<PushState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction({ clientInfo, signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { docName, userId, sendManagerRequest } = clientInfo;
    const debugSource = `pushStateAction:`;

    const steps = sendableSteps(view.state);

    if (!steps) {
      this.dispatch(
        view.state,
        view.dispatch,
        {
          type: EventType.Ready,
        },
        debugSource + '(no steps):',
      );

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
      this.dispatch(
        view.state,
        view.dispatch,
        {
          type: EventType.Pull,
        },
        debugSource,
      );
    } else {
      this.dispatch(
        view.state,
        view.dispatch,
        {
          type: EventType.PushPullError,
          payload: { failure: response.body },
        },
        debugSource,
      );
    }
    return;
  }

  transition(event: ReadyEvent | PullEvent | PushPullErrorEvent) {
    const type = event.type;
    if (type === EventType.Ready) {
      return new ReadyState(this.state);
    } else if (type === EventType.Pull) {
      return new PullState(this.state);
    } else if (type === EventType.PushPullError) {
      return new PushPullErrorState({
        failure: event.payload.failure,
        initDocState: this.state,
      });
    } else {
      let val: never = type;
      throw new Error('Invalid event');
    }
  }
}

export class PullState extends CollabBaseState {
  name = CollabStateName.Pull;

  constructor(public state: InitDocState['state'], public debugInfo?: string) {
    super();
  }

  dispatch(
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<PullState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

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
      const success = applySteps(view, response.body, logger);
      if (success === false) {
        this.dispatch(
          view.state,
          view.dispatch,
          {
            type: EventType.PushPullError,
            payload: { failure: CollabFail.ApplyFailed },
          },
          debugSource + '(local-apply-failed)',
        );
      } else {
        this.dispatch(
          view.state,
          view.dispatch,
          {
            type: EventType.Ready,
          },
          debugSource,
        );
      }
    } else {
      this.dispatch(
        view.state,
        view.dispatch,
        {
          type: EventType.PushPullError,
          payload: { failure: response.body },
        },
        debugSource,
      );
    }
    return;
  }

  transition(event: ReadyEvent | PushPullErrorEvent) {
    const type = event.type;
    if (type === EventType.Ready) {
      return new ReadyState(this.state);
    } else if (type === EventType.PushPullError) {
      return new PushPullErrorState({
        failure: event.payload.failure,
        initDocState: this.state,
      });
    } else {
      let val: never = type;
      throw new Error('Invalid event ' + type);
    }
  }
}

export class PushPullErrorState extends CollabBaseState {
  name = CollabStateName.PushPullError;

  constructor(
    public state: {
      failure: CollabFail;
      initDocState: InitDocState['state'];
    },
    public debugInfo?: string,
  ) {
    super();
  }

  dispatch(
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<PushPullErrorState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction(param: ActionParam) {
    await handleErrorStateAction({ ...param, collabState: this });
  }

  transition(event: RestartEvent | PullEvent | FatalErrorEvent) {
    const type = event.type;
    if (type === EventType.Restart) {
      return new InitState();
    } else if (type === EventType.Pull) {
      return new PullState(this.state.initDocState);
    } else if (type === EventType.FatalError) {
      return new FatalErrorState({ message: event.payload.message });
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
}: ActionParam & { collabState: InitErrorState | PushPullErrorState }) => {
  if (signal.aborted) {
    return;
  }
  const failure = collabState.state.failure;

  logger('Handling failure=', failure, 'currentState=', collabState.name);

  const debugSource = `pushPullErrorStateAction:${failure}:`;

  switch (failure) {
    case CollabFail.InvalidVersion:
    case CollabFail.IncorrectManager: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            collabState.dispatch(
              view.state,
              view.dispatch,
              {
                type: EventType.Restart,
              },
              debugSource,
            );
          }
        },
        signal,
        clientInfo.retryWaitTime,
      );
      return;
    }
    case CollabFail.HistoryNotAvailable: {
      collabState.dispatch(
        view.state,
        view.dispatch,
        {
          type: EventType.FatalError,
          payload: {
            message: 'History/Server not available',
          },
        },
        debugSource,
      );
      return;
    }
    case CollabFail.DocumentNotFound: {
      logger('Document not found');
      collabState.dispatch(
        view.state,
        view.dispatch,
        {
          type: EventType.FatalError,
          payload: {
            message: 'Document not found',
          },
        },
        debugSource,
      );
      return;
    }
    // 409
    case CollabFail.OutdatedVersion: {
      if (collabState instanceof PushPullErrorState) {
        collabState.dispatch(
          view.state,
          view.dispatch,
          {
            type: EventType.Pull,
          },
          debugSource,
        );
      } else {
        collabState.dispatch(
          view.state,
          view.dispatch,
          {
            type: EventType.FatalError,
            payload: {
              message: `Cannot handle ${failure} in state=${collabState.name}`,
            },
          },
          debugSource,
        );
      }

      return;
    }

    // 500
    case CollabFail.ApplyFailed: {
      if (collabState instanceof PushPullErrorState) {
        abortableSetTimeout(
          () => {
            if (!signal.aborted) {
              collabState.dispatch(
                view.state,
                view.dispatch,
                {
                  type: EventType.Pull,
                },
                debugSource,
              );
            }
          },
          signal,
          clientInfo.retryWaitTime,
        );
      } else {
        collabState.dispatch(
          view.state,
          view.dispatch,
          {
            type: EventType.FatalError,
            payload: {
              message: `Cannot handle ${failure} in state=${collabState.name}`,
            },
          },
          debugSource,
        );
      }
      return;
    }

    default: {
      let val: never = failure;
      throw new Error(`Unknown failure ${failure}`);
    }
  }
};
